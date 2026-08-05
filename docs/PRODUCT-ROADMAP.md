# Produktrichtung: Purrkour

Stand: 2026-08-05

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
| P1 | Routenentscheidungen | der sichere Bodenweg bleibt offen; sichtbare Höhenrouten belohnen fünf Goldmäuse separat | umgesetzt |
| P1 | Reisealbum | Bestwerte, besuchte Welten, Etappen, Setpieces, Aufträge und Goldpfade bilden eine lokale Meta-Progression | umgesetzt |
| P1 | Reiseinszenierung | Kapitelkarten, Abfahrt/Landung und Goldrouten-Hinweise geben großen und kleinen Wechseln einen klaren visuellen Rhythmus | umgesetzt |
| P2 | Klangmotive pro Beat | kurze musikalische Signale markieren Flow-Tiers und neue Reiseabschnitte | benötigt Audioabnahme |
| P2 | Teilen/Wiederholen | kompakte Run-Zusammenfassung mit Seed und Best-Flow | Backlog |

## Erfolgskriterien dieser Iteration

- Auftrag, Fortschritt und Bonus sind ohne Hilfe verständlich und wechseln deterministisch.
- Der Goldpfad ist als freiwillige, riskantere Route lesbar und blockiert den Bodenweg nicht.
- Das Reisealbum überlebt Neustarts und bleibt bei beschädigtem oder gesperrtem Storage sicher.
- HUD und alle Aktionen bleiben bei exakt 390 × 844 vollständig sichtbar.
- Automatische Tests, Browser-Smoke und Release-Budget bleiben grün.
