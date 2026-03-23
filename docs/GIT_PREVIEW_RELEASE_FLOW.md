# Git Preview Release Flow

Stand: 2026-03-23

## Grundregel

Register-First-Arbeit wird nicht direkt auf `main` entwickelt.

Es gilt:

1. Arbeit nur auf `codex/*` Branches
2. kleiner, reversibler Slice pro PR
3. Preview zuerst
4. Merge nach `main` erst nach expliziter Abnahme

## Branch-Modell

- Entwicklungsbranch: `codex/*`
- `main`: release-orientiert und moeglichst stabil
- keine direkten Feature-Arbeiten auf `main`

## Feature-Flag-Regel

Groessere neue Produktpfade werden hinter Feature Flags ausgeliefert.

Pflicht:

- Default `false`
- Flag-off Verhalten bleibt funktionsfaehig
- Preview validiert Flag off und Flag on
- Rollback muss ueber Flag-Deaktivierung moeglich sein

## PR-Regel

Jeder Slice braucht vor dem Merge:

1. kurzen Execution Brief in `docs/`
2. dokumentierte Validierung
3. offene Risiken
4. klaren Rollback-Pfad

## Preview-Regel

Vor jedem Release-Entscheid muessen dokumentiert sein:

- Preview-URL
- wer abnimmt
- welcher Scope abgenommen wird
- welche Flags fuer die Preview gesetzt sind

Wenn das fehlt, ist der Slice nicht release-ready.

## Merge-Gates

Vor Merge nach `main`:

1. `lint` oder gezielte Lint-Checks erfolgreich
2. `typecheck` erfolgreich
3. relevante Tests erfolgreich
4. Preview-Abnahme erfolgt
5. Flag-defaults noch einmal geprueft
6. offene Risiken dokumentiert

## Rollback-Regel

Rollback muss vorab benannt sein.

Bevorzugt:

- Feature Flag deaktivieren
- Preview/Production neu deployen

Nur wenn noetig:

- PR revertieren

## Wenn Branch Protection fehlt

Falls technische Branch-Protection noch nicht verfuegbar ist, gilt trotzdem:

- PR-first diszipliniert durchsetzen
- keine "kurzen" Direkt-Merges
- Review- und Abnahme-Disziplin nicht aufweichen

## Handover-Paket

Jeder groessere Register-First-Slice sollte am Ende diese Artefakte haben:

1. `docs/REGISTER_FIRST_EXECUTION_BRIEF.md`
2. aktuelles `REGISTER_FIRST_HANDOVER_*.md` im second brain
3. aktualisierter `REGISTER_FIRST_NEW_THREAD_PROMPT.md`
4. dokumentierte offenen Risiken und Blocker
