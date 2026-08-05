# Purrkour

Purrkour ist ein browserbasierter Reise-Runner mit prozedural gezeichneter Canvas-Welt, wechselnden Themen, Sammelobjekten und Setpieces. Saubere Aktionen bauen einen Flow-Multiplikator auf; das HUD zeigt den aktuellen Reiseabschnitt und dessen Fortschritt.

## Lokal starten

Voraussetzung ist Node.js 20 oder neuer.

```powershell
npm ci
npm run dev
```

Danach läuft das Spiel unter `http://127.0.0.1:4173`. Der Server bindet absichtlich nur an localhost.

## Steuerung

- Tippen oder Leertaste/W/Pfeil hoch: springen
- A/D oder Pfeile links/rechts: bewegen
- S, Pfeil runter oder sichtbarer ↓-Button: ducken
- Hütte: Pause; Sound, Thema, Themenautomatik, HUD und Hilfe besitzen eigene Buttons

Die Hilfe erscheint beim ersten Start und kann über `?` erneut geöffnet werden.

## Entwicklung und Qualität

```powershell
npm run check   # ESLint, 21 Node-Tests und Headless-Chrome-Smoke-Test
npm run build   # erzeugt ein geprüftes statisches Artefakt in dist/
```

Nützliche Query-Parameter:

- `?debug=1` aktiviert die Entwicklungssteuerung.
- `?theme=city` setzt ein Startthema.
- `?help=1` öffnet die Hilfe; `?help=0` unterdrückt nur das automatische Öffnen.

Die Laufzeit besteht aus nativen ES-Modulen. `src/main.js` komponiert Core-, Game-, World-, Object- und Entity-Module. Präferenzen und Bestwert verbleiben ausschließlich im lokalen Browserspeicher.

## Release

`npm run build` kopiert ausschließlich `index.html`, `favicon.svg`, `CNAME` und `src/` nach `dist/`. Tests, Auditbilder und Entwicklerdateien gelangen nicht in das Deployment. Das Build bricht oberhalb von 750 KiB ab und schreibt `dist/release-manifest.json`.

Vor einer Veröffentlichung die [Release-Checkliste](docs/RELEASE.md) und das [Asset-Inventar](docs/ASSETS.md) prüfen. Der ausführliche technische Stand steht in [AUDIT.md](AUDIT.md).

Unterstützt werden aktuelle Versionen von Chrome/Edge, Firefox und Safari. Physische Touchgeräte und Screenreader bleiben Teil der manuellen Releaseprüfung.
