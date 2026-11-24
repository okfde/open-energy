du bist ein programmierer, der einen ästhetischen anspruch hat, aber dennoch technisch genau arbeitet. du wählst möglichst schlanke lösungen, um wenig scripts und frameworks nutzen zu müssen. du programmierst so, dass die anwendung möglichst umweltschonen läuft. Ziel ist es, die unterseite /do-it-yourself auszubauen. dort soll ein unser möglichst schnell eine antwort auf die frage bekommen, wie er selbst strom erzeugen kann. das selbermachen soll mit dieser unterseite gefördert werden. gleichzeitig soll auf bestehendes wissen im netz verlinkt werden. dazu sollen einerseits content-karten entstehen, die in erster instanz bei der orientierung helfen und um zu entscheiden, welche variante für den user in frage kommt (balkonsolar, dachsolar etc). nach dem klick auf eine content-karte soll der user mehr details zu dem jeweiligen aspekt bekommen und darunter hilfreiche ressourcen angezeigt bekommen, wie die person selbstständig zum ziel kommt. du sollst einen formularartigen filter bauen, der 1. nach dem ausfüllen dazu führt, dass eine kurze beschreibung abhängig zu den ausgefüllten fragen anzeigt sowie den content entsprechend der antworten filtert.

## Formular basierter Filter
Folgendes soll ein Formular abfragen. die hierarchie der bullets stellt die struktur der abfrage dar. wenn ich bei "ich verfüge" auf "über eine mietswohnung" anklicke, kommt danach die abfrage nach dem balkon. Der Text hinter "Button: " soll in den Button. Der andere Text ist die Beschreibung zum Button. Nutze für das Button Design den selben STyle wie auf der /datenanalyse unterseite:

* An folgendem Ort möchte ich meine Strom selbst erzeugen 
    * Button: Mietshaus oder -wohnung
        * Button: mit Balkon Richtung Süden, Osten, Westen
        * Button: mit Garten
    * Button: Eigenheim
        * Button: mit Garten > 100qm
        * Button: mit Dach in südlicher, östlicher oder westlicher Ausrichtung
        * mit Balkon Richtung Süden, Osten, Westen
    * Bauernhof / landwirtschaftliche Flächen
    * Kleingarten / eine abgelegene Hütte
* Ich möchte..
    * Meine Anlage mit dem Stromnetz verbinden, um die Stromrechnung zu verringern oder zur Energiewende beizutragen (Button: On-the-Grid)
    * Unabhängig vom Stromnetz meinen Strom nutzen (Button: Off-the-Grid)


## was wird angezeigt, default: 
was ist dauerhaft sichtbar, ohne dass eine abfrage via formular-filter abgeschickt wurde?

Karten zu folgenden möglichkeiten:
* Balkonsolar
* Dachsolar
* Freiflächensolar
* Agri-PV
* Kleinwind
* Speicher mit dynmaischem Stromtarif

Auf jeder Karte sind folgende Informationen:
* Kurzbeschreibung
* Kosten von - bis (was kann durch selbermachen eingespart werden, von: kaufen und einstecken bis zu: einzelne komponenten selbst bauen, wie zb akku)
* Was ist rechtlich niederschwellig erlaubt?

Karten der Open Source Werkstatt. das ist ein bereich, der aktuelle open source projekte darstellt, die das selbermachen besönders fördern. nutze dazu den bestehenden content der /do-it-yourself unterseite, ohne selbstbau.solar.

## Ansicht nach dem Abschicken des Formulars / Filters
Sichtbar sind die Karten, die nach der Abfrage möglich sind. Wohnt z.B. jemand in einer Mietswohnung mit Balkon, bekommt die Person die Karte Balkonsolar angezeigt. Hat sie hingegen keinen Balkon oder garten, wird eine Karte angezeigt, wie man als Privatperson und Speicher sowie dynamischem Stromtarif Stromkosten einsparen kann. 

## Ansicht nach Klick auf Karte
Nach dem Klick auf eine Karte wird eine Übersicht angezeigt. Zunächst wird beschrieben, um was es sich genau handelt und welche rechtlichen Rahmenbedingungen gelten. 

Es wird eine schematische Übersicht angezeigt, aus welchen Komponenten die Anlage besteht bzw wie sie miteinander verbunden sind

Darunter finden sich verschiedene Ressourcen, wie die jeweiligen Komponenten gebaut werden können. 

Darunter werden konkrete Open Source "Produkte" empfohlen, die für die Umsetzung verwendet werden können. nutze dazu den bestehenden content der /do-it-yourself unterseite, ohne selbstbau.solar.

## design und datenstruktur 

die content-karten sollen in einem .yml file abgelegt werden. sie linken auf unterseiten. content, der dann auf diesen unterseiten angezeigt wird (verlinkte ressourcen auf anderen websites) soll auch wieder in einer .yml-datei liegen. nutze dazu die angehängte .csv mit ressourcen. wähle nur die aus, die inhaltlich passend sind. sobald eine unterseite die gleiche kategorie hat wie die, die im .yml angegeben ist, erscheint der content unter der unterseite. in der letztgenannten .yml sollen auch die aktuellen open-source-ressourcen liegen. nutze außerdem den unterordner "_diy", in dem die unterseiten zu bestimmten inhalten liegen sollen, auf die die content-karten verlinken (ordnername: topics) 

nutze insgesamt für das design so viele bestehende elemente wie möglich. orientiere dich am design der website. 

wenn etwas unklar ist, frage nach.