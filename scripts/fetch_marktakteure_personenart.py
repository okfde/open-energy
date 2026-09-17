#!/usr/bin/env python3
"""Lädt die Personenart (Organisation vs. natürliche Person) aller in
Brandenburg gemeldeten MaStR-Marktakteure – für die "Bestand Dach nach
Anlagenbetreiber"-Umschaltung (Gesamt/Organisation/Privatperson) auf der
Karte.

Bewusst NICHT als Einzelabfrage je Anlagenbetreiber (das wären bei ~135.000
Brandenburger Dachsolaranlagen ggf. >100.000 Einzel-Requests, siehe README).
Stattdessen wird die Sammel-Listenabfrage GetGefilterteListeMarktakteure
genutzt, gefiltert auf bundesland=Brandenburg und paginiert wie die übrigen
Listen-Abrufe dieser Pipeline – das sind nur einige Dutzend Requests für
tausende Marktakteure auf einmal.

Der öffentliche MaStR-Webdienst kennt bei "Personenart" nur zwei Werte
(siehe MaStR-Gesamtdatenexport-Dokumentation, Abschnitt Marktakteure):
  - "Organisation"                                    -> Unternehmen,
    Personengesellschaft, juristische Person, Behörde, Verband
  - "NatuerlichePersonOderOrganisationMitPersonenbezug" -> aus Datenschutz-
    gründen zusammengefasst: echte Privatpersonen UND personenbezogene
    Kleinunternehmen (z. B. Einzelunternehmen) landen im selben Topf. Eine
    feinere Trennung ist über die öffentlichen MaStR-Daten nicht möglich.

Einschränkung durch den Bundesland-Filter: nur Marktakteure, die selbst mit
Adresse in Brandenburg registriert sind, werden erfasst. Ein Betreiber mit
Sitz außerhalb Brandenburgs (z. B. ein Unternehmen mit Hauptsitz in Berlin),
der eine Anlage in Brandenburg betreibt, taucht hier nicht auf – ebenso
gelöschte/deaktivierte Marktakteure (diese Abfrage liefert nur "aktive"
Marktakteure) oder Datensätze ohne gepflegtes Bundesland-Feld. Solche
Anlagen fallen beim Gesamt/Organisation/Privatperson-Split unter "unbekannt"
(siehe build_data.py). Anteil in der Praxis (Stand erster Vollabruf,
17.09.2026): rund 39 % von "Bestand Dach (kWp)" – spürbar mehr als eine
Randerscheinung, aber Organisation und Privatperson bleiben mit ca. 22 % bzw.
39 % weiterhin aussagekräftig unterscheidbar.

Schreibt scripts/_cache/marktakteure_personenart.json
({mastr_nummer: "organisation" | "privatperson"}).
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
BUNDESLAND = "Brandenburg"

PAGE_LIMIT = 2000
CALL_DELAY_S = 0.2
MAX_RETRIES = 5
RETRY_DELAY_S = 10

CACHE_DIR = Path(__file__).parent / "_cache"
OUT_FILE = CACHE_DIR / "marktakteure_personenart.json"

PERSONENART_MAP = {
    "Organisation": "organisation",
    "NatuerlichePersonOderOrganisationMitPersonenbezug": "privatperson",
}


def call_with_retry(fn, *args, **kwargs):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except (Fault, TransportError, requests.exceptions.RequestException, OSError) as exc:
            last_error = exc
            print(f"    Versuch {attempt}/{MAX_RETRIES} fehlgeschlagen: {exc}", file=sys.stderr)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S)
    raise RuntimeError(f"MaStR-Aufruf endgültig fehlgeschlagen: {last_error}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true",
                         help="Zwischenstand ignorieren und komplett neu abfragen.")
    args = parser.parse_args()

    api_key = os.environ.get("MASTR_API_KEY")
    marktakteur_nr = os.environ.get("MASTR_MARKTAKTEUR_MASTR_NUMMER")
    if not api_key or not marktakteur_nr:
        sys.exit(
            "Fehlende Zugangsdaten: bitte MASTR_API_KEY und "
            "MASTR_MARKTAKTEUR_MASTR_NUMMER als Umgebungsvariablen setzen "
            "(siehe README.md)."
        )

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if OUT_FILE.exists() and not args.force:
        print(f"Bereits vorhanden: {OUT_FILE} (--force für Neuabruf).")
        return

    print("Verbinde mit dem MaStR-Webdienst …")
    transport = zeep.Transport(timeout=30, operation_timeout=30)
    client = zeep.Client(WSDL_URL, transport=transport)
    service = client.bind("Marktstammdatenregister", "Akteur")

    ergebnis = {}
    unbekannte_personenart = 0
    start_ab = 1
    seite = 0
    while True:
        response = call_with_retry(
            service.GetGefilterteListeMarktakteure,
            apiKey=api_key,
            marktakteurMastrNummer=marktakteur_nr,
            bundesland=BUNDESLAND,
            startAb=start_ab,
            limit=PAGE_LIMIT,
        )
        time.sleep(CALL_DELAY_S)

        akteure = response.Marktakteure or []
        for a in akteure:
            kategorie = PERSONENART_MAP.get(a.Personenart)
            if kategorie is None:
                unbekannte_personenart += 1
                continue
            ergebnis[a.MarktakteurMastrNummer] = kategorie

        seite += 1
        print(f"  Seite {seite}: {len(akteure)} Marktakteure "
              f"(gesamt bisher: {len(ergebnis)})")

        if response.Ergebniscode != "OkWeitereDatenVorhanden":
            break
        start_ab += len(akteure)

    if unbekannte_personenart:
        print(f"Hinweis: {unbekannte_personenart} Marktakteure mit unbekannter/leerer "
              f"Personenart übersprungen.")

    print(f"{len(ergebnis)} Marktakteure mit Personenart verarbeitet.")
    OUT_FILE.write_text(json.dumps(ergebnis, ensure_ascii=False), encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE}")


if __name__ == "__main__":
    main()
