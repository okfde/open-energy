#!/usr/bin/env python3
"""Verschmilzt die bundesweite Gemeindeliste (scripts/_cache/gemeinden_de_raw.geojson,
von fetch_gemeinden_de.py), den bundesweiten Balkonkraftwerke-Bestand
(scripts/_cache/balkon_de.json, von fetch_balkon_de.py) und die Haushaltszahlen
aus dem Zensus 2022 (scripts/_cache/haushalte_de.json, von
fetch_haushalte_de.py) zum Kartenlayer für den zusätzlichen "Balkonkraftwerke
je 100 Haushalte (Deutschland)"-Filter:

    assets/data/gemeinden_de_balkon.geojson

Bewusst eine eigene, schlanke Datei getrennt von assets/data/gemeinden.geojson
(Brandenburg) – dieser Filter ist die einzige Stelle auf der Seite, die
Gemeinden außerhalb Brandenburgs zeigt; alle anderen Filter, die
Gemeindetabelle und die Landeskennzahlen bleiben unverändert Brandenburg-only.

Normalisiert wird je Haushalt statt je Einwohner: ein Balkonkraftwerk wird
pro Wohnung/Haushalt installiert, nicht pro Kopf – die Haushaltszahl ist
daher der methodisch passendere Nenner (siehe auch Methodik & Quellen auf
der Seite).

Aufruf: python3 build_data_de.py  (setzt voraus, dass fetch_gemeinden_de.py,
fetch_balkon_de.py und fetch_haushalte_de.py vorher gelaufen sind).
"""
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CACHE_DIR = SCRIPT_DIR / "_cache"
GEMEINDEN_DE_CACHE = CACHE_DIR / "gemeinden_de_raw.geojson"
BALKON_DE_CACHE = CACHE_DIR / "balkon_de.json"
HAUSHALTE_DE_CACHE = CACHE_DIR / "haushalte_de.json"

REPO_ROOT = SCRIPT_DIR.parent
OUT_FILE = REPO_ROOT / "assets" / "data" / "gemeinden_de_balkon.geojson"


def load_cache(path, hint):
    if not path.exists():
        sys.exit(f"Fehlt: {path}\n{hint}")
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    gemeinden = load_cache(
        GEMEINDEN_DE_CACHE,
        "Bitte zuerst 'python3 fetch_gemeinden_de.py' ausführen.",
    )
    balkon = load_cache(
        BALKON_DE_CACHE,
        "Bitte zuerst 'python3 fetch_balkon_de.py' ausführen (benötigt MaStR-Zugangsdaten, "
        "siehe README.md; läuft für alle ~11.000 Gemeinden mehrere Stunden).",
    )
    haushalte = load_cache(
        HAUSHALTE_DE_CACHE,
        "Bitte zuerst 'python3 fetch_haushalte_de.py' ausführen.",
    )

    fehlend = 0
    ohne_haushalte = 0
    features = []
    for f in gemeinden["features"]:
        p = f["properties"]
        ags = p["ags"]
        b = balkon.get(ags)
        if b is None:
            fehlend += 1
            b = {"anzahl": 0, "kwp": 0.0}

        einwohner = p["einwohner"] or 0
        h = haushalte.get(ags)
        if h is None:
            ohne_haushalte += 1
        pro_100_haushalte = round(b["anzahl"] / h * 100, 3) if h else None

        features.append({
            "type": "Feature",
            "properties": {
                "ags": ags,
                "gemeinde_name": p["gemeinde_name"],
                "gemeinde_typ": p["gemeinde_typ"],
                "einwohner": einwohner,
                "haushalte": h,
                "balkon_anzahl": b["anzahl"],
                "balkon_kwp": b["kwp"],
                "balkon_pro_100_haushalte": pro_100_haushalte,
            },
            "geometry": f["geometry"],
        })

    if fehlend:
        print(f"Hinweis: {fehlend} Gemeinden ohne Balkon-Datensatz "
              f"(fetch_balkon_de.py vermutlich noch nicht vollständig durchgelaufen) – als 0 gewertet.")
    if ohne_haushalte:
        print(f"Hinweis: {ohne_haushalte} Gemeinden ohne Haushaltszahl aus dem Zensus 2022 "
              f"(meist gemeindefreie Gebiete ohne Einwohner, oder Gebietsstand-Abweichungen) "
              f"– Balkonkraftwerke-je-100-Haushalte bleibt für diese ohne Wert.")

    print(f"{len(features)} Gemeinden verarbeitet.")
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    out = {"type": "FeatureCollection", "features": features}
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE} ({OUT_FILE.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
