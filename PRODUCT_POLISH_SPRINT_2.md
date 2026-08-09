# Product Polish Sprint 2

Stand: 2026-08-09

## Ergebnis

Purrkour liest sich jetzt stärker als zusammenhängende Reise: Die Welten besitzen eigene Licht-, Silhouetten-, Landmarken- und Atmosphärenmotive, Ocean- und Rocket-Setpieces haben klar getrennte Render- und Audiobögen, und die UI tritt während Kapitelkarten und Reisen sichtbar zurück. Der Game-Feel-Pass aus Sprint 1 bleibt erhalten.

## Visuelle Baseline

- Der Ausgangszustand ist in `docs/audit/sprint2-baseline.png` festgehalten.
- Große Himmelsflächen wirkten oft leer; Wald, Dschungel, Berge und Klippen unterschieden sich primär über Palette und Objekte.
- Setpiece-Zielthemen erschienen vor dem eigentlichen Reveal. Ocean-Masken, Fahrzeuge und Phasenpositionen sprangen oder wurden weggeclippt; Rocket-Travel enthielt Ocean-Layer und Ocean-Ambience.
- Das HUD konkurrierte besonders mobil mit Fahrzeugen und Kapitelkarten. Mobile Landscape verlor auf vielen Touchgeräten die Bewegungssteuerung vollständig.
- Der erste Start war generisch und doppelt gestaffelt. Game Over nannte keine Ursache; ein sichtbarer Reiseabschluss fehlte.

## Änderungen

### Scene Direction und Weltidentität

- Eigene Landmarken ergänzen Waldhütte, Dschungelbaum, Schneegipfel, Klippenstapel, City-Turm, Wüstenmesa, Insel-Leuchtturm und Ocean-Segelboot.
- Weltbezogene Lichtmotive ergänzen Waldglühen, Dschungel-Lichtschächte, Inselsonne, Bergwolken, City-Horizont, Wüstensonne und Mars-Orbitkörper.
- Vordergrund-Layer geben Wald und Dschungel Randlaub, City eine Oberleitung, Wüste und Mars Wind sowie Bergen und Klippen ziehende Wolken.
- Dschungel-Mittelgrund verwendet eine breite Laubkrone statt der Wald-Nadelbäume. Schmale Viewports schließen alle Ridge-Pfade exakt am Bildrand ab.
- Mars-Palettenmetadaten und steuerbare Nachtintensität sind wieder mit Renderer, Terrain und Fahrzeugdetails verbunden.

### Setpiece Direction

- Ocean und Rocket besitzen getrennte Rendergraphen. Ocean-Wasser wird genau einmal gezeichnet; Rocket bleibt bis zur Ankunft im Space-Pfad.
- Approach, Boarding, Travel und Arrival übernehmen Position und Reveal-Maske kontinuierlich. Phasenwechsel teleportieren Fahrzeug und Küste nicht mehr.
- Fahrzeuganker berücksichtigen HUD-Safe-Area und Viewport. Das Raft liegt auf der Wasserlinie; der Mars-Marker bleibt mobil im Bild.
- Reale Dauern treiben Reisebalken und Hardcap: Ocean 930 Frames, Rocket 840 Frames. Abschlusslogik ist mode-spezifisch.
- Reisemanöver besitzen lesbare Aktion, Feedback und Flow-Payoff. Launch, Flug und Ankunft verwenden vorhandene, phasenbezogene Audio-Cues.
- Input ist während Approach, Boarding und Arrival bewusst gesperrt; Travel verwendet dieselbe Eingabe für Manöver. Pausieren bleibt in jeder Phase möglich.

### Präsentation und HUD

- Das Run-HUD priorisiert Etappe, Score, Flow und Leben. Theme, Auto, Kompaktmodus und Hilfe liegen in einem Einstellungsmenü.
- Fokusmodus blendet Aufträge, Bedienelemente, Touch-Dock und Bedienhinweis während Kapitelkarten und Setpieces aus. Aktive Goldpfade bleiben auch im Kompaktmodus sichtbar.
- Coarse-Pointer-Geräte erhalten Links, Rechts und Ducken auch in Landscape und auf Tablets. Kurze Viewports bewahren aktive Risiken, reduzieren aber Sekundärinformation.
- Der Erststart zeigt Purrkour als Marke, eine klare Reiseabsicht und nur Springen, Bewegen und Ducken. Die Startgeste entsperrt Audio und beendet die erste Kapitelkarte in einem Schritt.
- Game Over nennt die Trefferursache und ordnet Score, Bestwert und besten Flow. Die Heimkehr erhält mit „Reise vollendet / Wieder daheim“ einen eigenen Abschlussbeat.
- Kapitelwechsel werden über ein gecachtes `aria-live`-Element angekündigt. Canvas, Touch-Gruppe und Mäuseanzeige besitzen stabile zugängliche Namen.

### Übergangssprache

- Kurze Theme-Crossfades, eine dezente Szenenblende sowie Setpiece-Balken und Vignette bilden die gemeinsame Sprache.
- Abfahrt hält die Ausgangswelt; Travel enthüllt Ocean beziehungsweise Space; Arrival setzt die Zielwelt. So entstehen Vorbereitung, Reveal und Release in derselben Reihenfolge.
- Die bestehende Kameraarchitektur bleibt erhalten. Kontextabhängige Fahrzeuganker und Masken verbessern Framing ohne Kontrollverlust.

## Welt-für-Welt-Playthrough

