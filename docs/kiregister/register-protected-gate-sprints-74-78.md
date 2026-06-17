# Register Protected Gate - Sprints 74-78

Stand: 17.06.2026

## Ziel

`/de/my-register` ist der Kernpfad des Produkts. Ohne Anmeldung führte die Seite bisher in einen Login-Redirect aus dem Ladeeffekt. Dadurch konnte der Register-Einstieg leer oder unstet wirken.

## Umgesetzt

`/de/my-register` nutzt jetzt `ProtectedAreaGate`.

Geändert wurde nur der Auth-Zweig:

- kein stiller Initial-Redirect mehr bei fehlendem Nutzer
- sichtbarer Zustand `Anmeldung erforderlich`
- Login-Link mit `mode=login`
- `returnTo` bewahrt Filter und Workspace-Scope
- echte Registerladefehler mit `UNAUTHENTICATED` behalten ebenfalls einen Rücksprung

## QA

Geprüft:

- ESLint für `src/app/[locale]/my-register/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil auf `/de/my-register?filter=external_submissions&workspace=org_123`
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` bleibt `/de/my-register?filter=external_submissions&workspace=org_123`
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Der wichtigste Register-Einstieg ist jetzt robust für Deep Links, E-Mail-Links und Agentenverweise. Nicht angemeldete Nutzer sehen, warum sie nicht direkt im Register landen, und verlieren den ursprünglichen Kontext nicht.
