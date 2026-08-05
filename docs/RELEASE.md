# Release-Checkliste

## Automatisch

- [x] `npm ci` läuft mit der vorgesehenen Node-LTS-Version.
- [x] `npm run check` endet mit 0 Fehlern, 0 Warnungen und vollständig grünen Tests.
- [x] `npm run build` hält das 750-KiB-Budget ein.
- [x] CI ist für den Zielcommit grün.

## Manuell

- [ ] Desktop und Hochkantansicht starten ohne Konsolenfehler.
- [ ] Erststart-Hilfe, Pause, Links/Rechts, Ducken, Sound, Thema, Auto-Thema, Reisealbum und Kompaktansicht funktionieren per Pointer und Tastatur.
- [ ] Alle drei Laufaufträge wechseln korrekt; Goldpfad und sicherer Weg sind auswählbar, ein Goldpfad kann abgeschlossen und auch folgenlos verpasst werden.
- [ ] Reisealbum behält Welten, Etappen, Aufträge, Goldpfade, Reisemanöver und Bestwerte nach Reload sowie neuem Lauf.
- [ ] Meer- und Raketenreise erlauben jeweils höchstens drei sichtbare Reisemanöver.
- [ ] Resize/Rotation erhält Score, Leben, Weltobjekte und Position plausibel.
- [ ] Game over zeigt Score/Bestwert und wartet auf „Erneut spielen“.
- [ ] Sound startet erst nach einer Nutzergeste und respektiert die gespeicherte Auswahl.
- [ ] Mindestens ein kompletter Progressionszyklus inklusive Ocean- und Rocket-Setpiece wurde gespielt.
- [ ] Tastaturfokus, Browserzoom und ein Screenreader-Smoke-Test wurden geprüft.
- [ ] `docs/ASSETS.md` enthält belegte Rechte für alle ausgelieferten Assets.

## Veröffentlichung

- [ ] Ausschließlich der Inhalt von `dist/` wird deployt.
- [ ] Domain/HTTPS und `CNAME` zeigen auf das gewünschte Ziel.
- [ ] Nach dem Deployment werden Start, Asset-Requests und Speicher-Fallback in einem privaten Fenster geprüft.
