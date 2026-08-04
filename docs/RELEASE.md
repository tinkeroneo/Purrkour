# Release-Checkliste

## Automatisch

- [ ] `npm ci` läuft mit der vorgesehenen Node-LTS-Version.
- [ ] `npm run check` endet mit 0 Fehlern, 0 Warnungen und vollständig grünen Tests.
- [ ] `npm run build` hält das 750-KiB-Budget ein.
- [ ] CI ist für den Zielcommit grün.

## Manuell

- [ ] Desktop und Hochkantansicht starten ohne Konsolenfehler.
- [ ] Erststart-Hilfe, Pause, Ducken, Sound, Thema, Auto-Thema und Kompaktansicht funktionieren per Pointer und Tastatur.
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
