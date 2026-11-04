# Landingpage

Statische Seite für „Earth Now – Live Earth Wallpaper“, vorbereitet für GitHub Pages.

```
site/
  index.html              Landingpage (ohne externe Abhängigkeiten, keine Webfonts, kein Tracking)
  earth -> ../web         Symlink: die Live-Erde im Hero ist dieselbe Seite wie in der App
  favicon.ico             16/32/48 px
  assets/icon/            Favicon (SVG), Apple-Touch-Icon, App-Icon 512 px
  assets/screenshots/     Kopien von docs/preview.png und docs/settings.png
  .nojekyll               Pages soll die Dateien unverändert ausliefern
```

## Lokal ansehen

```bash
python3 -m http.server 8000 --directory site
```

Dann <http://localhost:8000> öffnen. Der Hero lädt `earth/index.html?motion=sun…`, die Kamera folgt also
der Sonne, damit Besucher immer Tagseite und Dämmerungszone sehen.

## Veröffentlichen (noch nicht passiert)

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Actions → **Landingpage veröffentlichen** → *Run workflow*.

Der Workflow (`.github/workflows/pages.yml`) läuft nur manuell. Er löst den Symlink auf und lädt
`site/` inkl. `web/` (≈ 14 MB Texturen) hoch.

## Vor dem Livegang

- Download-Button: in `index.html` `href` auf die DMG setzen und `aria-disabled="true"` entfernen,
  Hinweis „Bald verfügbar“ anpassen.
- Impressum/Datenschutz ergänzen (in Deutschland Pflicht für eine öffentliche Produktseite).
  Hinweis für die Datenschutzerklärung: Die Live-Erde lädt Wolkenbilder von `clouds.matteason.co.uk`,
  dabei wird die IP-Adresse der Besucher an diesen Server übertragen.
- Screenshots in `assets/screenshots/` nach Änderungen an `docs/` neu kopieren.
- Der EUMETSAT-Hinweis („Contains modified EUMETSAT data“) muss sichtbar bleiben, solange Live-Wolken
  angezeigt werden (siehe `CREDITS.md`).

Das App-Icon und seine Exporte liegen in `design/icon/` (siehe dortiges README).
