# Product Polish Sprint 3

Stand: 2026-08-09

## Ergebnis

Purrkour besitzt jetzt einen laengeren, klar phasierten Reisebogen statt einer Folge kurzer Vignetten. Die spaeten Welten dauern in einem typischen sauberen Lauf mindestens 25 bis 35 Sekunden, verwenden unterschiedliche Kompositionsrezepte und werden von zwei echten fuenfsekündigen Ruhepunkten gegliedert. Ocean-, Balloon-, Raft-, Zeppelin- und Rocket-Sequenzen zeigen Herkunft, Distanz und Ziel kontinuierlich; die Katze bleibt waehrend Boarding, Travel und Exit eindeutig sichtbar.

Der typische Vollrun steigt in der deterministischen Simulation von etwa `4:12` auf `6:32`, der Expert-Run von `3:17` auf `6:16`. Die Skill-Spannweite bleibt sichtbar, wird aber nicht mehr durch extrem kurze spaete Kapitel bestimmt.

## Baseline

24 deterministische Seeds pro Profil wurden bei 60 Hz mit echter Progression, Spawner, Flow, Missionen, Goldpfaden und Setpieces simuliert. Ereignisse umfassen Pass, Collect, Flow-Aktion, Travel-Manoever sowie Missions- und Routenbonus.

| Abschnitt | Baseline typisch | Ausgangsbefund | Sprint-3-Klasse |
| --- | ---: | --- | --- |
| Wald | 39,5 s | Genug Zeit und bereits mehrere lesbare Rhythmen. | C |
| Checkpoint-Breath | 3,0 s | Zu kurz und ohne sichtbaren Ruheort. | A |
| Ocean | 16,0 s | Dauer brauchbar, aber Phasen und Masken technisch unstet. | C |
| Insel | 31,5 s | Fast lang genug, spielerisch noch stark waldnah. | B |
| Rocket | 14,5 s | Zu kurzer Raumwechsel, Herkunft verlor sich abrupt. | B |
| Mars | 27,0 s | Eigenes Bewegungsgefuehl, aber wenig phasierte Kombination. | B |
| Berge | 20,3 s | Vertikales Motiv endete vor einem klaren Peak. | A |
| Nacht | 13,0 s | Zu kurz und spawnseitig identisch zu Bergen. | A |
| Dschungel | 14,1 s | Zu kurz fuer Reaktions- und Monkey-Kombinationen. | A |
| Klippen | 15,0 s | Zu kurz fuer Kanten- und Hoehenfolgen. | A |
| City | 12,8 s | Kuerzester Weltbeat; Ducking war unerreichbar. | A |
| Wueste | 14,7 s | Schweres Sprunggefuehl ohne eigenen Spannungsbogen. | A |
| Rueckreisen | 14,5-16,0 s | Technisch Wiederholung ohne genug eigene Zielrichtung. | D |

Gesamtlauf-Baseline: passiv `6:34`, typisch `4:12`, Expert `3:17`.

## Gameplay Variety

Das vorhandene Inventar wurde vor neuen Features ausgeschöpft: Springen und Mehrfachsprung, Ducken, horizontale Korrektur, weltbezogene Gravitation und Kontrolle, Fence-Stairs, Bird-Stomp/Drop, Dog-Chase, Yarn-Slow, Monkey, Scorpion, dekorative Goat-Slots, Cars als Plattformen, Goldpfade, Flow-Ketten, Missionen, Collectibles, Terrainhoehen und Travel-Manoever.

Regulaere Beats verwenden nun Zeit- **und** Score-Gates. Ein schneller Score-Sprung kann eine Welt vor ihrer Mindestzeit nicht mehr beenden; ein Max-Timer verhindert umgekehrt Endlosschleifen. Innerhalb der Mindestzeit durchlaufen Spawns die Abschnitte `Establish`, `Flow`, `Variation`, `Challenge`, `Release` und `Exit` mit veraenderten Abstaenden, Stair-Chancen, Close-Combos und Gewichten.

| Welt | Spielerisches Motiv | Praegende Kombination |
| --- | --- | --- |
| Wald | Rhythmuspfad | Fence-Stairs, Crow-Stomp, Dog/Yarn und klare Einfuehrung. |
| Insel | Weite Strandboegen | Groessere Abstaende, Gull-Linien, weniger Nahdruck. |
| Mars | Niedriggravitaetslinien | Lange Spruenge, mehr Vertikalitaet, Drone-Birds, kein Dog. |
| Berge | Vertikale Gipfelfolge | Hohe Stairs, Eagles und eingeschraenkte Luftkorrektur. |
| Nacht | Sichtlinien | Groessere Luecken, weniger Stairs/Nahdruck, mehr Birds. |
| Dschungel | Dichte Wechselreaktionen | Monkey, Parrot, schnelle bekannte Hinderniswechsel. |
| Klippen | Kanten und Hoehenwechsel | Hohe Plattformfolgen, Eagles und engere Challenge-Phase. |
| City | Duck-Rhythmus | Cars als Plattformen, erreichbare Tunnel und schnelle Linien. |
| Wueste | Weite Spruenge im schweren Sand | Hoehere Gravitation, Yarn/Scorpion und breite Gap-Folgen. |

