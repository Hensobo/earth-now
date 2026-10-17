# Credits & Lizenzen

Earth Now nutzt folgende Inhalte und Bibliotheken von Dritten.

## Bilder & Daten

| Inhalt | Quelle | Lizenz / Hinweis |
|---|---|---|
| Tagesansicht der Erde (`web/textures/day.jpg`) | NASA Earth Observatory, *Blue Marble: Next Generation* (Oktober 2004, mit Topografie & Bathymetrie), Reto Stöckli | Gemeinfrei (Werk der US-Regierung). Quellenangabe erbeten: „NASA Earth Observatory“ |
| Nachtlichter (`web/textures/night.jpg`) | NASA Earth Observatory, *Black Marble 2016* | Gemeinfrei (Werk der US-Regierung). Quellenangabe erbeten: „NASA Earth Observatory / Suomi NPP VIIRS“ |
| Statische Wolken, Normal- & Glanzkarte (`clouds.png`, `normal.jpg`, `specular.jpg`) | three.js-Beispieltexturen (`examples/textures/planets`) | MIT-Lizenz, siehe unten |
| Live-Wolken (zur Laufzeit geladen) | [matteason/live-cloud-maps](https://github.com/matteason/live-cloud-maps), Bilder: CC0 1.0 | **Pflichthinweis:** *Contains modified EUMETSAT data* ([EUMETSAT-Datenlizenz](https://www.eumetsat.int/eumetsat-data-licensing)) |

Der EUMETSAT-Hinweis steht in der App im Einstellungsfenster unter „Darstellung“.

## Software

| Bibliothek | Version | Lizenz |
|---|---|---|
| [three.js](https://threejs.org) (`web/lib/three.module.min.js`) | 0.160.0 | MIT, Lizenztext: [`licenses/three.js-LICENSE.txt`](licenses/three.js-LICENSE.txt) |

## Vor einer kommerziellen Nutzung prüfen

- **EUMETSAT-Daten:** Die Lizenzbedingungen von EUMETSAT unterscheiden je nach Datensatz zwischen nicht-kommerzieller und kommerzieller Nutzung. Für eine kostenlose App reicht der Hinweis oben; bei einer Bezahl-App die Bedingungen vorher genau lesen.
- **Wolken-Server:** `clouds.matteason.co.uk` ist ein privat betriebenes Projekt. Bei größerer Verbreitung den Betreiber informieren (Kontakt im README des Projekts) oder die Wolkenkarten selbst hosten.
