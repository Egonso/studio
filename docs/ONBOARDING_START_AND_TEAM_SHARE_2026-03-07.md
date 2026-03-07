# Onboarding: Erst selbst starten, Team-Freigabe sekundär

Stand: 2026-03-07  
Scope: `'/einrichten'`, Landing-Setup, `'/erfassen'` Owner-Fallback

## Ziel

1. Die letzte Onboarding-Stufe auf die erste sinnvolle Aktion ausrichten.
2. Einladungscode und Erfassungslink als optionale Team-Freigabe statt als Pflichtentscheidung zeigen.
3. Den selbst erzeugten Erfassungslink fuer den bereits angemeldeten Register-Owner robuster machen.

## Warum

- Die bisherige Step-3-Seite stellte zwei Sharing-Artefakte gleichrangig in den Mittelpunkt, obwohl neue Admins zuerst selbst verstehen wollen, wie Erfassung und Register funktionieren.
- `Einladungscode` und `Erfassungslink` sind wichtig, aber nicht die naechste Entscheidung fuer den Owner.
- Wenn der Owner den gerade erzeugten Link selbst testet, soll das nicht an der oeffentlichen Server-Validierung scheitern, solange der Owner bereits authentifiziert ist.

## Produktentscheidung

1. Primäre Aktion ist jetzt: `Jetzt ersten Einsatzfall selbst erfassen`.
2. Team-Freigabe ist ein optional aufklappbarer Bereich.
3. Im Team-Bereich wird die Nutzung klar getrennt:
   - `Erfassungslink` ist empfohlen
   - `Einladungscode` ist Fallback fuer manuelle Weitergabe
4. `'/erfassen'` nutzt bei `503` einen Owner-Fallback:
   - Wenn die Person bereits als Code-Owner angemeldet ist, wird der Code clientseitig validiert.
   - Die Erfassung kann dann direkt ueber den normalen Register-Service gespeichert werden.

## Umsetzung

1. `src/components/onboarding/team-share-step.tsx`
   - neue gemeinsame Step-3-Komponente fuer Admin-Onboarding
2. `src/app/einrichten/page.tsx`
   - Step 3 auf `Loslegen` umgestellt
   - erste Aktion klar priorisiert
3. `src/components/landing/setup-section.tsx`
   - gleiche Fuehrung wie im dedizierten Setup-Flow
4. `src/lib/capture-by-code/client-fallback.ts`
   - Owner-spezifische Fallback-Validierung und Direkt-Speicherung
5. `src/app/erfassen/page.tsx`
   - nutzt den Fallback bei `503` oder Netzfehlern

## Risiken

1. Der Fallback hilft nur bereits angemeldeten Code-Ownern, nicht externen Teammitgliedern ohne Server-Validierung.
2. Wenn die Runtime-Credentials in Produktion fehlen, bleibt der echte Member-by-Code-Flow weiterhin operativ gestoert.
3. Der UI-Shift veraendert bewusst die Prioritaet von Sharing. Das ist fachlich gewollt und kann fuer bestehende Gewohnheiten ungewohnt sein.

## Tests

1. `src/lib/capture-by-code/client-fallback.test.ts`
   - validiert aktiven Owner-Code
   - lehnt fremde oder abgelaufene Codes ab
   - prueft direkten Owner-Submit inklusive Usage-Counter

## Rollback

1. Revert der oben genannten Dateien.
2. Keine Datenmigration noetig.
