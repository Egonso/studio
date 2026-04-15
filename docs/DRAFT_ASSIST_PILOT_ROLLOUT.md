# Draft Assist Pilot Rollout

Stand: 2026-04-15

## Zweck

Diese Notiz haertet den bestehenden Draft-Assist-Pilot, ohne den Slice zu vergroessern.

Der Pilot bleibt:

- `Register-First`
- `artifact-first`
- ohne neuen Persistenztyp
- ohne automatische Governance-Entscheidung

## Feature Flag

- Client-Flag: `NEXT_PUBLIC_REGISTER_FIRST_DRAFT_ASSIST_CAPTURE`
- Server-Alias: `REGISTER_FIRST_DRAFT_ASSIST_CAPTURE`
- Default: `false`

## Rollback

Rollback bleibt absichtlich simpel:

1. `NEXT_PUBLIC_REGISTER_FIRST_DRAFT_ASSIST_CAPTURE=false`
2. neu deployen
3. `/capture` faellt auf den bestehenden manuellen Einstieg zurueck

Es gibt keinen Daten-Backfill und keinen neuen Write-Pfad, der rollback-seitig rueckgebaut werden muesste.

## Stop-Kriterien

Pilot stoppen oder hart kleiner schneiden, wenn:

- Entwuerfe regelmaessig falsche oder halluzinierte Kerndaten erzeugen
- Nutzer den Entwurf haeufig fast komplett neu schreiben muessen
- Duplicate-Hinweise mehr Verwirrung als Klarheit erzeugen
- unklar bleibt, was schon gespeichert wurde und was nicht
- der Pilot in Richtung autonomer Entscheidungen driftet

## Messlogik

Lokal erfasste Pilot-Signale:

- `draft_assist_started`
- `draft_assist_completed`
- `draft_assist_handoff_accepted`
- `draft_assist_handoff_dismissed`

Wichtige Felder im `completed`-Event:

- `verdict`
- `question_count`
- `duplicate_hint_count`
- `review_trigger_count`
- `missing_fact_count`
- `has_handoff`

Nicht Teil der Messlogik:

- kein Rohtext der Nutzereingabe
- keine stillen Background-Actions
- keine automatische Persistenz

## Preview-Abnahme

Mit Flag `off`:

1. `/capture` oeffnen
2. bestaetigen, dass der bisherige manuelle Einstieg unveraendert bleibt
3. Quick-Capture-Speichern pruefen

Mit Flag `on`:

1. `/capture` oeffnen
2. Draft-Assist-Einstieg sehen
3. gueltige Kurzbeschreibung eingeben
4. `ready_for_handoff`-Fall pruefen
5. `needs_input`-Fall pruefen
6. Duplicate-Hinweis pruefen, falls Register-Kontext aehnliche Use Cases enthaelt
7. bestaetigen, dass vor Handoff nichts gespeichert wurde
8. Handoff in Quick Capture pruefen
9. erst danach Speichern testen

## Nicht Teil dieses Piloten

- keine persistente Assist-Provenance im Artefakt
- keine Supplier-Writes
- kein Audit-Preparation-Agent
- kein Framework-Wechsel fuer Orchestration
