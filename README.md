# Purrkour

Purrkour ist ein browserbasierter Reise-Runner mit prozedural gezeichneter Canvas-Welt, wechselnden Themen, Sammelobjekten und Setpieces. Saubere Aktionen bauen einen Flow-Multiplikator auf; rotierende Laufaufträge und freiwillige Goldpfade setzen kurzfristige Ziele. Das lokale Reisealbum hält Entdeckungen und Bestwerte über mehrere Läufe fest.

## Lokal starten

Voraussetzung ist Node.js 20 oder neuer.

```powershell
npm ci
npm run dev
```

Danach läuft das Spiel unter `http://127.0.0.1:4173`. Der Server bindet absichtlich nur an localhost.

## Steuerung

- Tippen oder Leertaste/W/Pfeil hoch: springen
- A/D, Pfeile links/rechts oder die sichtbaren ◀/▶-Touchflächen: bewegen
- S, Pfeil runter oder sichtbarer ↓-Button: ducken
- Während Meer- und Raketenreisen: Sprung oder „Reisemanöver“ löst bis zu drei Bonusmanöver aus
- Bei einem goldenen Abzweig: oben auf den Goldpfad springen oder unten ohne Unterbrechung normal weiterlaufen
- Hütte: Pause; Sound, Thema, Themenautomatik, Reisealbum, HUD und Hilfe besitzen eigene Buttons

Die Hilfe erscheint beim ersten Start und kann über `?` erneut geöffnet werden.

## Entwicklung und Qualität

```powershell
npm run check   # ESLint, Node-Tests und Headless-Chrome-Smoke-Test
npm run build   # erzeugt ein geprüftes statisches Artefakt in dist/
```

Nützliche Query-Parameter:

- `?debug=1` aktiviert die Entwicklungssteuerung.
- `?theme=city` setzt ein Startthema.
- `?help=1` öffnet die Hilfe; `?help=0` unterdrückt nur das automatische Öffnen.
- `?album=1` öffnet das Reisealbum direkt, etwa für visuelle Prüfungen.
- `?preview=route&help=0` zeigt den nächsten Goldpfad sofort als spielbaren Abzweig.

Die Laufzeit besteht aus nativen ES-Modulen. `src/main.js` komponiert Core-, Game-, World-, Object- und Entity-Module. Weltregeln, Präsentationshinweise und Goldpfade besitzen eigene testbare Module. Präferenzen, Bestwert und Reisealbum verbleiben ausschließlich im lokalen Browserspeicher.

## Release

`npm run build` kopiert ausschließlich `index.html`, `favicon.svg`, `CNAME` und `src/` nach `dist/`. Tests, Auditbilder und Entwicklerdateien gelangen nicht in das Deployment. Das Build bricht oberhalb von 750 KiB ab und schreibt `dist/release-manifest.json`.

Vor einer Veröffentlichung die [Release-Checkliste](docs/RELEASE.md) und das [Asset-Inventar](docs/ASSETS.md) prüfen. Der ausführliche technische Stand steht in [AUDIT.md](AUDIT.md).

Unterstützt werden aktuelle Versionen von Chrome/Edge, Firefox und Safari. Physische Touchgeräte und Screenreader bleiben Teil der manuellen Releaseprüfung.
