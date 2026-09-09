#!/usr/bin/env python3
"""Fetch den Bestand an Solaranlagen "in Betrieb" je Brandenburger Gemeinde
aus dem Marktstammdatenregister (MaStR) – aufgeschlüsselt nach Bauart
(Gebäude-, Freiflächen-, Stecker-/Balkon- und sonstige Solaranlagen).

Nutzt den offiziellen MaStR-Webdienst (SOAP). Dafür sind eigene, kostenlose
Zugangsdaten nötig – siehe README.md im selben Ordner für die Registrierung.

Zugangsdaten werden ausschließlich über Umgebungsvariablen übergeben,
niemals im Code oder in Dateien abgelegt:
    MASTR_API_KEY
    MASTR_MARKTAKTEUR_MASTR_NUMMER

Die Gemeindeliste (413 AGS-Schlüssel) wird aus der bereits im Repo
vorhandenen _data/gemeinden_tabelle.csv gelesen, damit dieses Skript
unabhängig von fetch_potenzial.py läuft/wiederholt werden kann.

Ergebnis wird fortlaufend (nach jeder Gemeinde) nach
scripts/_cache/bestand.json geschrieben, sodass ein Abbruch (z. B. Ctrl-C)
keinen Datenverlust verursacht – ein erneuter Lauf setzt automatisch dort
fort, wo er unterbrochen wurde (--force erzwingt einen kompletten Neulauf).
"""
import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

import zeep
from zeep.exceptions import Fault, TransportError

WSDL_URL = "https://www.marktstammdatenregister.de/MaStRAPI/wsdl/mastr.wsdl"
BUNDESLAND = "Brandenburg"
ENERGIETRAEGER = "SolareStrahlungsenergie"
BETRIEBSSTATUS = "InBetrieb"

# SolarArtEnum-Werte des MaStR-Webdienstes -> unser Kürzel im Ergebnis.
KATEGORIEN = {
    "dach": "Gebaeudesolaranlage",
    "frei": "Freiflaechensolaranlage",
    "balkon": "SteckerfertigeSolaranlage",
    "sonst": "SonstigeSolaranlage",
}

PAGE_LIMIT = 2000  # von der Bundesnetzagentur dokumentiertes Standard-Maximum
CALL_DELAY_S = 0.2  # kleine Pause zwischen Aufrufen, um den Dienst zu schonen
MAX_RETRIES = 5
RETRY_DELAY_S = 10

REPO_ROOT = Path(__file__).parent.parent
GEMEINDEN_CSV = REPO_ROOT / "_data" / "gemeinden_tabelle.csv"
CACHE_DIR = Path(__file__).parent / "_cache"
OUT_FILE = CACHE_DIR / "bestand.json"


def load_ags_list():
    if not GEMEINDEN_CSV.exists():
        sys.exit(
            f"Gemeindeliste nicht gefunden: {GEMEINDEN_CSV}\n"
            "Diese Datei wird nur gelesen (für die 413 AGS-Schlüssel) und sollte "
            "aus einem vorherigen Lauf von build_data.py bereits im Repo liegen."
        )
    with GEMEINDEN_CSV.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        ags_list = [row["gemeinde_schluessel"] for row in reader]
    if len(ags_list) < 400:
        print(f"WARNUNG: nur {len(ags_list)} Gemeinden in {GEMEINDEN_CSV} gefunden (erwartet: 413).",
              file=sys.stderr)
    return ags_list


def call_with_retry(fn, *args, **kwargs):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except (Fault, TransportError, ConnectionError, TimeoutError) as exc:
            last_error = exc
            print(f"    Versuch {attempt}/{MAX_RETRIES} fehlgeschlagen: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S)
    raise RuntimeError(f"MaStR-Aufruf endgültig fehlgeschlagen: {last_error}")


def fetch_category(service, api_key, marktakteur_nr, ags, art_der_solaranlage):
    """Summiert Anzahl + Bruttoleistung (kWp) aller Einheiten einer Gemeinde
    und Solaranlagen-Art, mit Pagination über startAb."""
    anzahl = 0
    kwp = 0.0
    start_ab = 1
    while True:
        response = call_with_retry(
            service.GetGefilterteListeStromErzeuger,
            apiKey=api_key,
            marktakteurMastrNummer=marktakteur_nr,
            einheitBundesland=BUNDESLAND,
            energietraeger=ENERGIETRAEGER,
            einheitBetriebsstatus=BETRIEBSSTATUS,
            Gemeindeschluessel=ags,
            ArtDerSolaranlage=art_der_solaranlage,
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
    client = zeep.Client(WSDL_URL)
    service = client.bind("Marktstammdatenregister", "Anlage")

    offene = [a for a in ags_list if a not in ergebnis]
    print(f"{len(offene)} von {len(ags_list)} Gemeinden abzufragen "
          f"(je {len(KATEGORIEN)} Solaranlagen-Arten).")

    for i, ags in enumerate(offene, start=1):
        pro_kategorie = {}
        for kuerzel, solar_art in KATEGORIEN.items():
            pro_kategorie[kuerzel] = fetch_category(service, api_key, marktakteur_nr, ags, solar_art)
        ergebnis[ags] = pro_kategorie

        # Nach jeder Gemeinde speichern – ein Abbruch verliert so höchstens
        # eine einzelne, noch nicht abgeschlossene Gemeinde.
        OUT_FILE.write_text(json.dumps(ergebnis, ensure_ascii=False, indent=2), encoding="utf-8")

        if i % 10 == 0 or i == len(offene):
            print(f"  [{i}/{len(offene)}] {ags} erledigt "
                  f"(gesamt im Zwischenstand: {len(ergebnis)}/{len(ags_list)})")

    print(f"Fertig. Geschrieben: {OUT_FILE}")


if __name__ == "__main__":
    main()
