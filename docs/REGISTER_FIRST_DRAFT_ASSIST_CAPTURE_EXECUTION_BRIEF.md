# Register First Draft Assist Capture Execution Brief

Stand: 2026-04-12

## Scope

Aktueller Slice:

- optionaler `Draft Assist`-Einstieg auf `/capture`
- schmale JSON-API fuer einen reviewbaren Erstentwurf
- lokales Panel mit klarer `nothing saved yet`-Kommunikation
- Handoff in den bestehenden `QuickCaptureModal`-Flow
- lokale Analytics fuer Start, Ergebnis und Handoff

Nicht Teil dieses Slices:

- keine neue Persistenzschicht
- keine Writes nach `aiSystems`
- keine automatische Governance-Entscheidung
- kein Supplier-Enrichment
- kein Audit-Workflow

## Zielbild

`/capture` bekommt einen additiven Assist-Einstieg vor dem eigentlichen Erfassungsdialog.

Der Nutzer kann:

- manuell starten wie bisher
- oder 2-5 Saetze eingeben und einen reviewbaren Entwurf erzeugen lassen

Gespeichert wird weiterhin nur ueber `QuickCaptureModal`.
Der Assist ist ein vorgelagerter Draft- und Handoff-Schritt, kein zweiter Intake-Kern.

## Delivery Gates

### Preview

- Preview-URL: noch nicht dokumentiert
- Preview-Verantwortliche fuer Abnahme: noch nicht dokumentiert
- Status: nicht release-ready, bis Preview-Pfad und Verantwortliche benannt sind

### Feature Flag

- Name: `NEXT_PUBLIC_REGISTER_FIRST_DRAFT_ASSIST_CAPTURE`
- Server-Alias: `REGISTER_FIRST_DRAFT_ASSIST_CAPTURE`
- Default: `false`
- Owner: Register-First Produkt / Studio Engineering

### Rollback

Rollback ist rein ueber Flag moeglich:

1. `NEXT_PUBLIC_REGISTER_FIRST_DRAFT_ASSIST_CAPTURE=false`
2. neu deployen
3. `/capture` faellt auf den bestehenden manuellen Quick-Capture-Einstieg zurueck

Es gibt keinen Backfill und keinen neuen Persistenztyp, der bei Rollback bereinigt werden muesste.

### Acceptance

- Merge-Entscheider*in: noch nicht dokumentiert
- Release-Entscheidung: erst nach Preview-Abnahme mit Flag `off` und `on`

## Daten- und Migrationswirkung

- kein neues Persistenzmodell
- kein Dual-Write
- kein Backfill
- kein neues Register-Statusfeld
- Persistenz bleibt im bestehenden `UseCaseCard`-/Quick-Capture-Pfad

## Umgesetzter Funktionsumfang

1. API-Route:
   - `POST /api/draft-assist`
   - plain JSON
   - optional auth
   - ratelimitiert
   - keine Seiteneffekte ausser Ergebnisberechnung
2. Capture-UI:
   - optionales Draft-Assist-Panel auf `/capture`
   - ruhige Transparenzcopy
   - klarer manueller Fallback
3. Handoff:
   - `ready_for_handoff` und `needs_input` koennen in Quick Capture uebernommen werden
   - `blocked` bleibt bewusst ohne stillen Save-Pfad
4. Analytics:
   - `draft_assist_started`
   - `draft_assist_completed`
   - `draft_assist_handoff_accepted`
   - `draft_assist_handoff_dismissed`

## Validierung

Erfolgreich ausgefuehrt:

- `./node_modules/.bin/tsx --test src/lib/analytics/draft-assist-events.test.ts src/app/api/draft-assist/route.test.ts src/components/draft-assist/draft-assist-panel.test.tsx src/lib/draft-assist/context-resolver.test.ts src/lib/draft-assist/artifact-verifier.test.ts src/lib/draft-assist/question-generator.test.ts src/ai/flows/__tests__/draft-assist-generate.test.ts`
- `./node_modules/.bin/eslint src/app/api/draft-assist/route.ts src/app/api/draft-assist/route.test.ts src/components/draft-assist/draft-assist-panel.tsx src/components/draft-assist/draft-assist-panel.test.tsx src/lib/analytics/draft-assist-events.ts src/lib/analytics/draft-assist-events.test.ts src/lib/draft-assist/capture-handoff.ts src/app/capture/page.tsx src/lib/register-first/flags.ts`

Repo-weiter `typecheck` ist weiterhin rot, aber nach diesem Slice nur noch wegen bekanntem Altbestand in:

- `src/lib/register-first/__tests__/smoke.ts`

## Preview-Abnahmeskript

Mit Flag `off`:

1. `/capture` oeffnen
2. bestehender manueller Quick-Capture-Einstieg bleibt unveraendert
3. Speichern funktioniert wie bisher

Mit Flag `on`:

1. `/capture` oeffnen
2. `Draft Assist` und `Manuell erfassen` pruefen
3. gueltigen Freitext eingeben
4. `ready_for_handoff`-Fall pruefen
5. `needs_input`-Fall pruefen
6. Entwurf in Quick Capture uebernehmen
7. vor Uebernahme sicherstellen: noch nichts gespeichert
8. nach Uebernahme speichern und Reload pruefen

## Offene Risiken

- Preview-URL und Preview-Abnahmeverantwortung fehlen noch
- echter Browser-Durchlauf fuer Flag `off` und `on` steht noch aus
- `blocked`-Faelle brauchen in der Praxis gutes Copy-Feintuning

## Naechster sinnvoller Schritt

1. Preview mit Flag `on` deployen
2. 3-5 reale Capture-Beispiele gegen den Assist-Einstieg pruefen
3. Handoff-Qualitaet und Klickpfad beobachten
4. Flag bis zur Abnahme auf `false` lassen
