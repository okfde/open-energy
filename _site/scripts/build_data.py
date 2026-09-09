#!/usr/bin/env python3
"""Verschmilzt die amtliche Potenzialstatistik (scripts/_cache/potenzial_raw.geojson,
von fetch_potenzial.py) mit dem MaStR-Bestand (scripts/_cache/bestand.json, von
fetch_bestand.py) zu den vier Dateien, die die /solarpotenzial-Seite tatsächlich
einliest:

    assets/data/gemeinden.geojson   (Karte + Popup-Detailwerte)
    _data/gemeinden_tabelle.csv     (Gemeindetabelle)
    _data/land_summary.json         (Landesweite Kennzahlen, roh)
    _data/land_summary_fmt.json     (dieselben Werte, de-DE-formatiert)

Nur gut/mittel geeignete Dachflächen fließen in die Dachpotenzial-Summen ein
(Fläche, amtliche Leistung/Menge, Ausschöpfung); die Werte je Eignungsklasse
(inkl. „schlecht") bleiben als Detailfelder für das Karten-Popup erhalten.
Ausschöpfung wird ausschließlich gegen das amtliche Potenzial berechnet –
es gibt keine eigene, panelbasierte Berechnung mehr.

Aufruf: python3 build_data.py  (setzt voraus, dass fetch_potenzial.py und
fetch_bestand.py vorher gelaufen sind und ihre Caches geschrieben haben).
"""
import csv
import json
import re
import sys
from pathlib import Path

from shapely.geometry import shape, mapping

SCRIPT_DIR = Path(__file__).parent
CACHE_DIR = SCRIPT_DIR / "_cache"
POTENZIAL_CACHE = CACHE_DIR / "potenzial_raw.geojson"
BESTAND_CACHE = CACHE_DIR / "bestand.json"

REPO_ROOT = SCRIPT_DIR.parent
GEOJSON_OUT = REPO_ROOT / "assets" / "data" / "gemeinden.geojson"
CSV_OUT = REPO_ROOT / "_data" / "gemeinden_tabelle.csv"
LAND_SUMMARY_OUT = REPO_ROOT / "_data" / "land_summary.json"
LAND_SUMMARY_FMT_OUT = REPO_ROOT / "_data" / "land_summary_fmt.json"

# Vereinfachungstoleranz für die Kartengeometrie (Grad), entspricht ca. 40-60m.
SIMPLIFY_TOLERANCE = 0.0006

EIGNUNGSKLASSEN = ("gut", "mittel", "schlecht")
BESTAND_KATEGORIEN = ("dach", "frei", "balkon", "sonst")


def load_cache(path, hint):
    if not path.exists():
        sys.exit(f"Fehlt: {path}\n{hint}")
    return json.loads(path.read_text(encoding="utf-8"))


def frei_flaeche_und_leistung(props):
    """Summiert je Freiflächen-Kategorie nur die horizontale (bzw. einzige
    verfügbare) Montage-Variante, damit Flächen mit zwei alternativen
    Technologien (horizontal/bifazial) nicht doppelt gezählt werden."""
    pattern = re.compile(r"^potenzial_pvfrei_(?!zwischensumme)(.+)_gesamtflaeche_ha$")
    kategorien = {}
    for key in props:
        m = pattern.match(key)
        if not m:
            continue
        mid = m.group(1)
        base = re.sub(r"_(horizontal|bifacial)$", "", mid)
        prefer = 0 if mid.endswith("_horizontal") else (1 if not mid.endswith("_bifacial") else 2)
        if base not in kategorien or prefer < kategorien[base][0]:
            kategorien[base] = (prefer, mid)

    flaeche_qm = 0.0
    leistung_kwp = 0.0
    menge_mwh = 0.0
    for _base, (_prefer, mid) in kategorien.items():
        flaeche_qm += (props.get(f"potenzial_pvfrei_{mid}_gesamtflaeche_ha") or 0) * 10000
        leistung_kwp += props.get(f"potenzial_pvfrei_{mid}_leistung_kwp") or 0
        menge_mwh += props.get(f"potenzial_pvfrei_{mid}_menge_mwh") or 0
    return flaeche_qm, leistung_kwp, menge_mwh


