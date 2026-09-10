#!/usr/bin/env python3
"""Fetch den Bestand an Balkonkraftwerken (steckerfertige Solaranlagen)
"in Betrieb" je Gemeinde – deutschlandweit – aus dem Marktstammdatenregister
(MaStR). Nur für den zusätzlichen "Balkonkraftwerke je 1.000 Einwohner
(Deutschland)"-Kartenfilter; alle übrigen Filter bleiben Brandenburg-only
und unverändert.

Im Unterschied zu fetch_bestand.py:
  - keine Bundesland-Einschränkung (ganz Deutschland)
  - nur eine Solaranlagen-Art (SteckerfertigeSolaranlage)
  - liest die ca. 11.000 AGS-Schlüssel aus
    scripts/_cache/gemeinden_de_raw.geojson (von fetch_gemeinden_de.py)

Zugangsdaten wie bei fetch_bestand.py über MASTR_API_KEY und
MASTR_MARKTAKTEUR_MASTR_NUMMER (siehe README.md).

Läuft – wegen ~11.000 Gemeinden – deutlich länger als der
Brandenburg-Abruf; sollte daher NICHT gleichzeitig mit fetch_bestand.py
laufen (selbes Nutzerkonto/Rate-Limit). Wie fetch_bestand.py: speichert
fortlaufend, ist unterbrechbar und setzt bei erneutem Aufruf automatisch
fort (--force erzwingt Neustart, --limit N begrenzt zum Testen).
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
import zeep
from zeep.exceptions import Fault, TransportError

WSDL_URL = "https://www.marktstammdatenregister.de/MaStRAPI/wsdl/mastr.wsdl"
ENERGIETRAEGER = "SolareStrahlungsenergie"
BETRIEBSSTATUS = "InBetrieb"
ART_DER_SOLARANLAGE = "SteckerfertigeSolaranlage"

PAGE_LIMIT = 2000
CALL_DELAY_S = 0.2
MAX_RETRIES = 5
RETRY_DELAY_S = 10

SCRIPT_DIR = Path(__file__).parent
CACHE_DIR = SCRIPT_DIR / "_cache"
GEMEINDEN_DE_CACHE = CACHE_DIR / "gemeinden_de_raw.geojson"
OUT_FILE = CACHE_DIR / "balkon_de.json"


def load_ags_list():
    if not GEMEINDEN_DE_CACHE.exists():
        sys.exit(
            f"Fehlt: {GEMEINDEN_DE_CACHE}\n"
            "Bitte zuerst 'python3 fetch_gemeinden_de.py' ausführen (liefert die "
            "bundesweite Gemeindeliste, aus der die AGS-Schlüssel gelesen werden)."
        )
    data = json.loads(GEMEINDEN_DE_CACHE.read_text(encoding="utf-8"))
    ags_list = [f["properties"]["ags"] for f in data["features"]]
    if len(ags_list) < 10000:
        print(f"WARNUNG: nur {len(ags_list)} Gemeinden in {GEMEINDEN_DE_CACHE} (erwartet: ~11.000).",
              file=sys.stderr)
    return ags_list


def call_with_retry(fn, *args, **kwargs):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        # requests.exceptions.ConnectionError/Timeout do NOT inherit from the
        # builtin ConnectionError/TimeoutError despite the similar names —
        # catching only the builtins let real network errors (e.g. "No route
        # to host") crash the whole run uncaught. requests.RequestException
        # covers those; OSError covers lower-level socket errors.
        except (Fault, TransportError, requests.exceptions.RequestException, OSError) as exc:
            last_error = exc
            print(f"    Versuch {attempt}/{MAX_RETRIES} fehlgeschlagen: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S)
    raise RuntimeError(f"MaStR-Aufruf endgültig fehlgeschlagen: {last_error}")


def fetch_balkon(service, api_key, marktakteur_nr, ags):
    anzahl = 0
    kwp = 0.0
    start_ab = 1
    while True:
        response = call_with_retry(
            service.GetGefilterteListeStromErzeuger,
            apiKey=api_key,
            marktakteurMastrNummer=marktakteur_nr,
            energietraeger=ENERGIETRAEGER,
            einheitBetriebsstatus=BETRIEBSSTATUS,
            Gemeindeschluessel=ags,
            ArtDerSolaranlage=ART_DER_SOLARANLAGE,
            startAb=start_ab,
            limit=PAGE_LIMIT,
        )
        time.sleep(CALL_DELAY_S)

        einheiten = response.Einheiten or []
        anzahl += len(einheiten)
        kwp += sum(float(e.Bruttoleistung or 0) for e in einheiten)

        if response.Ergebniscode != "OkWeitereDatenVorhanden":
            break
        start_ab += len(einheiten)

    return {"anzahl": anzahl, "kwp": round(kwp, 2)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None,
                         help="Nur die ersten N Gemeinden abfragen (zum Testen).")
    parser.add_argument("--force", action="store_true",
                         help="Zwischenstand ignorieren und alle Gemeinden neu abfragen.")
    args = parser.parse_args()

    api_key = os.environ.get("MASTR_API_KEY")
    marktakteur_nr = os.environ.get("MASTR_MARKTAKTEUR_MASTR_NUMMER")
    if not api_key or not marktakteur_nr:
        sys.exit(
            "Fehlende Zugangsdaten: bitte MASTR_API_KEY und "
            "MASTR_MARKTAKTEUR_MASTR_NUMMER als Umgebungsvariablen setzen "
            "(siehe scripts/README.md)."
        )

    ags_list = load_ags_list()
    if args.limit:
        ags_list = ags_list[: args.limit]

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ergebnis = {}
    if OUT_FILE.exists() and not args.force:
        ergebnis = json.loads(OUT_FILE.read_text(encoding="utf-8"))
        print(f"Setze fort: {len(ergebnis)}/{len(ags_list)} Gemeinden bereits im Zwischenstand.")

    print("Verbinde mit dem MaStR-Webdienst …")
    # Ohne explizites Transport-Timeout hängt zeep bei einer toten/hängenden
    # TCP-Verbindung unbegrenzt in transport.post() fest — es wird nie eine
    # Exception geworfen, die call_with_retry() abfangen könnte. operation_timeout
    # sorgt dafür, dass ein hängender Request nach spätestens 30s abbricht.
    transport = zeep.Transport(timeout=30, operation_timeout=30)
    client = zeep.Client(WSDL_URL, transport=transport)
    service = client.bind("Marktstammdatenregister", "Anlage")

    offene = [a for a in ags_list if a not in ergebnis]
    print(f"{len(offene)} von {len(ags_list)} Gemeinden abzufragen (nur Balkonkraftwerke).")

    for i, ags in enumerate(offene, start=1):
        ergebnis[ags] = fetch_balkon(service, api_key, marktakteur_nr, ags)

        # Nach jeder Gemeinde speichern, damit ein Abbruch höchstens eine
        # einzelne, noch nicht abgeschlossene Gemeinde verliert.
        OUT_FILE.write_text(json.dumps(ergebnis, ensure_ascii=False, indent=2), encoding="utf-8")

        if i % 100 == 0 or i == len(offene):
            print(f"  [{i}/{len(offene)}] {ags} erledigt "
                  f"(gesamt im Zwischenstand: {len(ergebnis)}/{len(ags_list)})")

    print(f"Fertig. Geschrieben: {OUT_FILE}")


if __name__ == "__main__":
    main()
