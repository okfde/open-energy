# Solarpotenzial-Datenpipeline

Aktualisiert die Daten hinter `/solarpotenzial` (Karte, Gemeindetabelle,
Landeskennzahlen) mit den jeweils aktuellsten Werten aus zwei öffentlichen
Quellen:

1. **Amtliche Solarpotenzial-Statistik** je Gemeinde (Dach- und
   Freiflächen-Eignung) vom WFS-Dienst des
   [Energieportals Brandenburg](https://energieportal-brandenburg.de/) –
   keine Zugangsdaten nötig.
2. **Bestand an Solaranlagen "in Betrieb"** je Gemeinde, aufgeschlüsselt nach
   Gebäude-, Freiflächen- und Balkon-/Steckersolaranlagen, direkt aus dem
   [Marktstammdatenregister](https://www.marktstammdatenregister.de/) (MaStR)
   der Bundesnetzagentur – dafür sind eigene, kostenlose Zugangsdaten nötig
   (siehe unten).

## Einmalige Einrichtung

```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate   # optional, empfohlen
pip install -r requirements.txt
```

### MaStR-Zugangsdaten besorgen

1. Auf [marktstammdatenregister.de](https://www.marktstammdatenregister.de/)
   registrieren (falls noch nicht geschehen) und einloggen.
2. Unter **Meine Benutzerdaten → Webdienste** einen neuen API-Schlüssel für
   den Web-Dienst (SOAP-API) anlegen. Das liefert:
   - einen **API-Schlüssel** (`apiKey`)
   - die **MaStR-Nummer** des eigenen Marktakteurs (`marktakteurMastrNummer`,
     Format z. B. `ABR912345678901`)
3. Beide Werte als Umgebungsvariablen setzen (z. B. in `~/.zshrc` oder direkt
   vor dem Aufruf) – niemals im Repo speichern:

   ```bash
   export MASTR_API_KEY="…"
   export MASTR_MARKTAKTEUR_MASTR_NUMMER="…"
   ```

Details zum Webdienst: <https://marktstammdaten.api.bund.dev/>.

## Ausführen

```bash
cd scripts
./update_data.sh
```

Das Skript läuft in drei Schritten (auch einzeln aufrufbar, siehe unten) und
schreibt am Ende direkt in die vom Jekyll-Build gelesenen Dateien:

- `assets/data/gemeinden.geojson` (Karte + Popup-Detailwerte)
- `_data/gemeinden_tabelle.csv` (Gemeindetabelle)
- `_data/land_summary.json` / `_data/land_summary_fmt.json` (Landeskennzahlen)

Anschließend wie gewohnt `bundle exec jekyll build` (oder `serve`) ausführen,
um die aktualisierten Daten auf der Seite zu sehen, und die geänderten
Dateien committen.

### Laufzeit

- `fetch_potenzial.py`: ein einzelner Abruf, wenige Sekunden.
- `fetch_bestand.py`: **der langsame Teil.** Für jede der 413 Gemeinden
  werden 4 Solaranlagen-Arten einzeln abgefragt (413 × 4 = 1.652 Anfragen,
  plus Pagination bei sehr großen Gemeinden) – mit eingebauter Pause
  zwischen den Aufrufen, um den Dienst nicht zu überlasten. Rechnet mit
  15–30 Minuten. Der Zwischenstand wird nach jeder Gemeinde gespeichert
  (`scripts/_cache/bestand.json`) – ein Abbruch (Ctrl-C, Netzwerkfehler)
  verliert also höchstens die gerade laufende Gemeinde; ein erneuter Aufruf
  setzt automatisch dort fort. `--force` erzwingt einen kompletten Neulauf,
  `--limit N` fragt nur die ersten N Gemeinden ab (zum Testen).
- `build_data.py`: wenige Sekunden.

### Einzelne Schritte

```bash
python3 fetch_potenzial.py           # -> scripts/_cache/potenzial_raw.geojson
python3 fetch_bestand.py             # -> scripts/_cache/bestand.json
python3 fetch_bestand.py --limit 5   # nur 5 Gemeinden, zum Testen
python3 build_data.py                # verschmilzt beide Caches, schreibt die Seiten-Dateien
```

`scripts/_cache/` wird nicht versioniert (siehe `.gitignore`) – die beiden
Rohdaten-Caches sind reine Zwischenstände für `build_data.py` und können
jederzeit gelöscht/neu erzeugt werden.

### Bundesweiter Vergleich (optional, eigener Datensatz)

Der zusätzliche „Balkonkraftwerke je 100 Haushalte (Deutschland)“-Filter auf
der Karte/Gemeindetabelle nutzt einen eigenen, separaten Datensatz
(`assets/data/gemeinden_de_balkon.geojson`) und läuft unabhängig vom
Brandenburg-Flow oben:

```bash
python3 fetch_gemeinden_de.py   # -> scripts/_cache/gemeinden_de_raw.geojson (BKG VG250-EW, Gemeindegrenzen)
python3 fetch_balkon_de.py      # -> scripts/_cache/balkon_de.json (MaStR, dauert mehrere Stunden, ~11.000 Gemeinden)
python3 fetch_haushalte_de.py   # -> scripts/_cache/haushalte_de.json (Zensus 2022, Haushalte je Gemeinde)
python3 build_data_de.py        # verschmilzt alle drei Caches -> assets/data/gemeinden_de_balkon.geojson
```

`fetch_haushalte_de.py` benötigt zusätzlich `openpyxl` (in `requirements.txt`
enthalten).

## Methodik-Hinweise

- Nur Dachflächen der Eignungsklassen **gut** und **mittel** fließen in die
  Dachpotenzial-Summen (Fläche, amtliche Leistung, Ausschöpfung) ein; die
  Werte je Eignungsklasse (inkl. „schlecht") bleiben als Detailfelder für
  das Karten-Popup erhalten. Siehe `frei_flaeche_und_leistung()` bzw. die
  Eignungsklassen-Logik in `build_data.py`.
- Beim Freiflächen-Potenzial geht je Kategorie (Grünland, Ackerland,
  Randstreifen, Parkplätze, Konversionsflächen, Halden, Seen u. a.) nur die
  horizontale (bzw. die einzige verfügbare) Montage-Variante in die Summe
  ein, damit Flächen mit zwei alternativen Technologien (horizontal/
  bifazial) auf derselben Fläche nicht doppelt gezählt werden.
- Ausschöpfung wird ausschließlich gegen das **amtliche** Potenzial
  berechnet (`Bestand Gebäudesolaranlagen ÷ amtliches Dachpotenzial × 100`)
  – es gibt keine eigene, panelbasierte Berechnung.
- Kartengeometrien werden nach dem Laden mit Douglas-Peucker vereinfacht
  (Toleranz ≈ 0,0006°, ca. 40–60 m), passend zur bisherigen Darstellung.

## Troubleshooting

- **"Zugriff verweigert" / "Zugriff temporär verweigert"**: falscher oder
  abgelaufener API-Schlüssel, oder der Dienst hat den Zugriff wegen zu
  vieler Fehlversuche kurzzeitig gesperrt (wenige Minuten warten und erneut
  versuchen).
- **`fetch_bestand.py` bricht mit einem Netzwerkfehler ab**: einfach erneut
  starten – der Zwischenstand wird automatisch fortgesetzt.
- **Die 413-Gemeinden-Prüfung in `fetch_potenzial.py` schlägt fehl /
  warnt**: das Energieportal-Schema hat sich ggf. geändert – Feldnamen in
  `build_data.py` (`potenzial_pvdach_*`, `potenzial_pvfrei_*`) gegen die
  aktuelle Antwort prüfen.
