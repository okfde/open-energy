---
layout: default
title: Statistiken zum Solarausbau
permalink: /solarpotenzial/
description: "Wie weit ist Brandenburgs Solarpotenzial ausgeschöpft? Welche Gemeinde hat die meisten Balkonkraftwerke je Haushalt in Deutschland? Daten aufbereitet in interaktiver Karte, Gemeinde- sowie Bundesweiter Tabelle."
---

<header class="subpage-header">
  <div class="subpage-header__intro">
    <h1>Wie läuft der Ausbau von Dach- und Balkonsolar?</h1>
    <p class="body-text">
      Du findest hier aufbereitete Daten zum Solarausbau. Die Karte kombiniert eine Potenzialanalyse für Dachflächen in Brandenburg mit
      günstiger Sonnenausrichtung (Energieportal Brandenburg) mit allen im
      Marktstammdatenregister gemeldeten, bereits errichteten Solaranlagen
      je Gemeinde in Brandenburg. Verglichen wird die bereits installierte Leistung (kWp)
      mit dem modellierten Potenzial (kWp, kWh/a). Außerdem werden alle in Deutschland aktiven Balkonkraftwerke je gemeinde dargestellt. Details siehe
      <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
    </p>
  </div>
  <div class="subpage-header__media" aria-hidden="true">
    <img src="{{ '/assets/images/illustrations/illu-solarzelle.png' | relative_url }}" alt="">
  </div>
</header>

{% assign s = site.data.land_summary %}
{% assign f = site.data.land_summary_fmt %}
{% assign fd = site.data.land_summary_de_fmt %}

<section class="section solarpotenzial-intro">
  <div class="stat-row" aria-label="Landesweite Kennzahlen">
    <div class="stat-tile">
      <div class="stat-tile__label">Ausschöpfung Dach&shy;potenzial (Brandenburg)</div>
      <div class="stat-tile__value">{{ f.ausschoepfung_dach_prozent }} <small>%</small></div>
      <div class="stat-tile__sub">landesweiter Durchschnitt, je Gemeinde stark unterschiedlich</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Großstadt mit höchster Balkonsolardichte</div>
      <div class="stat-tile__value">{{ fd.top_stadt_name }}</div>
      <div class="stat-tile__sub">{{ fd.top_stadt_pro_100_haushalte }} Balkonkraftwerke je 100 Haushalte – unter den 10 größten deutschen Städten</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Bundesland mit höchster Balkonsolardichte</div>
      <div class="stat-tile__value">{{ fd.top_land_name }}</div>
      <div class="stat-tile__sub">{{ fd.top_land_pro_100_haushalte }} Balkonkraftwerke je 100 Haushalte – höchste Dichte aller 16 Bundesländer</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Balkonkraftwerke je 100 Haushalte in Deutschland</div>
      <div class="stat-tile__value">{{ fd.bundesweit_pro_100_haushalte }}</div>
      <div class="stat-tile__sub">bundesweiter Durchschnitt über rund 11.000 Gemeinden</div>
    </div>
  </div>

  <div class="map-section" id="karte">
    <h2>Karte je Gemeinde</h2>

    <div class="map-controls" role="group" aria-label="Kennzahl auf der Karte">
      <div class="map-controls__group">
        <div class="ui-upper-small map-controls__heading">Brandenburgweit</div>
        <div class="map-controls__buttons">
          <button type="button" data-metric="ausschoepfung" class="label label--midnight category-filter__item" aria-pressed="true">Ausschöpfung Dach (%)</button>
          <button type="button" data-metric="flaeche" class="label label--midnight category-filter__item" aria-pressed="false">Dachfläche-Potenzial (m²)</button>
          <button type="button" data-metric="bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Dach (kWp)</button>
          <button type="button" data-metric="frei_flaeche" class="label label--midnight category-filter__item" aria-pressed="false">Freifläche-Potenzial (m²)</button>
          <button type="button" data-metric="frei_bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Freifläche (kWp)</button>
          <button type="button" data-metric="balkon_bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Balkonsolar (kWp)</button>
        </div>
      </div>
      <div class="map-controls__group">
        <div class="ui-upper-small map-controls__heading">Deutschlandweit</div>
        <div class="map-controls__buttons">
          <button type="button" data-metric="balkon_de_pro100hh" class="label label--midnight category-filter__item" aria-pressed="false">Balkonkraftwerke je 100 Haushalte</button>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
      <div id="map" data-src="{{ '/assets/data/gemeinden.geojson' | relative_url }}" data-src-de="{{ '/assets/data/gemeinden_de_balkon.geojson' | relative_url }}" role="img" aria-label="Choroplethenkarte Brandenburgs nach Gemeinde"></div>
      <div id="map-legend" class="map-legend"></div>
    </div>

    <p class="note">
      Kartendaten: 413 Brandenburger Gemeinden. Klicken Sie auf eine Gemeinde für Detailwerte
      inklusive der Aufschlüsselung nach Eignungsklasse (gut/mittel/schlecht).
      Die Farbskala staucht die obersten Ausreißer (95./98. Perzentil) in die
      dunkelste Stufe, damit Unterschiede zwischen den übrigen Gemeinden
      sichtbar bleiben – die vollständigen Zahlen stehen in der
      <a href="#gemeinden" class="link-underline">Gemeindetabelle</a>.
      Einzige Ausnahme: „Balkonkraftwerke je 100 Haushalte (Deutschland)“
      zeigt zum Vergleich alle rund 11.000 Gemeinden bundesweit statt nur
      Brandenburg.
    </p>
  </div>
