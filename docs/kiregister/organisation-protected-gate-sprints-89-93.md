# Organisation Protected Gate - Sprints 89-93

Stand: 17.06.2026

## Ziel

Die Organisationssteuerung unter `/de/control/organisation` ist ein zentraler Workspace-Adminbereich. Ohne Anmeldung sollte sie nicht still ins Login springen oder leer wirken.

## Umgesetzt

`/de/control/organisation` nutzt jetzt `ProtectedAreaGate`.

Der Login-Link enthält:

- `mode=login`
- `returnTo=/de/control/organisation`

## QA

Geprüft:

- ESLint für `src/app/[locale]/control/enterprise/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil auf `/de/control/organisation`
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` bleibt `/de/control/organisation`
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Workspace- und Organisationslinks sind jetzt konsistent mit den übrigen Control-Flächen. Das ist besonders wichtig für Team-Einladungen, Rollenarbeit, Sign-offs und Agent-Kit-Key-Verwaltung.
