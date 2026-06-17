# Protected Login Return - Sprints 54-58

Stand: 17.06.2026

## Ziel

Das neue `ProtectedAreaGate` soll nicht nur erklären, dass Anmeldung nötig ist. Nach der Anmeldung muss der Nutzer auch wieder dort landen, wo er eigentlich hinwollte.

## Umsetzung

Das vorhandene Auth-Routing wurde erweitert:

- `buildLocalizedLoginPath(locale, options)` erzeugt lokalisierte Login-Links.
- Der Helper nutzt weiterhin `buildLoginPath` und damit dieselbe `returnTo`-Normalisierung wie der bestehende Auth-Flow.
- Agent Kit API Keys und Agent Review Inbox geben ihren aktuellen Workspace-Scope als `returnTo` weiter.

Beispiele:

- `/de/settings/agent-kit?workspace=org_123`
- `/de/settings/agent-kit/candidates?workspace=org_123`

führen jeweils zu:

- `/de/login?mode=login&returnTo=...`

## QA

Geprüft:

- `node --import tsx --test src/lib/auth/login-routing.test.ts`
- ESLint für Auth-Routing und beide Agent-Kit-Seiten
- `npm run typecheck`
- Chrome/Playwright:
  - Login-Link enthält `mode=login`
  - `returnTo` entspricht der ursprünglichen Agent-Kit-Zielseite
  - Workspace-Query bleibt erhalten
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler

## Bedeutung

Das macht Deep Links in Agent-Kit-Arbeitsflächen brauchbar. Ein Agent, eine interne Doku oder ein Co-Founder kann direkt auf die Review-Inbox verlinken; nicht angemeldete Nutzer sehen den Schutzkontext, melden sich an und behalten den Zielpfad.