| Abschnitt | Wichtigste visuelle Verbesserung | Stärkster Setpiece-/Szenenmoment | Verbleibender schwächster Moment |
| --- | --- | --- | --- |
| Wald | Warmes Licht, Hütte und Randlaub machen den Start als Heimat lesbar. | Heimkehr vor der Hütte schließt die Reise sichtbar. | Die wiederholte ferne Baumreihe bleibt bewusst einfach. |
| Ocean | Getrennter Horizont, Inseln, Vögel, Wellen und Segelboot schaffen Weite. | Kontinuierlicher Küsten-Reveal mit sichtbarem Fahrzeug und Manöver-Peak. | Fahrzeugillustrationen bleiben funktional und geometrisch schlicht. |
| Insel | Sonne, Palmen, Küstenband und Leuchtturm ergeben einen hellen Ruheort. | Die Ankunft löst die Ocean-Spannung klar auf. | Der Nahboden besitzt noch wenig lokale Objektvariation. |
| Mars | Palette, Orbitkörper, Staub, Düne und Landepad sind technisch und visuell verbunden. | Rocket-Arrival mit wachsendem Zielkörper und sichtbarem Marker. | Das Landepad bleibt ein fester, wiederkehrender Ankunftsanker. |
| Berge / Nacht | Schneegipfel, Wolke, Sternhimmel und steuerbare Nacht bilden einen zweiten Akt. | Der Übergang in die Nachtpassage ist der stärkste Lichtwechsel. | Der Mittelgrund bleibt außerhalb des Gipfels relativ ruhig. |
| Dschungel | Lichtschächte, Laubkrone, Riesenbaum, Lianen und Randlaub lösen ihn vom Wald. | Der Riesenbaum setzt einen klaren vertikalen Fokus. | Ambient-Leben bleibt auf wenige einfache Motive begrenzt. |
| Klippen | Drei gestaffelte Felsstapel, Wind und Wolken betonen Höhe und Richtung. | Die gestaffelten Silhouetten tragen den schnellsten Landabschnitt. | Der begehbare Boden bleibt geometrisch weich statt kantig. |
| City | Skyline, beleuchteter Turm und Oberleitung schaffen klare urbane Tiefe. | Mobile Landscape zeigt Bewegung und Hindernisse ohne HUD-Verdeckung. | Terrain liest sich noch eher als Welle denn als echte Dächerkante. |
| Wüste | Sonne, Mesa, Dünenstaffelung und Windlinien geben einen starken Schlussakt. | Mesa und Sonne erzeugen die markanteste Landsilhouette. | Im Vordergrund fehlt noch größere Objektvielfalt. |

## Dramaturgischer Bogen

- Wald beginnt ruhig und lesbar; Ocean ist der erste große Aufbruch, Insel die bewusste Entlastung.
- Rocket und Mars bilden den visuellen Peak der ersten Hälfte. Bergnacht senkt Farbe und Tempo als Fokuspassage.
- Dschungel, Klippen, City und Wüste steigern Silhouette, Vertikalität und Trockenheit bis zum Rückweg.
- Die zweite Ocean-Reise führt nicht kommentarlos zum Anfang, sondern in einen kurzen Heimkehr-Payoff.

## Technische Leitplanken

- Alle Animationen verwenden den vorhandenen Tick und Canvas; es wurden keine neuen Laufzeit-Timer eingeführt.
- Palettenmetadaten werden einmal pro Theme normalisiert statt pro Frame allokiert.
- Setpiece-Dauern, Phasen und Previews bleiben deterministisch. Partikelsysteme bleiben begrenzt.
- Reduced Motion friert Sterne und Ambientdrift ein, reduziert Fahrzeug-Bob, Flamme, Wellen, Wind, Shake und Übergangsbewegung.
- Reset bewahrt die explizite Theme-Präferenz, setzt aber Run-, Pause-, Setpiece- und Feedbackzustand kanonisch zurück.

## QA

- Vollständiger visueller Audit vor und nach den Änderungen: Desktop `1440x900`, Mobile Portrait `500x844`, Mobile Landscape `844x390` sowie Reduced-Motion-Pfade.
- Geprüfte Welten und Zustände: Wald, Ocean, Insel, Mars, Berge/Nacht, Dschungel, Klippen, City, Wüste, Ocean-Travel, Rocket-Travel, Start, Pause, Game Over und Reiseabschluss.
- `npm run lint`: erfolgreich, keine Warnungen.
- `npm test`: erfolgreich, alle bisherigen 40 plus 3 neue Sprint-2-Tests, insgesamt 43/43.
- `npm run test:browser`: erfolgreich; echter Modulstart, Canvas, Onboarding und dynamisches HUD geprüft.
- `npm run build`: erfolgreich; 54 Runtime-Dateien, 303.477 Bytes bei 768.000-Byte-Budget.
- `git diff --check`: erfolgreich.
- Regressionen für Setpiece-Phasen, Theme-Zeitpunkt, Reset-Präferenzen, Touch-Landscape, Pause, Reduced Motion, Game-Over-Ursache und deterministische Previews sind automatisiert abgedeckt.

## Restpunkte

- Physische Touchgeräte, reale Audioausgabe und Screenreader bleiben manuelle Release-Prüfungen.
- Der kurze Checkpoint-Breath ist weiterhin primär ein Präsentations- und Safe-Window-Beat; eine eigene Campsite-Szene wäre der nächste gezielte Pacing-Schritt.
- Prozedurale Landmarken wiederholen sich bei langen Läufen. City-Dächer und einige Nahböden könnten in einem späteren Content-Pass stärker spezialisiert werden.

## Bewusst nicht umgesetzt

- Keine neuen Modi, Level, Meta-Systeme oder große Asset-Produktion.
- Keine neue Kamera- oder Terrainarchitektur.
- Kein weiterer Mikro-Pass auf Speed Lines, Squash, Staub oder Trefferfarben.
- Keine dauerhafte Effektkulisse; ruhige Himmels- und Release-Flächen bleiben Teil der Dramaturgie.