def build_properties(feature_props, bestand):
    p = feature_props
    ags = p["gemeinde_schluessel"]

    klassen = {}
    for k in EIGNUNGSKLASSEN:
        klassen[k] = {
            "flaeche_qm": p.get(f"potenzial_pvdach_flaeche_eignung_{k}_qm") or 0,
            "leistung_amtlich_kwp": p.get(f"potenzial_pvdach_leistung_eignung_{k}_kwp") or 0,
            "menge_amtlich_mwh": p.get(f"potenzial_pvdach_menge_eignung_{k}_mwh") or 0,
        }

    dach_flaeche_qm = klassen["gut"]["flaeche_qm"] + klassen["mittel"]["flaeche_qm"]
    dach_leistung_amtlich_kwp = klassen["gut"]["leistung_amtlich_kwp"] + klassen["mittel"]["leistung_amtlich_kwp"]
    dach_menge_amtlich_mwh = klassen["gut"]["menge_amtlich_mwh"] + klassen["mittel"]["menge_amtlich_mwh"]

    frei_flaeche_qm, frei_leistung_amtlich_kwp, frei_menge_amtlich_mwh = frei_flaeche_und_leistung(p)

    b = bestand.get(ags, {})
    bestand_dach = b.get("dach", {"anzahl": 0, "kwp": 0})
    bestand_frei = b.get("frei", {"anzahl": 0, "kwp": 0})
    bestand_balkon = b.get("balkon", {"anzahl": 0, "kwp": 0})
    bestand_sonst = b.get("sonst", {"anzahl": 0, "kwp": 0})

    bestand_gesamt_kwp = (
        bestand_dach["kwp"] + bestand_frei["kwp"] + bestand_balkon["kwp"] + bestand_sonst["kwp"]
    )
    ausschoepfung = (
        round(bestand_dach["kwp"] / dach_leistung_amtlich_kwp * 100.0, 2)
        if dach_leistung_amtlich_kwp else 0.0
    )

    out = {
        "gemeinde_schluessel": ags,
        "gemeinde_name": p["gemeinde_name"],
        "gemeinde_typ": p["gemeinde_typ"],
        # Der Landkreisschlüssel ist im WFS nicht als eigenes Feld enthalten,
        # aber Teil des 8-stelligen Gemeindeschlüssels (AGS): erste 5 Ziffern.
        "landkreis_schluessel": ags[:5],

        "dach_flaeche_qm": round(dach_flaeche_qm, 1),
        "dach_leistung_amtlich_kwp": round(dach_leistung_amtlich_kwp, 1),
        "dach_menge_amtlich_mwh": round(dach_menge_amtlich_mwh, 4),
        "dach_anzahl_module_moeglich": p.get("potenzial_pvdach_anzahl_gesamt") or 0,

        "frei_flaeche_qm": round(frei_flaeche_qm, 1),
        "frei_leistung_amtlich_kwp": round(frei_leistung_amtlich_kwp, 1),
        "frei_menge_amtlich_mwh": round(frei_menge_amtlich_mwh, 4),

        # amtliche WFS-eigene Bestandszahlen (Referenz, nicht die primär
        # angezeigten Werte – die stammen aus dem eigenen MaStR-Abruf unten).
        "bestand_amtlich_dach_anzahl": p.get("bestand_pvdach_anzahl_gesamt") or 0,
        "bestand_amtlich_dach_kwp": p.get("bestand_pvdach_leistung_gesamt_kwp") or 0,
        "bestand_amtlich_frei_kwp": p.get("bestand_pvfrei_leistung_gesamt_kwp") or 0,

        # eigener MaStR-Abruf (fetch_bestand.py), je Bauart:
        "bestand_csv_dach_anzahl": bestand_dach["anzahl"],
        "bestand_csv_dach_kwp": bestand_dach["kwp"],
        "bestand_csv_frei_anzahl": bestand_frei["anzahl"],
        "bestand_csv_frei_kwp": bestand_frei["kwp"],
        "bestand_csv_balkon_anzahl": bestand_balkon["anzahl"],
        "bestand_csv_balkon_kwp": bestand_balkon["kwp"],
        "bestand_csv_sonst_anzahl": bestand_sonst["anzahl"],
        "bestand_csv_sonst_kwp": bestand_sonst["kwp"],
        "bestand_dach_kwp_gesamt": bestand_dach["kwp"],
        "bestand_gesamt_kwp": round(bestand_gesamt_kwp, 2),

        "ausschoepfung_dach_prozent": ausschoepfung,
    }

    # Aufschlüsselung je Eignungsklasse (für das Karten-Popup, inkl. "schlecht").
    for k in EIGNUNGSKLASSEN:
        out[f"dach_flaeche_{k}_qm"] = round(klassen[k]["flaeche_qm"], 1)
        out[f"dach_leistung_amtlich_{k}_kwp"] = round(klassen[k]["leistung_amtlich_kwp"], 1)
        out[f"dach_menge_amtlich_{k}_mwh"] = round(klassen[k]["menge_amtlich_mwh"], 4)

    return out


def simplify_geometry(geom):
    if geom is None:
        return None
    shapely_geom = shape(geom).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
    return mapping(shapely_geom)


def fmt_int(n):
    return f"{round(n):,}".replace(",", ".")


def fmt_comma1(n):
    s = f"{n:.1f}"
    intpart, dec = s.split(".")
    return fmt_int(int(intpart)) + "," + dec


