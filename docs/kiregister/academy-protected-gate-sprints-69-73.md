# Academy Protected Gate - Sprints 69-73

Stand: 17.06.2026

## Ziel

Die Kurs-/Academy-Seite nutzte noch einen stillen Login-Redirect und renderte ohne Nutzer leer. Gerade Lern-Deep-Links sollten aber erklären, warum Anmeldung nötig ist, und danach zum konkreten Kurskontext zurückführen.

## Umgesetzt

`/de/kurs` nutzt jetzt `ProtectedAreaGate`.

Der Login-Link enthält:

- `mode=login`
- `returnTo` auf `/de/kurs`
- vorhandene Kurs-Parameter, zum Beispiel `videoId`

## QA

Geprüft:

- ESLint für `src/app/[locale]/kurs/page.tsx`
- `npm run typecheck`
- Chrome/Playwright mobil auf `/de/kurs?videoId=module-1-video-1`
  - `h1` ist `Anmeldung erforderlich`
  - Login-Link enthält `mode=login`
  - `returnTo` bleibt `/de/kurs?videoId=module-1-video-1`
  - kein Next.js-Dialog-Overlay
  - keine Browser-Konsolenfehler
  - kein horizontaler Overflow

## Wirkung

Academy-Links aus Control, interner Doku oder E-Mails führen nicht mehr in eine leere Auth-Kante. Der Nutzer sieht den geschützten Bereich und kann nach Login in den konkreten Kurskontext zurückkehren.