Goldpfade starten nur noch in `Variation` oder `Challenge` und wurden von bis zu 53 auf 15 bis 18 Plattformen begrenzt. Sie funktionieren dadurch als Signature Moment innerhalb einer Welt statt mehrere Weltgrenzen zu ueberdecken. Flow laeuft auch waehrend Setpieces weiter ab und wird nicht mehr mit eingefrorenem x4-Multiplikator in die Zielwelt getragen.

## Neue Mikrovariation

- Der bereits implementierte, aber unerreichbare Tunnel ist jetzt eine niedrig dosierte City-Signatur. Ducken passiert ihn mit Flow-Payoff; ein verpasstes Duck-Fenster verursacht den bestehenden Trefferpfad.
- Monkey- und Scorpion-Updates laufen einmal pro Tick. Vorhandenes Bobbing und Scorpion-Crawl sind damit erstmals aktiv, ohne neue Entity-Systeme einzufuehren.
- Night verwendet ein eigenes Sichtlinienrezept, obwohl Night und Mountain dasselbe Theme teilen.
- Die Goat bleibt bewusst dekorativ. Fuer Sprint 3 wurde daraus kein zusaetzlicher Hazard-Typ gebaut.

## Travel Fixes

### Balloon

- Der Balloon faehrt frueh lesbar von rechts ein; die Katze bleibt bis zum Boarding neben dem Korb.
- Die Ownership wechselt erst bei 64 Prozent Boarding von der Weltkatze zum sichtbaren Passenger im Korb.
- Departure behaelt die Ausgangskueste, Travel verliert sie graduell und zeigt die Zielkueste vor Arrival.
- Korb, Passenger und vordere Korblippe besitzen eine stabile Z-Order; Reduced Motion entfernt nur Bob/Drift.

### Raft und Zeppelin

- Beide verwenden dieselbe vollstaendige Phasenlogik, aber typgerechte Boden-, Wasser- und Passenger-Anker.
- Das Raft liegt auf der Wasserlinie statt wie ein Luftfahrzeug zu schweben.
- Zeppelin-Gondel und Raft-Deck zeichnen die vereinfachte Katze hinter ihrer Frontkante.
- Viewportabhaengige Travel-Anker halten breite Fahrzeuge aus HUD und Bildrand.

### Ocean

- Land-Parallax, Terrain und Ocean sind getrennte Schwesterpasses; Wasser wird nicht mehr in einem bereits aktiven Landclip gezeichnet.
- Boarding beginnt den Wasser-Reveal erst mit der Passenger-Uebergabe. Arrival setzt die am Travel-Ende sichtbare linke Zielkueste fort.
- Land und Wasser verwenden dieselbe wellige Clip-Grenze mit dezenter Mist-/Foam-Kante statt eines harten technischen Rechtecks.
- Der Canvas wird in jeder Travel-Phase vollstaendig gefuellt; graue oder transparente Zwischenframes sind ausgeschlossen.

### Rocket

- Approach und Boarding behalten die Insel-/Kuestenwelt. `oceanMaskX` wird explizit neutralisiert, sodass weder Vollmeer noch eine weggeclippte Aussenkatze auftreten.
- Early Ascent zeigt Meer und Kueste unter der Rakete; der Horizont sinkt langsamer, waehrend Landschaft und Wasser an Massstab verlieren.
- Space entsteht graduell aus Atmosphaere und Sternen. Der Zielkoerper beginnt in Travel exakt mit derselben Geometrie wie in Arrival.
- Der Passenger ist im Capsule-Fenster sichtbar. Beim Exit bleibt er aktiv, bis der Collider die Weltkatze an der Tuer positioniert hat; es gibt keinen Ein-Frame-Teleport.
- Rocket-Ambience verwendet Engine/Rumble/Whoosh ohne Ocean-Layer.

### Gemeinsame Staging-Regeln

- Ocean dauert `1000` Frames, Rocket `980` Frames. Die vier Phasen und Hardcaps lesen dieselben exportierten Timingwerte.
- Vier Manoeverfenster liegen bei 18, 42, 66 und 84 Prozent statt alle Inputs am Anfang zu verbrauchen.
- Travel-Cues verwenden eigene Textmetriken und die freie Ecke gegenueber dem Fahrzeug.
- Approach, Board, Travel und Arrival uebernehmen Position, Skalierung und Maskenwert kontinuierlich.
- Paletten werden in einem wiederverwendeten Scratch-Objekt normalisiert; Theme-eigene Farbarrays werden nicht pro Frame mutiert.

## Scene Duration

Finale Live-Simulation, Median des typischen Profils:

