# Protected Area Gate - Sprints 49-53

Stand: 17.06.2026

## Ziel

Der zuvor reparierte Signed-out-Zustand für Agent Kit sollte nicht als doppelter Seiten-Code stehen bleiben. Geschützte Produktbereiche brauchen ein gemeinsames Pattern, damit Nutzer nicht in einer leeren App-Shell landen, wenn Auth fehlt oder langsam auflöst.

## Umsetzung

Ein neues `ProtectedAreaGate`-Pattern liegt in `src/components/product-shells.tsx`.

Es kapselt:

- `SignedInAreaFrame`
- `PageStatePanel`
- sachliche Auth-Copy
- Login-Link mit Icon
- gleiche Breiten- und Area-Semantik wie die übrigen Produktseiten

Die beiden Agent-Kit-Seiten nutzen dieses Pattern jetzt:

- `/de/settings/agent-kit`
- `/de/settings/agent-kit/candidates`

## Produktentscheidung

Das Gate erklärt den Zustand direkt auf der Ziel-URL. Es macht keinen stillen Auto-Redirect. Das ist für Deep Links kundenfreundlicher und vermeidet den Eindruck, der Agent-Kit-Bereich sei kaputt.

Für spätere globale Migration bleibt die Regel:

- Deep Links in geschützte Bereiche zeigen zuerst den geschützten Zustand.
- Der Nutzer entscheidet über `Anmelden`, ob er in den Login-Flow geht.
- Nach Login sollte ein expliziter Rücksprung zur ursprünglichen Ziel-URL ergänzt werden.

## QA

Lokale Prüfung auf `http://localhost:9002`:

- ESLint für `product-shells.tsx` und beide Agent-Kit-Seiten
- `npm run typecheck`
- Chrome/Playwright 1280x900 und 390x844:
  - Ziel-URL bleibt erhalten
  - `main` sichtbar
  - `h1` ist `Anmeldung erforderlich`
  - `Anmelden`-Button sichtbar
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Noch offen

Dieses Pattern sollte später auf weitere geschützte Seiten ausgerollt werden, besonders Settings, Control, Academy und Use-Case-Detailseiten. Das sollte aber bewusst seitenweise passieren, weil manche Bereiche aktuell eigene Auth-, Rollen- oder Workspace-Gates haben.
