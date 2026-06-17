# Settings Protected Gate - Sprints 59-63

Stand: 17.06.2026

## Ziel

Die zentrale Settings-Seite hatte noch das alte Muster: bei fehlender Auth `router.push('/login')` und `return null`. Das kann für Deep Links oder langsame Auth-Auflösung wie eine leere Seite wirken.

## Umsetzung

`/de/settings` nutzt jetzt ebenfalls `ProtectedAreaGate`.

Der Login-Link enthält:

- `mode=login`
- `returnTo` auf die ursprüngliche Settings-URL
- bestehende Query-Parameter, zum Beispiel `section=affiliate`

## QA

Geprüft:

- ESLint für `src/app/[locale]/settings/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil auf `/de/settings?section=affiliate`
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link zeigt auf `/de/login?mode=login&returnTo=...`
  - `returnTo` bleibt `/de/settings?section=affiliate`
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Settings, Agent Kit API Keys und Agent Review Inbox teilen jetzt denselben menschenfreundlichen Signed-out-Zustand. Das reduziert leere Auth-Kanten in genau den Bereichen, in denen neue Nutzer ins Projekt einsteigen oder Agenten-Workflows einrichten.
