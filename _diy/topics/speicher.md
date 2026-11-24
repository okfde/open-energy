---
title: "Speicher mit dynamischem Stromtarif"
category: speicher
description: "Stromkosten senken mit Steckerspeicher und dynamischem Stromtarif – bis 800 W per Steckdose, auch ohne eigene Solaranlage. DIY-Akku und Energiemanagement."
intro: "Mit einem dynamischen Stromtarif ändert sich der Strompreis stündlich – je nachdem, wie viel Wind- und Solarstrom gerade im Netz ist. Ein Akku an der Steckdose lädt, wenn Strom günstig ist, und speist bis 800 Watt ins Hausnetz, wenn er teuer wird. So sparst du Geld und entlastest das Netz, auch ganz ohne Balkon oder Dach."
schema_note: "Der Speicher hängt wie ein Balkonkraftwerk an der Steckdose und speist höchstens 800 W ein. Eine Software steuert ihn nach dem stündlichen Strompreis und dem aktuellen Verbrauch im Haushalt."
schema:
  - name: "Stromnetz"
    text: "mit dynamischem Tarif"
    flow: "AC"
  - name: "Smart Meter"
    text: "intelligentes Messsystem, nötig für den dynamischen Tarif"
    flow: "Messwerte"
  - name: "Energiemanagement"
    text: "z. B. OpenDTU-OnBattery oder evcc: lädt bei niedrigen Preisen, speist bei hohen ein"
    flow: "steuert"
  - name: "Ladegerät & Mikrowechselrichter"
    text: "lädt aus der Steckdose, speist max. 800 W zurück"
    flow: "DC"
  - name: "Akku mit BMS"
    text: "LiFePO4-Zellen, Batteriemanagement schützt jede Zelle"
---

## Worum geht es?

Strom ist an der Börse nachts und an sonnigen oder windigen Tagen oft günstig, am frühen Abend dagegen teuer. Mit einem dynamischen Tarif zahlst du diesen stündlichen Preis direkt. Ein Steckerspeicher verschiebt deinen Verbrauch in die günstigen Stunden: Er lädt aus der Steckdose, wenn der Preis niedrig ist, und deckt mit bis zu 800 Watt deine Grundlast, wenn er hoch ist. Ohne Speicher kannst du schon sparen, indem du Waschmaschine, Spülmaschine oder Ladestation zeitlich steuerst.

Mit 800 Watt Einspeisung ist ein Akku mit 5 Kilowattstunden in gut sechs Stunden leer – genug, um die teuren Abend- und Nachtstunden zu überbrücken. Größere Akkus bringen bei dieser Grenze wenig zusätzlichen Nutzen.

Den Akku selbst zu bauen ist ein lohnendes DIY-Projekt: LiFePO4-Einzelzellen, ein Batteriemanagementsystem (BMS), ein Ladegerät und ein Mikrowechselrichter kosten zusammen etwas weniger als ein fertiger Steckerspeicher gleicher Größe. Das verlangt aber Sorgfalt: Akkus speichern viel Energie, und Fehler beim Bau können zu Bränden führen. Lies die Sicherheitshinweise in den Ressourcen unten, bevor du startest.

**Nur mit Netzanschluss:** Ein dynamischer Tarif setzt die Verbindung zum Stromnetz voraus. Für eine Inselanlage ohne Netz brauchst du zwar auch einen Akku – geladen wird er dann aber von eigenen Solarmodulen oder einem Windrad (siehe [Balkonsolar](../balkonsolar/), [Freiflächensolar](../freiflaechensolar/) und [Kleinwind](../kleinwind/)).

## Rechtliche Rahmenbedingungen

- **Grauzone Steckerspeicher:** Für Akkus, die per Stecker aus dem Netz laden und bis 800 W zurückspeisen, gibt es noch keine eigene Produktnorm. Die Norm für Steckersolargeräte (DIN VDE V 0126-95) gilt laut DKE nur ohne Speicher. Steckerspeicher werden trotzdem verbreitet ohne Elektriker betrieben – rechtlich abschließend geklärt ist das aber nicht.
- **800 W pro Anschluss:** Die Grenze gilt für alles, was an deinem Anschluss per Stecker einspeist. Hast du zusätzlich ein Balkonkraftwerk, dürfen beide zusammen nicht mehr als 800 W einspeisen.
- **Zertifizierter Wechselrichter:** Nutze nur einen Mikrowechselrichter mit Netz- und Anlagenschutz nach VDE-AR-N 4105. Er schaltet bei einem Netzausfall sofort ab.
- **Marktstammdatenregister:** Den Speicher trägst du binnen eines Monats nach Inbetriebnahme ein – getrennt von einem Balkonkraftwerk.
- **Dynamischer Tarif:** Seit 2025 muss jeder Stromanbieter einen dynamischen Tarif anbieten.
- **Smart Meter:** Für den dynamischen Tarif brauchst du ein intelligentes Messsystem. Du hast das Recht, es beim Messstellenbetreiber zu verlangen; die Kosten sind gesetzlich gedeckelt und nicht in den Preisen oben enthalten.
- **Größere Speicher:** Wer mehr als 800 W einspeisen will, braucht einen fest installierten Speicher, den ein Elektrofachbetrieb anschließt.
