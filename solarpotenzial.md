---
layout: default
title: Solarpotenzial Brandenburg
permalink: /solarpotenzial/
description: "Wie weit ist Brandenburgs Solarpotenzial ausgeschöpft? Interaktive Karte, Gemeindetabelle und Methodik zu Dach- und Freiflächen-Photovoltaik in allen 413 Gemeinden."
---

<header class="subpage-header">
  <div class="subpage-header__intro">
    <h1>Wie weit ist Brandenburgs Solarpotenzial ausgeschöpft?</h1>
    <p class="body-text">
      Die Karte kombiniert die amtliche Potenzialanalyse für Dachflächen mit
      günstiger Sonnenausrichtung (Energieportal Brandenburg) mit allen im
      Marktstammdatenregister gemeldeten, bereits errichteten Solaranlagen –
      je Gemeinde. Flächen werden zusätzlich in installierbare Leistung (kWp)
      und potenziellen Jahresertrag (kWh) umgerechnet, auf Basis eines
      aktuellen 500-Wp-Panels (1993 × 1134 × 30&nbsp;mm). Details siehe
      <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
    </p>
  </div>
  <div class="subpage-header__media" aria-hidden="true">
    <img src="{{ '/assets/images/illustrations/illu-solarzelle.png' | relative_url }}" alt="">
  </div>
</header>

{% assign s = site.data.land_summary %}
{% assign f = site.data.land_summary_fmt %}

<section class="section solarpotenzial-intro">
  <div class="stat-row" aria-label="Landesweite Kennzahlen">
    <div class="stat-tile">
      <div class="stat-tile__label">Dach-Potenzialfläche gesamt</div>
      <div class="stat-tile__value">{{ f.dach_flaeche_qm }} <small>m²</small></div>
      <div class="stat-tile__sub">Flächen mit guter und mittlerer Sonnenausrichtung – schlecht geeignete Flächen ausgenommen</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Dachpotenzial, eigene Berechnung</div>
      <div class="stat-tile__value">{{ f.dach_leistung_eigen_kwp }} <small>kWp</small></div>
      <div class="stat-tile__sub">{{ f.dach_menge_eigen_kwh }} kWh potenzieller Jahresertrag</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Bestand Dachanlagen (MaStR)</div>
      <div class="stat-tile__value">{{ f.bestand_dach_kwp }} <small>kWp</small></div>
      <div class="stat-tile__sub">{{ f.bestand_dach_anzahl }} Gebäudesolaranlagen in Betrieb</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Ausschöpfung Dachpotenzial</div>
      <div class="stat-tile__value">{{ f.ausschoepfung_dach_prozent }} <small>%</small></div>
      <div class="stat-tile__sub">landesweiter Durchschnitt, je Gemeinde stark unterschiedlich</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__label">Bestand Balkonsolar (MaStR)</div>
      <div class="stat-tile__value">{{ f.bestand_balkon_anzahl }} <small>Steckersolaranlagen</small></div>
      <div class="stat-tile__sub">{{ f.bestand_balkon_kwp }} kWp installierte Leistung – separat ausgewiesen, nicht in der Ausschöpfung enthalten</div>
    </div>
  </div>

  <div class="map-section" id="karte">
    <h2>Karte je Gemeinde</h2>

    <div class="map-controls" role="group" aria-label="Kennzahl auf der Karte">
      <button type="button" data-metric="ausschoepfung" class="label label--midnight category-filter__item" aria-pressed="true">Ausschöpfung Dach (%)</button>
      <button type="button" data-metric="flaeche" class="label label--midnight category-filter__item" aria-pressed="false">Dachfläche-Potenzial (m²)</button>
      <button type="button" data-metric="bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Dach (kWp)</button>
      <button type="button" data-metric="frei_flaeche" class="label label--midnight category-filter__item" aria-pressed="false">Freifläche-Potenzial (m²)</button>
      <button type="button" data-metric="frei_bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Freifläche (kWp)</button>
      <button type="button" data-metric="balkon_bestand" class="label label--midnight category-filter__item" aria-pressed="false">Bestand Balkonsolar (kWp)</button>
    </div>

    <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
      <div id="map" data-src="{{ '/assets/data/gemeinden.geojson' | relative_url }}" role="img" aria-label="Choroplethenkarte Brandenburgs nach Gemeinde"></div>
      <div id="map-legend" class="map-legend"></div>
    </div>

    <p class="note">
      Kartendaten: 413 Gemeinden. Klicken Sie auf eine Gemeinde für Detailwerte
      inklusive der Aufschlüsselung nach Eignungsklasse (gut/mittel/schlecht).
      Die Farbskala staucht die obersten Ausreißer (95./98. Perzentil) in die
      dunkelste Stufe, damit Unterschiede zwischen den übrigen Gemeinden
      sichtbar bleiben – die vollständigen Zahlen stehen in der
      <a href="#gemeinden" class="link-underline">Gemeindetabelle</a>.
    </p>
  </div>
</section>