def write_geojson(features):
    out = {"type": "FeatureCollection", "features": features}
    GEOJSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    GEOJSON_OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {GEOJSON_OUT} ({GEOJSON_OUT.stat().st_size / 1024:.0f} KB)")


def write_csv(rows):
    fieldnames = [
        "gemeinde_name", "gemeinde_typ", "landkreis_schluessel", "gemeinde_schluessel",
        "dach_flaeche_qm", "dach_leistung_amtlich_kwp", "dach_menge_amtlich_mwh",
        "frei_flaeche_qm", "frei_leistung_amtlich_kwp",
        "bestand_csv_dach_anzahl", "bestand_csv_dach_kwp",
        "bestand_csv_balkon_anzahl", "bestand_csv_balkon_kwp",
        "bestand_csv_frei_anzahl", "bestand_csv_frei_kwp",
        "bestand_dach_kwp_gesamt", "bestand_gesamt_kwp",
        "ausschoepfung_dach_prozent",
    ]
    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with CSV_OUT.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: r[k] for k in fieldnames})
    print(f"Geschrieben: {CSV_OUT} ({len(rows)} Gemeinden)")


def write_land_summary(rows):
    def total(key):
        return sum(r[key] for r in rows)

    dach_leistung_amtlich_kwp = total("dach_leistung_amtlich_kwp")
    bestand_dach_kwp = total("bestand_csv_dach_kwp")
    ausschoepfung = (
        round(bestand_dach_kwp / dach_leistung_amtlich_kwp * 100.0, 2)
        if dach_leistung_amtlich_kwp else 0.0
    )

    summary = {
        "anzahl_gemeinden": len(rows),
        "dach_flaeche_qm": round(total("dach_flaeche_qm")),
        "dach_leistung_amtlich_kwp": round(dach_leistung_amtlich_kwp),
        "dach_menge_amtlich_mwh": round(total("dach_menge_amtlich_mwh")),
        "frei_flaeche_qm": total("frei_flaeche_qm"),
        "frei_leistung_amtlich_kwp": total("frei_leistung_amtlich_kwp"),
        "bestand_dach_anzahl": total("bestand_csv_dach_anzahl"),
        "bestand_dach_kwp": round(bestand_dach_kwp, 1),
        "bestand_balkon_anzahl": total("bestand_csv_balkon_anzahl"),
        "bestand_balkon_kwp": round(total("bestand_csv_balkon_kwp"), 1),
        "bestand_frei_anzahl": total("bestand_csv_frei_anzahl"),
        "bestand_frei_kwp": round(total("bestand_csv_frei_kwp"), 1),
        "ausschoepfung_dach_prozent": ausschoepfung,
    }
    LAND_SUMMARY_OUT.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {LAND_SUMMARY_OUT}")

    fmt = {
        "dach_flaeche_qm": fmt_int(summary["dach_flaeche_qm"]),
        "dach_leistung_amtlich_kwp": fmt_int(summary["dach_leistung_amtlich_kwp"]),
        "dach_menge_amtlich_kwh": fmt_int(summary["dach_menge_amtlich_mwh"] * 1000),
        "frei_flaeche_qm": fmt_int(summary["frei_flaeche_qm"]),
        "bestand_dach_anzahl": fmt_int(summary["bestand_dach_anzahl"]),
        "bestand_dach_kwp": fmt_int(summary["bestand_dach_kwp"]),
        "bestand_balkon_anzahl": fmt_int(summary["bestand_balkon_anzahl"]),
        "bestand_balkon_kwp": fmt_int(summary["bestand_balkon_kwp"]),
        "bestand_frei_anzahl": fmt_int(summary["bestand_frei_anzahl"]),
        "bestand_frei_kwp": fmt_int(summary["bestand_frei_kwp"]),
        "ausschoepfung_dach_prozent": fmt_comma1(summary["ausschoepfung_dach_prozent"]),
    }
    LAND_SUMMARY_FMT_OUT.write_text(json.dumps(fmt, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {LAND_SUMMARY_FMT_OUT}")


def main():
    potenzial = load_cache(
        POTENZIAL_CACHE,
        "Bitte zuerst 'python3 fetch_potenzial.py' ausführen.",
    )
    bestand = load_cache(
        BESTAND_CACHE,
        "Bitte zuerst 'python3 fetch_bestand.py' ausführen (benötigt MaStR-Zugangsdaten, siehe README.md).",
    )

    features_out = []
    rows_out = []
    for feature in potenzial["features"]:
        props = build_properties(feature["properties"], bestand)
        rows_out.append(props)
        features_out.append({
            "type": "Feature",
            "properties": props,
            "geometry": simplify_geometry(feature.get("geometry")),
        })

    print(f"{len(rows_out)} Gemeinden verarbeitet.")
    write_geojson(features_out)
    write_csv(rows_out)
    write_land_summary(rows_out)
    print("Fertig.")


if __name__ == "__main__":
    main()