| Abschnitt | Vorher | Nachher | Ereignisse nachher |
| --- | ---: | ---: | ---: |
| Wald | 39,5 s | 39,5 s | 43 |
| Waldlichtung | 3,0 s | 5,0 s | 0 |
| Ocean | 16,0 s | 17,15 s | 2 |
| Insel | 31,5 s | 37,75 s | 47 |
| Rocket | 14,5 s | 16,82 s | 2 |
| Mars | 27,0 s | 35,0 s | 64 |
| Rocket Return | 14,5 s | 16,82 s | 2 |
| Berge | 20,3 s | 30,0 s | 77 |
| Nacht | 13,0 s | 25,0 s | 54 |
| Aussichtspunkt | - | 5,0 s | 0 |
| Dschungel | 14,1 s | 35,45 s | 87 |
| Klippen | 15,0 s | 35,45 s | 99 |
| City | 12,8 s | 35,45 s | 100 |
| Wueste | 14,7 s | 35,45 s | 88 |
| Heimreise | 16,0 s | 17,15 s | 2 |

Finale Gesamtdauer, Median `[P10-P90]`:

- Passiv: `7:44` [`7:29-7:57`], Endscore 2.244.
- Typisch: `6:32` [`6:21-6:41`], Endscore 4.415.
- Expert: `6:16` [`6:15-6:23`], Endscore 7.320.

Die `35,45 s` enthalten 35 aktive Sekunden plus den 28-Frame-Chapter-Lock. Die Verlaengerung entsteht aus phasenbezogenen Rezepten und Mindestzeit, nicht aus duplizierten Segmenten.

## Breath Sections

- `Waldlichtung` und der neue `Aussichtspunkt` sind exakt fuenf Sekunden lange, scoreunabhaengige Ruhebeats.
- Beim Eintritt werden vorhandene Hazards entfernt, neue Spawns unterdrueckt und ein sichtbares Camp-/Aussichtsmotiv gezeichnet.
- Pause zaehlt nicht zur aktiven Beatzeit.
- Ein kuenftig wieder aktivierter Blanket-Checkpoint kehrt nach dem Breath zur gemerkten Etappe zurueck.

## Reproduzierbare Frame-Audits

Der URL-Vertrag adressiert den echten Setpiece-Manager und friert erst nach dem gewuenschten Produktionszustand ein:

```text
?preview=setpiece&mode=ocean&vehicle=raft&checkpoint=travel-50&seed=1337&touch=1&reduced=1&help=0
```

Checkpoints: `start`, `boarding`, `travel-25`, `travel-50`, `travel-75`, `arrival`, `control-return`.

`npm run audit:travel` erzeugt `4 Fahrzeuge x 7 Checkpoints x 3 Viewports x 2 Motion-Modi = 168` PNGs. Geprueft werden `1440x900`, `390x844` und `844x390`, jeweils normal und Reduced Motion. Jeder Frame benoetigt Ready-Marker, vollstaendig deckende Canvas-Samples, Farbvarianz und eine valide PNG-Groesse.

Post-Fix-Evidenz und Kontaktuebersicht:

`../audit-artifacts/purrkour-sprint3/travel-frames/index.html`

## QA

- `npm run check`: erfolgreich; Lint, 54 Unit-/Contract-Tests und Chrome-Smoke.
- `npm run test:browser`: Balloon-Travel, sichtbarer Passenger, bemalter Canvas und Rocket-Control-Return werden in echtem Chrome geprueft.
- `npm run audit:travel`: 168/168 Frames erfolgreich.
- `npm run build`: 56 Runtime-Dateien, 333.097 Bytes bei 768.000-Byte-Budget.
- `git diff --check`: erfolgreich.
- Zusaetzliche Regressionen decken Mindest-/Maximalzeit, Pause, Breath-Resume, Weltmotive, Night-Abweichung, City-Tunnel, Setpiece-Timings, Masken-/Positionskontinuitaet, Passenger-Handoff, Palette-Mutation, Mobile-Framing und Reduced Motion ab.

## Restpunkte

- Reale Touchhardware, Audioausgabe und Screenreader bleiben manuelle Release-Pruefungen.
- City verwendet weiterhin weiches Runner-Terrain unter den Cars statt einer eigenen kantigen Dachgeometrie.
- Goat bleibt in Mountain/Cliff ein dekorativer Slot; die spielerische Identitaet dieser Welten kommt aus Vertikalitaet, Birds und Plattformkomposition.
- Die beiden Rueckreisen verwenden bewusst dieselben Fahrzeugfamilien. Herkunft und Ziel wechseln korrekt, eine eigene zweite Fahrzeugillustration wurde nicht als neues System eingefuehrt.

## Bewusst nicht umgesetzt

- Keine neuen Welten, Meta-Systeme oder grossen Mechanikfamilien.
- Keine neue Terrain-, Kamera- oder Physikarchitektur.
- Keine kuenstliche Verlaengerung durch kopierte Segmente oder Leerlaufmeter.
- Keine rein kosmetische weitere Game-Feel-Runde; Sprint 1 und Sprint 2 bleiben die Baseline.
