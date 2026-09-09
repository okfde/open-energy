#!/usr/bin/env bash
# Aktualisiert alle Daten der /solarpotenzial-Seite in einem Rutsch:
#   1. amtliche Solarpotenzial-Statistik (Energieportal Brandenburg, WFS)
#   2. Bestand an Solaranlagen "in Betrieb" (Marktstammdatenregister)
#   3. Verschmilzt beides zu den vier Dateien, die die Seite einliest
#
# Nutzung:
#   cd scripts
#   pip install -r requirements.txt
#   export MASTR_API_KEY=...
#   export MASTR_MARKTAKTEUR_MASTR_NUMMER=...
#   ./update_data.sh
#
# Siehe README.md für die Registrierung der MaStR-Zugangsdaten und Details
# zu Laufzeit/Wiederaufnahme.
set -euo pipefail
cd "$(dirname "$0")"

echo "== 1/3: Amtliche Solarpotenzial-Statistik (WFS) =="
python3 fetch_potenzial.py

echo
echo "== 2/3: Bestand aus dem Marktstammdatenregister =="
python3 fetch_bestand.py

echo
echo "== 3/3: Daten zusammenführen und Seiten-Dateien schreiben =="
python3 build_data.py

echo
echo "Fertig. Geänderte Dateien:"
git -C .. status --porcelain -- assets/data/gemeinden.geojson _data/gemeinden_tabelle.csv _data/land_summary.json _data/land_summary_fmt.json
