# Product Polish Sprint

Stand: 2026-08-08

## Baseline

- Die technische Basis, Weltreise, Flow-Kette, Goldpfade und Setpieces waren bereits vollständig und gut getestet.
- Laufgeschwindigkeit war im Rendering schwächer wahrnehmbar als in der Simulation. Besonders große, ruhige Himmelsflächen vermittelten wenig Tempo.
- Sprung, Landung und Treffer waren funktional, besaßen aber zu wenig voneinander unterscheidbares Bewegungsfeedback.
- Die Hüttenszene war als Pause charmant, der Pausenzustand und der schnelle Wiedereinstieg aber nicht deutlich genug.
- Das HUD ist informationsreich. Neue permanente Anzeigen hätten die visuelle Konkurrenz weiter erhöht.

## Änderungen

- Geschwindigkeitsabhängige, deterministische Bewegungsstreifen ergänzen die vorhandene Parallaxe erst oberhalb des normalen Einstiegstempos.
- Sprung und Landung besitzen unterschiedliche Squash-/Stretch-Impulse. Härtere Landungen erzeugen einen kurzen Kameradip und begrenzte Staubpartikel.
- Treffer erhalten eine kurze, abklingende Farb- und Kamerareaktion. Die bestehende Unverwundbarkeitsanzeige bleibt erhalten.
- Eine kompakte Pausenanzeige benennt Zustand und Fortsetzen-Aktion. Leertaste/Tippen und Hüttentaste verwenden denselben Resume-Pfad.
- Reduced Motion deaktiviert Speed Lines und Kamerabewegung und verkürzt die übrigen Impulse.
- Alle Effekte verwenden den vorhandenen Tick, Canvas und das begrenzte Partikelsystem; es entstehen keine neuen Timer oder Frame-DOM-Allokationen.

## Warum

- Speed Lines schließen die Lücke zwischen berechneter und wahrgenommener Geschwindigkeit, ohne die Katze oder Hindernisse zu verdecken.
- Getrennte Absprung-, Landungs- und Trefferreaktionen verbessern Ursache und Konsequenz im Moment der Eingabe.
- Der Pausenstatus macht die Hüttenszene als echten Spielzustand lesbar und verkürzt Resume auf eine vertraute Eingabe.
- Die Effekte skalieren mit Intensität. Standardbewegung bleibt ruhig; schnellere oder fehlerhafte Momente erhalten mehr Gewicht.

## Vorher/Nachher

- Vorher: Geschwindigkeit war vor allem an Boden und HUD ablesbar. Nachher: Ab höherem Tempo liefert auch der Mittelgrund klare Bewegungsrichtung.
- Vorher: Landungen unterschieden sich visuell kaum vom normalen Lauf. Nachher: Fallgeschwindigkeit bestimmt Impuls und Staubmenge.
- Vorher: Treffer wurden primär durch Blinken, Ton und Lebensverlust vermittelt. Nachher: Ein kurzer roter Impuls lokalisiert den Fehler sofort.
- Vorher: Resume war nur über das Hüttensymbol ersichtlich. Nachher: Die zentrale Statusanzeige nennt die direkte Fortsetzen-Aktion.

## QA

- `npm run lint`: erfolgreich, keine Warnungen.
- `npm test`: erfolgreich, 40 Tests.
- `npm run test:browser`: erfolgreich; echter Modulstart, Canvas und dynamisches HUD geprüft.
- `npm run build`: erfolgreich; 54 Runtime-Dateien, 280.054 Bytes bei 750-KiB-Budget.
- `git diff --check`: erfolgreich.
- Geprüfte Zustände: Initialzustand, Sprung/Landung, Trefferzustand, Pause/Resume, Reduced-Motion-Codepfade und kanonischer Reset.

## Restpunkte

- Physische Touchgeräte, reale Audioausgabe und Screenreader bleiben manuelle Release-Prüfungen.
- Ein kompletter Goldpfad- und End-to-End-Langlauf wurde in diesem Sprint über die vorhandenen deterministischen Tests abgesichert; ein menschlicher Langzeit-Playthrough auf echter Hardware bleibt sinnvoll.

## Bewusst nicht umgesetzt

- Keine neuen Spielmodi, Level, Sammelsysteme oder Meta-Progression.
- Kein allgemeines Screen Shake und keine dauerhaften Partikelwolken.
- Keine neue Kameraarchitektur; die bestehende vertikale Führung bleibt unverändert.
- Kein Audio-Rewrite, da Unlock, Mischung, Pause und Persistenz bereits getrennt getestet sind.