<section class="section section--dark" id="gemeinden">
  <h2>Alle 413 Gemeinden im Vergleich</h2>
  <p class="body-text">
    Potenzial- und Bestandskennzahlen je Gemeinde. Spalten sind sortierbar,
    die Suche filtert nach Gemeinde- oder Landkreisname. Erläuterungen zu
    den Spalten: siehe <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
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

  <p class="note">
    Fläche und Potenzial umfassen nur Dachflächen der Eignungsklassen „gut“
    und „mittel“ – schlecht geeignete Flächen sind hier bewusst nicht
    eingerechnet (Aufschlüsselung je Gemeinde im Karten-Popup). „Ausschöpfung
    Dach“ setzt den Bestand ins Verhältnis zum eigenen, panelbasierten
    Dachpotenzial (Berechnungsweg siehe <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>);
    „amtlich“ ist die vom Land Brandenburg modellierte Vergleichsleistung.
    Zahlen werden clientseitig formatiert und nach Spalte sortiert – ein
    Klick auf den Spaltenkopf kehrt die Reihenfolge um.
  </p>
  <p class="note caveat">
    Balkonkraftwerke (steckerfertige Solaranlagen) werden als eigene Spalte
    ausgewiesen und fließen bewusst <strong>nicht</strong> in „Bestand Dach“
    oder die „Ausschöpfung Dach“-Berechnung ein: Die amtliche
    Dachflächen-Eignungskulisse modelliert ganze Dachflächen, keine
    Balkon-/Geländermontage. Details siehe
    <a href="#methodik" class="link-underline">Methodik&nbsp;&amp;&nbsp;Quellen</a>.
  </p>
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

### Verknüpfung Potenzial ↔ Bestand

Die CSV-Exporte enthalten den amtlichen **Gemeindeschlüssel** (AGS,
8-stellig) – exakt dasselbe Schlüsselfeld, das auch die Potenzialstatistik
je Gemeinde ausweist. Da eine Postleitzahl in Brandenburg oft mehrere
Gemeinden überlappt oder eine Gemeinde mehrere PLZ umfasst, liefert der
Gemeindeschlüssel eine eindeutige, verzerrungsfreie Zuordnung und wurde
deshalb für die Kartenverknüpfung verwendet.

### Nur gut und mittel geeignete Dachflächen

Die amtliche Statistik teilt jede Dachfläche in eine Eignungsklasse ein –
**gut**, **mittel** oder **schlecht** – abhängig von Dachausrichtung,
-neigung und Verschattung. Alle auf dieser Seite ausgewiesenen
Dachpotenzial-Kennzahlen (Gesamtfläche, eigene Berechnung **und** amtlicher
Vergleichswert) summieren bewusst nur die Klassen **gut** und **mittel**.
Schlecht geeignete Flächen fließen **nicht** in diese Summen ein, da eine
Belegung dort technisch zwar möglich, aber wirtschaftlich in der Regel nicht
sinnvoll ist. Die Flächen-, Leistungs- und Ertragswerte je Eignungsklasse
(einschließlich „schlecht“) stehen für jede Gemeinde vollständig im
Karten-Popup („Detailwerte“, siehe [Karte je Gemeinde](#karte)).

### Panel-Annahme

Alle „eigene Berechnung“ genannten Kennzahlen basieren auf einem aktuellen
500-Wp-Panel mit folgenden Maßen:

| Größe | Wert |
|---|---|
| Breite × Höhe | 1.993 mm × 1.134 mm |
| Modulfläche | 2,2601 m² |
| Nennleistung | 500 Wp |
| Leistungsdichte | **221,2 Wp/m²** (0,2212 kWp/m²) |

Die amtliche Dach-Potenzialfläche der Klassen „gut“ und „mittel“ (in m²)
wird mit dieser Dichte in eine installierbare Leistung (kWp) umgerechnet –
**ohne** Abzug für Abstände, Verschattung durch Dachaufbauten oder Statik;
es handelt sich also um ein technisches Maximum bei lückenloser Verlegung,
nicht um eine realistische Ausbauprognose.

### Von kWp zu kWh

Watt-Peak beschreibt maximale Leistung einer Anlage. Um einen **potenziellen
Jahresertrag in kWh** anzugeben, wird je Eignungsklasse ein spezifischer
Ertrag (kWh pro kWp und Jahr) benötigt. Anstatt einen pauschalen Wert zu
schätzen, wird er aus der amtlichen Statistik selbst abgeleitet:

```
spezifischer Ertrag (kWh/kWp/a) = amtliche Ertragsmenge (MWh/a) × 1000
                                   ÷ amtliche Leistung (kWp)
```

je Eignungsklasse und Gemeinde. Das überträgt die vom Land bereits
modellierte Sonneneinstrahlung, Verschattung und Ausrichtung auf die mit
dem Panel berechnete eigene Leistung. Ist die amtliche Leistung einer
Klasse in einer Gemeinde 0 kWp (keine Fläche dieser Klasse), wird
ersatzweise ein konservativer Richtwert verwendet: **gut 950 / mittel 750 /
schlecht 500 kWh/kWp/a**.

```
eigene kWp (Klasse)  = Fläche (m²) × 0,2212 kWp/m²
eigene kWh/a (Klasse) = eigene kWp (Klasse) × spezifischer Ertrag (Klasse)
```

Diese Rechnung läuft weiterhin je Eignungsklasse einzeln, damit jede Klasse
ihren eigenen spezifischen Ertrag erhält; in die ausgewiesenen Summen
(Landeskennzahlen, Karten-Popup und die Ausschöpfungsgrad-Berechnung der
Gemeindetabelle) gehen davon nur **gut** und **mittel** ein – der Wert für
„schlecht“ wird je Gemeinde berechnet, aber nicht mitaddiert und nur im
Karten-Popup gezeigt.

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

### Ausschöpfungsgrad

Für jede Gemeinde wird der Ausschöpfungsgrad des **Dach**potenzials
berechnet – auf Basis von Gebäudesolaranlagen (ohne Balkonkraftwerke,
s. o.):

```
Ausschöpfung (%) = Bestand Gebäudesolaranlagen (kWp, MaStR)
                    ÷ eigenes Dach-Potenzial (kWp, Panel-Berechnung)
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
- Die Farbskala der Karte ist eine sequenzielle Blau-Rampe; die obersten
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
