# Admin and Task Protected Gates - Sprints 94-98

Stand: 18.06.2026

## Ziel

Die letzten sichtbaren alten Auth-Kanten lagen auf Admin- und Task-Seiten. Beide Seiten nutzten noch stille Login-Redirects, die bei Deep Links oder langsamer Auth-Auflösung leer wirken konnten.

## Umgesetzt

Folgende Seiten nutzen jetzt `ProtectedAreaGate`:

- `/de/admin`
- `/de/task/[id]`

Der Login-Link enthält jeweils:

- `mode=login`
- `returnTo` auf den ursprünglichen Pfad

## QA

Geprüft:

- ESLint für `src/app/[locale]/admin/page.tsx` und `src/app/[locale]/task/[id]/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil:
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` entspricht dem ursprünglichen Pfad
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

Hinweis: Der erste Admin-Warm-up brauchte im lokalen Next-Dev-Server rund eine Minute, weil die Admin-Seite viele Module kompiliert. Nach dem Warm-up war die QA sauber.

## Wirkung

Die bekannten produktseitigen Auth-Leerflächen sind jetzt geschlossen. Nicht angemeldete Nutzer bekommen einen erklärten Schutzkontext und verlieren Deep-Link-Ziele nicht.
