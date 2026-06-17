# Control Specialized Protected Gates - Sprints 84-88

Stand: 17.06.2026

## Ziel

Nach den Hauptseiten sollten auch die kleineren Governance-Spezialflächen keine leeren Signed-out-Zustände mehr erzeugen.

## Umgesetzt

Folgende Seiten nutzen jetzt `ProtectedAreaGate`:

- `/de/control/audit`
- `/de/control/portfolio`
- `/de/control/batch-sealing`

Jede Seite behält einen lokalisierten Login-Link mit `mode=login` und passendem `returnTo`.

## QA

Geprüft:

- ESLint für die drei migrierten Seiten
- `npm run typecheck`
- Chrome/Playwright mobil:
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` entspricht dem jeweiligen Control-Pfad
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Governance-Deep-Links sind jetzt fast vollständig konsistent. Nutzer sehen einen erklärten Schutzkontext statt einer leeren Fläche, auch wenn sie direkt auf Spezialfunktionen wie Audit Layer, Portfolio oder Batch-Sealing springen.
