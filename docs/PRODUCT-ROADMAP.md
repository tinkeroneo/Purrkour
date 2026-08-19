# Produktrichtung: Purrkour

Stand: 2026-08-11

## Zielbild

`Purrkour` soll ein atmosphärischer Reise-Runner sein: Die Katze zieht durch klar unterscheidbare Welten, erlebt kleine Setpieces und baut durch saubere Aktionen einen spürbaren Flow auf. Große Themenwechsel liefern die Reise; eine kurzfristige Risiko-und-Belohnungs-Schleife hält jeden Abschnitt interessant.

## Produktprinzipien

1. **Reise mit erkennbarem Ziel.** Der aktuelle Abschnitt und sein Fortschritt bleiben sichtbar.
2. **Können erzeugt Momentum.** Sammeln und sauberes Überwinden bauen einen Flow-Multiplikator auf; Treffer beenden ihn nachvollziehbar.
3. **Atmosphäre unterstützt Spielbarkeit.** Tiefe, Licht und Effekte dürfen Hindernisse nie verschleiern.
4. **Ein Blick, eine Entscheidung.** Das HUD zeigt die wichtigen Werte und gruppiert Einstellungen klar nachrangig.
5. **Überraschungen mit Rhythmus.** Setpieces, Themen und Ruhephasen sollen dramaturgisch statt beliebig wirken.

## Priorisierte Roadmap

| Priorität | Thema | Konkreter Nutzen | Status |
|---|---|---|---|
| P0 | Flow-System | sichere Aktionen bauen x2–x4 auf, Treffer oder Zeitablauf brechen die Serie | umgesetzt |
| P0 | Reiseanzeige | benannter Abschnitt und Fortschrittsbalken machen die Dramaturgie verständlich | umgesetzt |
| P0 | HUD-Hierarchie | Score, Flow und Reise stehen vor Einstellungen; Mobile benötigt weniger Höhe | umgesetzt |
| P0 | Aktionsfeedback | Funken, Flow-Puls und klare Tier-Meldungen machen Können sichtbar | umgesetzt |
| P1 | Laufaufträge | Mäusejagd, Flow-Ziel und Mutpfoten-Manöver rotieren deterministisch und vergeben eigene Boni | umgesetzt |
| P1 | Routenentscheidungen | eine explizite Wahl zwischen sicherem Weg und Goldpfad geht dem Höhenpfad voraus; fünf Goldmäuse bilden das separate Ziel | umgesetzt |
| P1 | Reisealbum | eine persistente Zehn-Welten-Karte zeigt Entdeckung und Bewegungscharakter sowie Bestwerte, Aufträge, Routen und Reisemanöver | umgesetzt |
| P1 | Reiseinszenierung | sichere Kapitelkarten blockieren nur kurz und sind quittierbar; Wiederholungen bleiben kompakt, Setpiece-Wechsel eigenständig | umgesetzt |
| P1 | Weltcharakter | jede Welt besitzt eigene, sicher begrenzte Werte für Schwerkraft, Sprung, Kontrolle und Pace | umgesetzt |
| P1 | Aktive Setpieces | bis zu drei klar sichtbare Reisemanöver machen Meer- und Raketenfahrt spielbar statt rein passiv | umgesetzt |
| P2 | Adaptive Klangidentität | warme weltabhängige Motive reagieren auf Nacht, Flow und Reisen; Noise bleibt nur als dezente Textur | erste Fassung umgesetzt; Hörabnahme offen |
| P2 | Teilen/Wiederholen | kompakte Run-Zusammenfassung mit Seed und Best-Flow | umgesetzt |

## Sprint 4: Feinschliff und Spielrhythmus

| Priorität | Thema | Abnahme | Status |
|---|---|---|---|
| P0 | Orientierungsstabilität | Hochformat → Querformat → Hochformat übernimmt jedes Mal die aktuelle Canvas- und HUD-Größe | umgesetzt |
| P0 | Klare Mobile-Steuerung | Mobile zeigt nur die notwendigen Sprung- und Duck-Aktionen; Long-Press öffnet weder Auswahl noch Kontextmenü | umgesetzt |
| P1 | Eigenständige Schlusswelten | Dschungel, Klippe, Stadt und Wüste erhalten unterscheidbare Rhythmuskurven, Hindernismischungen und Höhepunkte | umgesetzt |
| P1 | Responsive Reiseabnahme | Boarding, Travel, Arrival und Control Return bleiben von 360 px Mobile Portrait bis Mobile Landscape lesbar | umgesetzt |
| P2 | Klangabnahme | Start, Manöver, Landung, Flow-Ketten und Weltwechsel sind akustisch unterscheidbar und nicht ermüdend | Phasen-Cues umgesetzt; Hörabnahme offen |
| P2 | Visuelle Regression | die deterministische Reisematrix prüft Fahrzeuge, Katze, Cues und HUD an Phasengrenzen automatisch | umgesetzt |

## Erfolgskriterien dieser Iteration

- Auftrag, Fortschritt und Bonus sind ohne Hilfe verständlich und wechseln deterministisch.
- Der Goldpfad ist als freiwillige, riskantere Route lesbar und blockiert den Bodenweg nicht.
- Meer- und Raketenreisen bieten eine begrenzte, belohnte Aktion mit sichtbarem Zustand.
- Alle zehn Weltregeln liegen in sicheren Tuning-Grenzen und drei simulierte Gesamtreisen bleiben stabil.
- Das Reisealbum überlebt Neustarts und bleibt bei beschädigtem oder gesperrtem Storage sicher.
- HUD und alle Aktionen bleiben bei exakt 390 × 844 vollständig sichtbar.
- Automatische Tests, Browser-Smoke und Release-Budget bleiben grün.
