#!/usr/bin/env python3
"""Lädt Gemeindegrenzen + Einwohnerzahl für alle ca. 11.000 deutschen
Gemeinden vom Bundesamt für Kartographie und Geodäsie (BKG) – Produkt
VG250-EW ("Verwaltungsgebiete mit Einwohnerzahlen"), öffentlich und ohne
Zugangsdaten abrufbar.

Nur für den deutschlandweiten Balkonkraftwerke-Filter benötigt (Kartenlayer
+ Gemeindegrenzen; die Einwohnerzahl (EWZ) dient nur als Kontextinfo im
Popup – normalisiert wird auf Haushalte, siehe fetch_haushalte_de.py) –
nicht für die Brandenburg-Daten, die weiterhin aus dem Energieportal-WFS
kommen.

Schreibt scripts/_cache/gemeinden_de_raw.json (GeoJSON, WGS84, vereinfacht).
"""
import io
import json
import sys
import zipfile
from pathlib import Path

import pyproj
import requests
import shapefile
from shapely.geometry import shape, mapping
from shapely.ops import transform

VG250_URL = (
    "https://daten.gdz.bkg.bund.de/produkte/vg/vg250-ew_ebenen_1231/aktuell/"
    "vg250-ew_12-31.utm32s.shape.ebenen.zip"
)
SHP_PATH_IN_ZIP = "vg250-ew_12-31.utm32s.shape.ebenen/vg250-ew_ebenen_1231/VG250_GEM"
SOURCE_CRS = "EPSG:25832"  # ETRS89 / UTM zone 32N, siehe VG250_GEM.prj
TARGET_CRS = "EPSG:4326"

# Deutlich gröber als die Brandenburg-Karte (0,0006°): bei bundesweiter
# Übersichtsdarstellung fällt feine Grenzdetailtreue nicht auf, hält aber
# die Dateigröße bei ~11.000 Gemeinden im Rahmen.
SIMPLIFY_TOLERANCE = 0.003

CACHE_DIR = Path(__file__).parent / "_cache"
OUT_FILE = CACHE_DIR / "gemeinden_de_raw.geojson"


def main():
    print(f"Lade VG250-EW von {VG250_URL} …")
    resp = requests.get(VG250_URL, timeout=180)
    resp.raise_for_status()
    print(f"  {len(resp.content) / 1024 / 1024:.1f} MB heruntergeladen.")

    zf = zipfile.ZipFile(io.BytesIO(resp.content))
    shp = io.BytesIO(zf.read(SHP_PATH_IN_ZIP + ".shp"))
    dbf = io.BytesIO(zf.read(SHP_PATH_IN_ZIP + ".dbf"))
    shx = io.BytesIO(zf.read(SHP_PATH_IN_ZIP + ".shx"))
    sf = shapefile.Reader(shp=shp, dbf=dbf, shx=shx)

    field_names = [f[0] for f in sf.fields[1:]]
    project = pyproj.Transformer.from_crs(SOURCE_CRS, TARGET_CRS, always_xy=True).transform

    features = []
    for sr in sf.iterShapeRecords():
        rec = dict(zip(field_names, sr.record))
        geom_wgs84 = transform(project, shape(sr.shape.__geo_interface__))
        geom_simplified = geom_wgs84.simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
        features.append({
            "type": "Feature",
            "properties": {
                "ags": rec["AGS"],
                "gemeinde_name": rec["GEN"],
                "gemeinde_typ": rec["BEZ"],
                "einwohner": rec["EWZ"],
            },
            "geometry": mapping(geom_simplified),
        })

    print(f"{len(features)} Gemeinden verarbeitet.")
    if len(features) < 10000:
        print(
            f"WARNUNG: nur {len(features)} Gemeinden erhalten (erwartet: ~11.000) "
            "– Datensatz-Struktur ggf. geändert, bitte prüfen.",
            file=sys.stderr,
        )

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    out = {"type": "FeatureCollection", "features": features}
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE} ({OUT_FILE.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
