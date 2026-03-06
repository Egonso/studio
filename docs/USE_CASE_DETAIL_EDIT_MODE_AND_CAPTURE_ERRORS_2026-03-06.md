# Use-Case Detail Edit-Mode + Capture Error Hardening

Stand: 2026-03-06  
Scope: Detailansicht im Register, `capture-by-code` Fehlercopy

## Ziel

1. Stammdaten im Use-Case-Detail klar vom formalen Status-Workflow trennen.
2. Read-only-Zustand fuer Stammdaten explizit machen, statt implizit und widerspruechlich wirken zu lassen.
3. Infrastrukturfehler im Code-Capture-Flow ohne interne Diagnosecodes an Endnutzer anzeigen.

## Warum

- Der bisherige Button `Einsatzfall bearbeiten` wirkte wie ein globaler Seitenmodus, obwohl er fachlich nur die Stammdaten betrifft.
- Gleichzeitig blieben formale Aktionen wie Statusdokumentation sichtbar und aktiv. Das ist fachlich richtig, aber in der UI nicht klar genug getrennt.
- Im Capture-Flow wurden bei `503` interne API-Suffixe wie `[API-2-default-credentials]` in der Nutzeroberflaeche gezeigt. Das ist weder vertrauensbildend noch auditisch sinnvoll.

## Umsetzung

1. `src/components/register/detail/use-case-header.tsx`
   - CTA praezisiert auf `Stammdaten bearbeiten`.
   - Aktiver Zustand klarer benannt (`Bearbeiten beenden`).
2. `src/components/register/detail/use-case-metadata-section.tsx`
   - Read-only-Hinweis oberhalb der Stammdaten.
   - Klick auf editierbare Karten im Read-only-Zustand zeigt einen kurzen Hinweis statt stiller Inkonsistenz.
   - Smart-Hint-/Compliance-Aktion textlich als separate Dokumentationsaktion gekennzeichnet.
3. `src/components/register/detail/review-section.tsx`
   - Hinweis ergaenzt, dass formale Statusdokumentation getrennt von Stammdatenbearbeitung laeuft.
4. `src/app/api/capture-by-code/route.ts`
   - Operative `503`-Fehler geben nur noch generische Nutzercopy zurueck.
5. `src/lib/capture-by-code/error-copy.ts`
   - Zentrale Fehlerabbildung fuer Code-Pruefung und Code-Capture.
   - Entfernt interne Debug-Suffixe aus serverseitigen Fehlermeldungen.
6. `src/app/erfassen/page.tsx`, `src/app/einladen/page.tsx`, `src/components/landing/setup-section.tsx`
   - Verwenden die zentrale Fehlercopy konsistent.

## Datenfluss

1. Stammdaten bleiben auf `UseCaseCard` die kanonische Dokumentation.
2. Der Edit-Mode oeffnet nur die manuelle Bearbeitung dieser Stammdaten.
3. Der Pruefstatus bleibt ein separater formaler Workflow und wird weiterhin direkt dokumentiert.
4. `capture-by-code` validiert und speichert unveraendert ueber denselben API-Pfad; nur die Fehlerabbildung wurde vereinheitlicht.

## Tests

1. `src/lib/capture-by-code/error-copy.test.ts`
   - Debug-Suffix wird entfernt.
   - `503` wird auf generische Nutzercopy gemappt.
   - `410` fuer abgelaufene Codes bleibt differenziert.
   - `400` im Submit-Flow zeigt Formularhinweis.

## Risiken

1. Read-only-Karten reagieren jetzt aktiv auf Klicks; zu aggressive Wiederholung des Hinweises waere stoerend. Deshalb ist der Hinweis gedrosselt.
2. Die eigentliche Betriebsstoerung bei fehlenden Firebase-Admin-Credentials wird damit nicht behoben, nur sauberer kommuniziert.
3. Fuer produktive Deployments muessen serverseitige Firebase-Admin-Variablen in der Runtime weiterhin korrekt gesetzt sein.

## Rollback

1. Revert der folgenden Dateien:
   - `src/components/register/detail/use-case-header.tsx`
   - `src/components/register/detail/use-case-metadata-section.tsx`
   - `src/components/register/detail/review-section.tsx`
   - `src/app/api/capture-by-code/route.ts`
   - `src/app/erfassen/page.tsx`
   - `src/app/einladen/page.tsx`
   - `src/components/landing/setup-section.tsx`
   - `src/lib/capture-by-code/error-copy.ts`
   - `src/lib/capture-by-code/error-copy.test.ts`
2. Keine Datenmigration noetig.
