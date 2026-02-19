# Debugging-Auftrag: Register-First Dashboard Integration

Ich arbeite an einer Next.js App ("AI Compliance OS") und habe das Dashboard refactored, um ein zentrales "AI Register" zu nutzen statt der alten Projekt-spezifischen Tools.

**Das Problem:**
Die Umstellung funktioniert noch nicht vollständig. Das Dashboard zeigt eventuell keine Daten an, oder der API-Call ("Jetzt prüfen") schlägt fehl. Auch der Link im Header scheint nicht zu stimmen.

**Relevante Dateien:**

1. `src/components/aims-dashboard-view.tsx`: Haupt-Dashboard. Hier wurde `ProjectToolsManager` durch `RegisterToolsManager` ersetzt.
    - *Pfad*: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/aims-dashboard-view.tsx`
2. `src/components/register-tools-manager.tsx`: Die neue Komponente für die Liste.
    - *Pfad*: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/register-tools-manager.tsx`
3. `src/app/api/tools/public-info-check/route.ts`: API Endpoint für Compliance-Checks.
    - *Pfad*: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/api/tools/public-info-check/route.ts`
4. `src/components/app-header.tsx`: Header-Navigation.
    - *Pfad*: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/app-header.tsx`

**Aufgaben:**

1. Prüfe in `aims-dashboard-view.tsx`, ob `<RegisterToolsManager />` korrekt eingebunden ist. Es wird aktuell `projectId` übergeben, aber die Komponente erwartet ggf. nichts oder eine `registerId`.
2. Prüfe in `register-tools-manager.tsx`, ob die `registerId` korrekt automatisch ermittelt wird (via `registerService` oder `register-settings-client`), wenn keine Props übergeben werden.
3. Stelle sicher, dass der API-Call in `RegisterToolsManager` (Funktion `runComplianceCheck`) eine valide `registerId` an den Server sendet. Wenn `registerId` null ist, schlägt der Request fehl.
4. Korrigiere den Logo-Link in `app-header.tsx` auf `/dashboard` (statt `/` oder `/projects`).

Bitte analysiere den Code und fixiere die Bugs, sodass das Dashboard die Daten aus dem Register lädt und der Compliance-Check funktioniert.
