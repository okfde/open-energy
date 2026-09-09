#!/usr/bin/env python3
"""Fetch the amtliche Solarpotenzial-Statistik (Dach & Freifläche) für alle
413 Brandenburger Gemeinden vom WFS-Dienst des Energieportals Brandenburg
(solaratlas_solarbericht), inklusive Gemeinde-Geometrien.

Keine Zugangsdaten nötig – der Dienst ist öffentlich abrufbar.

Schreibt die rohe FeatureCollection nach scripts/_cache/potenzial_raw.geojson.
build_data.py liest diese Datei anschließend ein.
"""
import json
import sys
import time
from pathlib import Path

import requests

WFS_URL = "https://energieportal-brandenburg.de/geoserver/solaratlas/ows"
LAYER = "solaratlas:solaratlas_solarbericht"
CACHE_DIR = Path(__file__).parent / "_cache"
OUT_FILE = CACHE_DIR / "potenzial_raw.geojson"

MAX_RETRIES = 4
RETRY_DELAY_S = 5


def fetch_with_retry(params):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(WFS_URL, params=params, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except (requests.RequestException, ValueError) as exc:
            last_error = exc
            print(f"  Versuch {attempt}/{MAX_RETRIES} fehlgeschlagen: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S)
    raise RuntimeError(f"WFS-Abruf endgültig fehlgeschlagen: {last_error}")


def main():
    # GetFeature mit outputFormat=application/json liefert direkt eine
    # vollständige GeoJSON-FeatureCollection inkl. Geometrie (EPSG:4326).
    print(f"Lade Solarpotenzial-Statistik von {WFS_URL} …")
    data = fetch_with_retry({
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
        "count": 1000,  # > 413, holt in einem Rutsch alle Gemeinden
    })

    features = data.get("features", [])
    print(f"Erhalten: {len(features)} Gemeinden "
          f"(numberMatched={data.get('numberMatched')}, numberReturned={data.get('numberReturned')})")

    if len(features) < 400:
        print(
            "WARNUNG: Deutlich weniger als die erwarteten 413 Gemeinden erhalten "
            "– Dienst ggf. unvollständig oder Layer-Schema geändert. Bitte Ergebnis prüfen.",
            file=sys.stderr,
        )

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