</section>

<section class="section section--dark" id="gemeinden">
  <h2 id="gemeinden-heading">Top 10 Gemeinden im Vergleich</h2>
  <p class="body-text" id="gemeinden-intro">
    Standardmäßig die zehn Gemeinden mit der höchsten Ausschöpfung des
    Dachpotenzials. Spalten sind sortierbar – das Top&nbsp;10 folgt dabei der
    jeweils gewählten Spalte. Über die Suche lässt sich unabhängig davon jede
    der 413 Brandenburger Gemeinden finden. Erläuterungen zu den Spalten:
    siehe <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
  </p>

  <div class="table-toolbar">
    <input type="search" id="table-search" placeholder="Gemeinde oder Landkreis suchen…" aria-label="Tabelle durchsuchen">
    <span class="ui-small" style="color:var(--text-muted);" id="table-count"></span>
  </div>

  <div class="table-wrap">
    <table class="data-table" id="gemeinden-table">
      <thead>
        <tr>
          <th data-type="text">Gemeinde</th>
          <th data-type="text">Typ</th>
          <th data-type="num" data-decimals="1" class="sorted-desc">Ausschöpfung Dach (%)</th>
          <th data-type="num">Dachfläche-Potenzial (m²)</th>
          <th data-type="num">Dach-Potenzial, amtlich (kWp)</th>
          <th data-type="num">Freifläche-Potenzial (m²)</th>
          <th data-type="num">Bestand Dach (Anzahl)</th>
          <th data-type="num">Bestand Dach (kWp)</th>
          <th data-type="num">Bestand Freifläche (kWp)</th>
          <th data-type="num">Bestand Balkonsolar (Anzahl)</th>
          <th data-type="num">Bestand Balkonsolar (kWp)</th>
        </tr>
      </thead>
      <tbody>
        {% for g in site.data.gemeinden_tabelle %}
        <tr>
          <td>{{ g.gemeinde_name }}</td>
          <td>{{ g.gemeinde_typ }}</td>
          <td data-sort="{{ g.ausschoepfung_dach_prozent }}">{{ g.ausschoepfung_dach_prozent }}</td>
          <td data-sort="{{ g.dach_flaeche_qm }}">{{ g.dach_flaeche_qm | plus: 0 | round }}</td>
          <td data-sort="{{ g.dach_leistung_amtlich_kwp }}">{{ g.dach_leistung_amtlich_kwp | plus: 0 | round }}</td>
          <td data-sort="{{ g.frei_flaeche_qm }}">{{ g.frei_flaeche_qm | plus: 0 | round }}</td>
          <td data-sort="{{ g.bestand_csv_dach_anzahl }}">{{ g.bestand_csv_dach_anzahl }}</td>
          <td data-sort="{{ g.bestand_dach_kwp_gesamt }}">{{ g.bestand_dach_kwp_gesamt | plus: 0 | round }}</td>
          <td data-sort="{{ g.bestand_csv_frei_kwp }}">{{ g.bestand_csv_frei_kwp | plus: 0 | round }}</td>
          <td data-sort="{{ g.bestand_csv_balkon_anzahl }}">{{ g.bestand_csv_balkon_anzahl }}</td>
          <td data-sort="{{ g.bestand_csv_balkon_kwp }}">{{ g.bestand_csv_balkon_kwp }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>

  <div id="gemeinden-notes-bb">
    <p class="note">
      Fläche und Potenzial umfassen nur Dachflächen der Eignungsklassen „gut“
      und „mittel“ – schlecht geeignete Flächen sind nicht
      eingerechnet (Aufschlüsselung je Gemeinde im Karten-Popup). „Ausschöpfung
      Dach“ setzt den Bestand ins Verhältnis zum amtlichen Dachpotenzial
      (Berechnungsweg siehe <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>).
      Zahlen werden clientseitig formatiert und nach Spalte sortiert – ein
      Klick auf den Spaltenkopf kehrt die Reihenfolge um.
    </p>
    <p class="note caveat">
      Balkonkraftwerke (steckerfertige Solaranlagen) werden als eigene Spalte
      ausgewiesen und fließen <strong>nicht</strong> in „Bestand Dach“
      oder die „Ausschöpfung Dach“-Berechnung ein: Die amtliche
      Dachflächen-Eignungskulisse modelliert ganze Dachflächen, keine
      Balkon-/Geländermontage. Details siehe
      <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
    </p>
  </div>
  <p class="note" id="gemeinden-notes-de" hidden>
    Angezeigt werden standardmäßig die zehn Gemeinden ab 500 Haushalten mit
    der höchsten Balkonkraftwerke-Dichte je 100 Haushalte – bundesweit, aus
    rund 11.000 Gemeinden. Normalisiert wird auf Haushalte statt
    Einwohner: ein Balkonkraftwerk wird je Wohnung installiert, nicht je
    Kopf. Kleinere Orte sind hier zudem ausgeklammert: bei sehr wenigen
    Haushalten verzerren schon einzelne Anlagen die Quote stark. Über die
    Suche lässt sich unabhängig von dieser Grenze jede einzelne deutsche
    Gemeinde finden. Datenquellen: Bestand aus dem Marktstammdatenregister,
    Haushaltszahl aus dem Zensus 2022 (Statistische Ämter des Bundes und der
    Länder), Gemeindegrenzen vom Bundesamt für Kartographie und Geodäsie
    (VG250-EW).
  </p>

  <div id="laender-section" hidden>
    <h2 id="laender-heading">Balkonkraftwerke je Bundesland</h2>
    <p class="body-text" id="laender-intro">
      Je Bundesland aus allen zugehörigen Gemeinden aggregiert: Summe der
      Balkonkraftwerke und Haushalte, daraus die Dichte je 100 Haushalte.
      Alle 16 Bundesländer, Spalten sind sortierbar.
    </p>
    <div class="table-wrap">
      <table class="data-table" id="laender-table">
        <thead>
          <tr></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <p class="note">
      Berechnet aus den bundesweiten Gemeindedaten (Marktstammdatenregister,
      Haushaltszahl: Zensus 2022) – keine amtlich je Bundesland ausgewiesene
      Statistik.
    </p>
  </div>
</section>

<section class="section section--sand" id="methodik">

<div class="methodik-content" markdown="1">

## Methodik & Quellen

### Datenquellen

**1. Solarpotenzial (Flächen mit günstiger Sonnenausrichtung)**
Der WFS-Dienst `solaratlas_solarbericht` des [Energieportals Brandenburg](https://energieportal-brandenburg.de/)
(Betreiber: Wirtschaftsförderung Land Brandenburg GmbH, WFBB) liefert je
Gemeinde amtlich modellierte Statistiken der Potenzialanalyse für Dach- und
Freiflächen-Photovoltaik – u. a. Flächen je Eignungsklasse (gut/mittel/schlecht,
abhängig von Dachausrichtung, -neigung und Verschattung), amtlich modellierte
Leistung (kWp) und Jahresertrag (MWh). Die Statistikdaten wurden per WFS
`GetFeature`-Request abgerufen (413 Gemeinden, Stand Berichtsjahr 2025).
Lizenz: [Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0).

**2. Bestandsanlagen**
Grundlage ist ein Auszug aus dem **Marktstammdatenregister (MaStR)** der
Bundesnetzagentur für das Bundesland Brandenburg. Verarbeitet werden
ausschließlich die Zeilen mit Energieträger „Solare Strahlungsenergie“ und
Betriebs-Status „In Betrieb“.

### Verknüpfung von Potenzial und Bestand

Die CSV-Exporte enthalten den amtlichen **Gemeindeschlüssel** (AGS,
8-stellig) – exakt dasselbe Schlüsselfeld, das auch die Potenzialstatistik
je Gemeinde ausweist. Da eine Postleitzahl in Brandenburg oft mehrere
Gemeinden überlappt oder eine Gemeinde mehrere PLZ umfasst, liefert der
Gemeindeschlüssel eine eindeutige, verzerrungsfreie Zuordnung und wurde
deshalb für die Kartenverknüpfung verwendet.

### Nur gut und mittel geeignete Dachflächen einbezogen

Die amtliche Statistik teilt jede Dachfläche in eine Eignungsklasse ein –
**gut**, **mittel** oder **schlecht** – abhängig von Dachausrichtung,
-neigung und Verschattung. Alle auf dieser Seite ausgewiesenen
Dachpotenzial-Kennzahlen (Gesamtfläche und amtliches Potenzial) summieren nur die Klassen **gut** und **mittel**. Schlecht geeignete Flächen
fließen **nicht** in diese Summen ein, da eine Belegung dort technisch zwar
möglich, aber wirtschaftlich in der Regel nicht sinnvoll ist. Die Flächen-
und Leistungswerte je Eignungsklasse (einschließlich „schlecht“) stehen für
jede Gemeinde vollständig im Karten-Popup („Detailwerte“, siehe
[Karte je Gemeinde](#karte)).

### Freiflächen-Potenzial

Die amtliche Statistik weist Freiflächen-Potenzial nach Flächenkategorie
aus (Grünland, Ackerland/„Nutzpflanzen“, Randstreifen, Parkplätze,
Konversionsflächen, Halden, Gewässer u. a.), teils mit zwei alternativen
Montage-Technologien (horizontal / bifazial) **auf derselben Fläche**. Um
Flächen nicht doppelt zu zählen, geht in die Summe je Gemeinde nur die
horizontale (bzw. die einzige verfügbare) Variante je Kategorie ein.

**Wichtiger Unterschied zum Dachpotenzial:** Die Freiflächen-Kulisse bildet
die weit gefasste rechtliche/planerische Eignung nach dem EEG ab
(u. a. „benachteiligte Gebiete“, Seitenrandstreifen, ganze
Ackerflächen-Kategorien) – nicht die Sonnenausrichtung, die bei
Freiflächenanlagen frei wählbar ist. Die daraus resultierende Gesamtfläche
ist landesweit mit rund 19.000 km² sehr groß (das entspricht ca. 64 % der
Landesfläche Brandenburgs) und ist als **theoretische, rechtlich denkbare
Maximalkulisse** zu verstehen, nicht als realistische Ausbaufläche. Sie wird
auf der Karte deshalb als eigener, klar benannter Layer geführt und nicht
mit dem Dachpotenzial vermischt.

### Balkonkraftwerke (Steckersolaranlagen)

Die MaStR-Exporte führen steckerfertige Solaranlagen („Balkonkraftwerke“)
als eigene `Art der Solaranlage` neben Gebäude- und Freiflächenanlagen.
Diese Auswertung zählt sie **separat**, statt sie unter „Dach“ mitzuzählen:
die amtliche Dachflächen-Eignungskulisse (gut/mittel/schlecht) modelliert
ganze Dachflächen, keine einzelnen Balkon-, Fassaden- oder
Geländemontagen – eine Gegenrechnung gegen das Dachpotenzial wäre also
methodisch nicht sauber. Anzahl und Leistung (kWp) je Gemeinde stehen als
eigene Spalten in der [Gemeindetabelle](#gemeinden) und als eigener
Karten-Layer „Bestand Balkonkraftwerke“ zur Verfügung; sie fließen **nicht**
in „Bestand Dach“, „Bestand gesamt“ oder die Ausschöpfungsgrad-Berechnung
ein.

### Bundesweiter Vergleich: Balkonkraftwerke je 100 Haushalte

Der einzige deutschlandweite Filter (Karte, [Gemeindetabelle](#gemeinden) und
[Bundesländer-Tabelle](#gemeinden)) normalisiert den Balkonkraftwerke-Bestand
auf **Haushalte statt Einwohner**: Ein Balkonkraftwerk wird je Wohnung bzw.
Haushalt installiert, nicht je Kopf – bei unterschiedlicher durchschnittlicher
Haushaltsgröße (Großstadt vs. Land) ist die Haushaltszahl daher der
methodisch passendere Nenner für einen fairen Vergleich.

Die Haushaltszahl je Gemeinde stammt aus dem **Zensus 2022** (Stichtag
15.05.2022, Statistische Ämter des Bundes und der Länder), Tabelle „Haushalte
und Familien“, Feld „Haushalte insgesamt“. Der Zensus weist Gemeinden über
den 12-stelligen Amtlichen Regionalschlüssel (ARS) statt des 8-stelligen
Amtlichen Gemeindeschlüssels (AGS) aus; beide sind deckungsgleich aufgebaut,
sodass sich der AGS durch Weglassen der 4-stelligen
Gemeindeverband-Kennziffer ableiten lässt (`AGS = ARS[0:5] + ARS[9:12]`).
Von den rund 11.000 Gemeinden im Datensatz (Gemeindegrenzen: BKG VG250-EW)
lassen sich so gut 98 % einer Zensus-Haushaltszahl zuordnen; die
verbleibenden gut 200 sind ganz überwiegend gemeindefreie Gebiete (Wälder
u. Ä.) ohne Einwohner und Haushalte. Für Gemeinden ohne zugeordnete
Haushaltszahl bleibt die Quote ohne Wert, sie tauchen in Karte und Tabellen
aber weiterhin mit ihrem Balkonkraftwerke-Bestand auf.
Lizenz der Zensus-Daten: Vervielfältigung und Verbreitung, auch auszugsweise,
mit Quellenangabe gestattet (© Statistische Ämter des Bundes und der Länder).

### Ausschöpfungsgrad

Für jede Gemeinde wird der Ausschöpfungsgrad des Dachpotenzials
berechnet – auf Basis von Gebäudesolaranlagen (ohne Balkonkraftwerke,
s. o.):

```
Ausschöpfung (%) = Bestand Gebäudesolaranlagen (kWp, MaStR)
                    ÷ amtliches Dach-Potenzial (kWp, gut + mittel)
                    × 100
```

Werte variieren stark je Gemeinde – kleine Gemeinden mit wenigen, aber
großen Dachanlagen (z. B. landwirtschaftliche Hallen) können hier deutlich
über dem Durchschnitt liegen.

### Bekannte Einschränkung: nicht zuordenbare Anlagen

Von den rund 178.000 in Betrieb befindlichen Solar-Einträgen tragen ca. 250
(0,14 %) einen Gemeindeschlüssel, der in der aktuellen Potenzialstatistik
(Berichtsjahr 2025) nicht vorkommt. Der überwiegende Teil davon betrifft
einige Uckermärkische Gemeinden (u. a. Mark Landin, Berkholz-Meyenburg,
Passow, Schöneberg), deren Gemeindeschlüssel vermutlich durch eine
kommunale Gebietsreform von dem im WFS hinterlegten Stand abweicht, sowie
vereinzelte MaStR-Einträge, die trotz Bundesland „Brandenburg“ auf
Gemeinden in Nachbarländern verweisen (Datenpflegefehler im Register).
Diese Anlagen fehlen in der Gemeindekarte und in den Landessummen.

### Technische Umsetzung & Einschränkungen

- Geometrien der 413 Gemeinden stammen aus dem WFS (EPSG:25833, per
  `srsName=EPSG:4326` direkt in WGS84 abgerufen) und wurden für die
  Kartendarstellung geometrisch vereinfacht (Douglas-Peucker, Toleranz
  ≈ 0,0006°, das entspricht ca. 40–60 m) – für die Choroplethen-Darstellung
  ausreichend, nicht für exakte Grenzverläufe geeignet.
- Die Farbskala der Karte ist eine sequenzielle Gelb-Orange-Braun-Rampe; die obersten
  Ausreißer (95./98. Perzentil je Kennzahl) werden in der dunkelsten Stufe
  zusammengefasst, damit Unterschiede zwischen den übrigen Gemeinden
  sichtbar bleiben. Exakte Werte stehen immer im Popup bzw. in der
  [Gemeindetabelle](#gemeinden).

### Kein amtliches Angebot

Diese Auswertung ist eine unabhängige Aufbereitung öffentlich
bereitgestellter Daten und kein amtliches Produkt des Landes Brandenburg
oder der Bundesnetzagentur. Für verbindliche Aussagen (z. B. zur
Förderfähigkeit einer konkreten Fläche) sind die Originalquellen und eine
fachliche Beratung heranzuziehen.

</div>

</section>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script src="{{ '/assets/js/solarpotenzial-map.js' | relative_url }}"></script>
<script src="{{ '/assets/js/solarpotenzial-table.js' | relative_url }}"></script>
