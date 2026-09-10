#!/usr/bin/env python3
"""Verschmilzt die bundesweite Gemeindeliste (scripts/_cache/gemeinden_de_raw.geojson,
von fetch_gemeinden_de.py), den bundesweiten Balkonkraftwerke-Bestand
(scripts/_cache/balkon_de.json, von fetch_balkon_de.py) und die Haushaltszahlen
aus dem Zensus 2022 (scripts/_cache/haushalte_de.json, von
fetch_haushalte_de.py) zum Kartenlayer für den zusätzlichen "Balkonkraftwerke
je 100 Haushalte (Deutschland)"-Filter:

    assets/data/gemeinden_de_balkon.geojson

Schreibt außerdem zwei kleine Kennzahlen-Dateien für die Stat-Kacheln am
Seitenanfang (Stadt unter den zehn größten Deutschlands sowie Bundesland mit
jeweils höchster Balkonsolardichte, bundesweiter Durchschnitt je 100
Haushalte):

    _data/land_summary_de.json       (roh)
    _data/land_summary_de_fmt.json   (de-DE-formatiert)

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
SUMMARY_OUT = REPO_ROOT / "_data" / "land_summary_de.json"
SUMMARY_FMT_OUT = REPO_ROOT / "_data" / "land_summary_de_fmt.json"

# Anzahl der (nach Einwohnerzahl) größten deutschen Städte, unter denen die
# "Großstadt mit höchster Balkonsolardichte"-Kachel ihren Spitzenreiter
# sucht – aus dem eigenen Datensatz ermittelt statt einer fest hinterlegten
# Städteliste, damit es konsistent zu den übrigen Zahlen auf der Seite bleibt.
TOP10_STADT_ANZAHL = 10

# AGS-Länderkennziffer (erste zwei Ziffern des 8-stelligen Gemeindeschlüssels)
# -> Bundesland, für die Länder-Aggregation der "Bundesland mit höchster
# Balkonsolardichte"-Kachel (dieselbe Zuordnung wie LAND_NAMES in
# solarpotenzial-table.js).
LAND_NAMES = {
    "01": "Schleswig-Holstein",
    "02": "Hamburg",
    "03": "Niedersachsen",
    "04": "Bremen",
    "05": "Nordrhein-Westfalen",
    "06": "Hessen",
    "07": "Rheinland-Pfalz",
    "08": "Baden-Württemberg",
    "09": "Bayern",
    "10": "Saarland",
    "11": "Berlin",
    "12": "Brandenburg",
    "13": "Mecklenburg-Vorpommern",
    "14": "Sachsen",
    "15": "Sachsen-Anhalt",
    "16": "Thüringen",
}


def fmt_int(n):
    return f"{round(n):,}".replace(",", ".")


def fmt_comma1(n):
    s = f"{n:.1f}"
    intpart, dec = s.split(".")
    return fmt_int(int(intpart)) + "," + dec


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

    write_summary(features)


def write_summary(features):
    """Bundesweite Kennzahlen für die Stat-Kacheln auf der Seite (Deutschland-
    Teil, unabhängig von den Brandenburg-Kacheln aus build_data.py). Pro AGS
    nur einmal gezählt – mehrteilige Geometrien (Exklaven) liefern sonst
    doppelte Properties-Einträge (dieselbe Dedup-Logik wie in
    solarpotenzial-table.js, activateDeMode)."""
    seen = set()
    gemeinden = []
    for f in features:
        p = f["properties"]
        if p["ags"] in seen:
            continue
        seen.add(p["ags"])
        gemeinden.append(p)

    mit_haushalten = [p for p in gemeinden if p["haushalte"]]
    bundesweit_haushalte = sum(p["haushalte"] for p in mit_haushalten)
    bundesweit_balkon_anzahl = sum(p["balkon_anzahl"] for p in mit_haushalten)
    bundesweit_pro_100_haushalte = round(bundesweit_balkon_anzahl / bundesweit_haushalte * 100, 3)

    # Größte Stadt = höchste Einwohnerzahl im eigenen Datensatz (VG250-EW),
    # nicht eine fest hinterlegte Liste – bleibt so automatisch konsistent
    # mit den übrigen Zahlen der Seite.
    top10_staedte = sorted(mit_haushalten, key=lambda p: p["einwohner"], reverse=True)[:TOP10_STADT_ANZAHL]
    top_stadt = max(top10_staedte, key=lambda p: p["balkon_pro_100_haushalte"])

    laender = {}
    for p in mit_haushalten:
        code = p["ags"][:2]
        name = LAND_NAMES.get(code)
        if not name:
            continue
        l = laender.setdefault(code, {"land_name": name, "haushalte": 0, "balkon_anzahl": 0})
        l["haushalte"] += p["haushalte"]
        l["balkon_anzahl"] += p["balkon_anzahl"]
    for l in laender.values():
        l["balkon_pro_100_haushalte"] = round(l["balkon_anzahl"] / l["haushalte"] * 100, 3)
    top_land = max(laender.values(), key=lambda l: l["balkon_pro_100_haushalte"])

    summary = {
        "bundesweit_gemeinden": len(gemeinden),
        "bundesweit_haushalte": bundesweit_haushalte,
        "bundesweit_balkon_anzahl": bundesweit_balkon_anzahl,
        "bundesweit_pro_100_haushalte": bundesweit_pro_100_haushalte,
        "top_stadt_name": top_stadt["gemeinde_name"],
        "top_stadt_pro_100_haushalte": top_stadt["balkon_pro_100_haushalte"],
        "top_stadt_einwohner": top_stadt["einwohner"],
        "top_land_name": top_land["land_name"],
        "top_land_pro_100_haushalte": top_land["balkon_pro_100_haushalte"],
        "top_land_haushalte": top_land["haushalte"],
    }
    SUMMARY_OUT.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    summary_fmt = {
        "bundesweit_pro_100_haushalte": fmt_comma1(bundesweit_pro_100_haushalte),
        "top_stadt_name": top_stadt["gemeinde_name"],
        "top_stadt_pro_100_haushalte": fmt_comma1(top_stadt["balkon_pro_100_haushalte"]),
        "top_land_name": top_land["land_name"],
        "top_land_pro_100_haushalte": fmt_comma1(top_land["balkon_pro_100_haushalte"]),
    }
    SUMMARY_FMT_OUT.write_text(json.dumps(summary_fmt, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Geschrieben: {SUMMARY_OUT}, {SUMMARY_FMT_OUT}")


if __name__ == "__main__":
    main()
