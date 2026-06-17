# Agent Kit Signed-out QA - Sprints 44-48

Stand: 17.06.2026

## Ausgangspunkt

Die Review-Inbox und die Agent-Kit-Key-Seite waren funktional geschützt, aber im nicht angemeldeten Browser entstand ein unfreundlicher Zwischenzustand: Die Seite renderte kurz leer, während ein Client-Redirect Richtung Login lief. Für normale Nutzer wirkt das wie ein kaputter Produktbereich, obwohl technisch nur Auth fehlt.

## Entscheidung

Für die zwei Agent-Kit-Einstiegspunkte wird kein stiller Auto-Redirect mehr erzwungen. Stattdessen zeigen beide Seiten einen ruhigen, dokumentenzentrierten Zustand:

- Titel: `Anmeldung erforderlich`
- Kontextsatz zum geschützten Agent-Kit-Bereich
- klarer `Anmelden`-Button
- keine Marketing- oder Upgrade-Sprache
- keine Schreib- oder API-Aktion ohne Auth

Das passt besser zur UI-Charta: Zustand vor Interaktion, Klarheit vor Vollständigkeit, kein leerer Shell-Zustand.

## Umgesetzt

- `/de/settings/agent-kit`
  - sichtbarer Signed-out-Zustand für API-Key-Verwaltung
  - Login-Button statt leerem `return null`
  - Auto-Redirect-Effekt entfernt

- `/de/settings/agent-kit/candidates`
  - sichtbarer Signed-out-Zustand für Agent Review Inbox
  - Login-Button statt leerem `return null`
  - Auto-Redirect-Effekt entfernt

## QA

Lokale Prüfung auf `http://localhost:9002`:

- `npx eslint 'src/app/[locale]/settings/agent-kit/page.tsx' 'src/app/[locale]/settings/agent-kit/candidates/page.tsx'`
- `npm run typecheck`
- Chrome/Playwright-Viewport 1280x900:
  - beide URLs bleiben auf ihrer Agent-Kit-URL
  - `main` ist sichtbar
  - `h1` ist `Anmeldung erforderlich`
  - `Anmelden`-Button ist sichtbar
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
- Chrome/Playwright-Viewport 390x844:
  - beide Seiten zeigen den Signed-out-Zustand
  - kein horizontaler Overflow
  - keine Browser-Konsolenfehler

Temporäre Screenshot-Evidenz:

- `/tmp/kiregister-agent-kit-candidates-login.png`
- `/tmp/kiregister-agent-kit-settings-login.png`
- `/tmp/kiregister-agent-kit-candidates-login-mobile.png`
- `/tmp/kiregister-agent-kit-settings-login-mobile.png`

## Kritik und nächste Verbesserung

Das ist eine gute Reparatur, aber noch nicht die endgültige Auth-Story. Der nächste sinnvolle Block sollte ein einheitliches `ProtectedAreaGate`-Pattern bauen, damit geschützte Register-, Settings- und Control-Seiten nicht einzeln entscheiden müssen, ob sie redirecten, null rendern oder einen Hinweis zeigen.

Die Regel sollte danach lauten:

- öffentliche Deep Links erklären sichtbar, warum Auth nötig ist
- interne App-Navigation darf optional direkt ins Login führen
- keine geschützte Seite rendert nach Auth-Auflösung leer
- Login-Rücksprung zur ursprünglichen URL wird explizit dokumentiert
