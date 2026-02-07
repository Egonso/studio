# Git Preview Release Flow

## Ziel

Sicher entwickeln, auf Preview deployen, erst nach Abnahme in `main` mergen.

## Standardablauf

1. Von `main` auf einen Feature-Branch wechseln.
2. Änderungen nur auf dem Feature-Branch entwickeln.
3. Feature-Branch deployen (Preview/Staging).
4. Preview testen und fachlich abnehmen.
5. Pull Request gegen `main` öffnen.
6. Checks/Review bestehen lassen.
7. In `main` mergen.
8. Produktion nur von `main` deployen.

## Branch-Namenskonvention

- Prefix: `codex/`
- Beispiel: `codex/register-first-foundation`

## Pflichtregeln für `main`

- Kein Direkt-Push.
- Merge nur über Pull Request.
- Mindestens 1 Review.
- Status Checks müssen grün sein.

## Empfohlene Status Checks

- `npm run lint`
- `npm run typecheck`
- Projekttests (wenn vorhanden)

## Feature-Flags

Neue größere Flows bleiben standardmäßig aus:

- `registerFirst.enabled=false`
- `registerFirst.hybridEntry=false`
- `registerFirst.proofGate=false`

Erst nach erfolgreicher Preview-Abnahme aktivieren.

## Recovery

Vor größeren Merges optional Tag setzen:

- `git tag pre-register-first-YYYYMMDD`
- `git push origin pre-register-first-YYYYMMDD`

