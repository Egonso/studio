# Control Protected Gate - Sprints 64-68

Stand: 17.06.2026

## Ziel

Die Control-Seiten hatten noch das alte Muster `router.push('/login')` plus leeren Signed-out-Render. Für Governance-Flächen ist das ungünstig: Ein Deep Link in Reviews, Exports oder Trust Portal soll erklären, dass Auth nötig ist, statt kurz leer zu wirken.

## Umgesetzt

Folgende Seiten nutzen jetzt `ProtectedAreaGate`:

- `/de/control`
- `/de/control/reviews`
- `/de/control/exports`
- `/de/control/policies`
- `/de/control/trust`

Jeder Login-Link enthält:

- `mode=login`
- lokalisierte Zielseite
- `returnTo` auf den ursprünglichen Control-Bereich
- vorhandene Query-Parameter auf der Control-Übersicht

## QA

Geprüft:

- ESLint für alle fünf migrierten Control-Seiten
- `npm run typecheck`
- Chrome/Playwright Desktop und Mobile:
  - `h1` ist `Anmeldung erforderlich`
  - `Anmelden`-Button sichtbar
  - `returnTo` zeigt auf den ursprünglichen Control-Pfad
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

Hinweis: Query-Werte werden über `URLSearchParams` normalisiert. Beispiel: `triggerIds=a,b` wird als `triggerIds=a%2Cb` im `returnTo` erhalten. Das ist semantisch derselbe Wert und für den Auth-Rücksprung stabiler.

## Wirkung

Neue Nutzer, Co-Founder-Links und interne Doku können jetzt direkt auf Control-Unterseiten zeigen. Ohne Login entsteht kein leerer Zustand mehr; nach Anmeldung ist der ursprüngliche Governance-Kontext wiederherstellbar.
