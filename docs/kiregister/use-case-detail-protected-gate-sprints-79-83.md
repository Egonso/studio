# Use Case Detail Protected Gate - Sprints 79-83

Stand: 17.06.2026

## Ziel

Use-Case-Detailseiten sind häufig Deep-Link-Ziele aus Review, Control, Agentenläufen oder E-Mails. Ohne Anmeldung sollten sie nicht leer rendern oder still zum Login springen.

## Umgesetzt

`/de/my-register/[useCaseId]` nutzt jetzt `ProtectedAreaGate`.

Der Login-Link bewahrt:

- Use-Case-ID
- `focus`
- `edit`
- Workspace-Scope

Auch ein späterer `UNAUTHENTICATED`-Fehler beim Laden des Use Cases führt mit `returnTo` in den Login-Flow.

## QA

Geprüft:

- ESLint für `src/app/[locale]/my-register/[useCaseId]/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil auf `/de/my-register/uc_123?focus=reviewCycle&edit=1&workspace=org_123`
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` bleibt `/de/my-register/uc_123?focus=reviewCycle&edit=1&workspace=org_123`
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Links auf konkrete Use Cases sind jetzt belastbarer. Das ist besonders wichtig für die Agent-Strategie: Ein Agent kann auf einen Kandidaten, einen erzeugten Use Case oder eine Review-Stelle verweisen, ohne dass ein nicht angemeldeter Nutzer in einer leeren App-Fläche landet.
