# Quick Capture Validierung und Custom-Tool-Pfad

Status: umgesetzt am 2026-03-12

## Problem

Im gemeinsamen Capture-Block fuer Quick Capture und `'/erfassen'` lagen UI-Signale und echte Speicherlogik auseinander:

1. `Use-Case Name`, `Owner-Rolle` und `System / Tool` waren visuell als Pflicht markiert.
2. Speichern wurde ueber `disabled` blockiert, ohne sichtbare Feldfehler oder Fokusfuehrung.
3. `'/erfassen'` und Quick Capture nutzten zwar denselben Eingabeblock, validierten aber weiterhin implizit nur im jeweiligen Screen.
4. Bei unbekannten Tools endete das Autocomplete mit `Kein Tool gefunden.` statt mit einer nutzbaren Anschlussaktion.

## Alte stille Validierung

1. Quick Capture blockierte `Speichern`, solange `purpose`, `ownerRole` und ein Tool nicht gesetzt waren.
2. `'/erfassen'` blockierte `Einsatzfall erfassen` ueber dieselbe lokale `disabled`-Logik.
3. Die API `POST /api/capture-by-code` verlangte fachlich aber nur `code`, `purpose` und `ownerRole`.
4. `registerService.createUseCaseFromCapture(...)` akzeptiert ebenfalls Eintraege ohne Tool, solange die Capture-Schema-Regeln fuer Zweck, Verantwortlichkeit und Auswahlkerne erfuellt sind.

Das Ergebnis war ein stiller UX-Abbruch: Nutzer:innen sahen kein Fehlerbild, obwohl die Speicherung nur an der UI-Blockade scheiterte.

## Entscheidung

Es gilt jetzt ein gemeinsamer Capture-Kern fuer Quick Capture, `'/erfassen'` und die Public-Capture-API:

1. Fachlich verpflichtend:
   - `Use-Case Name` mit mindestens 3 Zeichen
   - `Owner-Rolle (funktional)` mit mindestens 2 Zeichen
2. Optional:
   - `System / Tool`
   - `Kontaktperson`
   - `Wirkung & Betroffene`
   - `Daten & Sensitivitaet`
3. Wenn kein Wirkungsbereich aktiv gewaehlt wird, bleibt der bestehende Default `INTERNAL_ONLY`.
4. Ein unbekannter Tool-Name wird als `Custom Tool` gespeichert statt als Sackgasse dargestellt.

## Umsetzung

1. Gemeinsame Normalisierung und Pflichtfeld-Validierung:
   - `src/lib/register-first/shared-capture-fields.ts`
2. Quick Capture nutzt denselben Validierungshelper fuer Feldfehler, Fokus und Normalisierung:
   - `src/components/register/quick-capture-modal.tsx`
3. Public Capture `'/erfassen'` nutzt denselben Helper und dieselbe Fehlerfuehrung:
   - `src/app/erfassen/page.tsx`
4. Der gemeinsame Feldblock zeigt nur noch echte Pflichtfelder rot markiert und liefert Inline-Fehler:
   - `src/components/register/quick-capture-fields.tsx`
5. Die API `POST /api/capture-by-code` folgt denselben Mindestregeln:
   - `src/app/api/capture-by-code/route.ts`
6. Das Tool-Autocomplete bietet bei unbekannten Treffern eine produktive CTA:
   - `src/components/tool-autocomplete.tsx`

## Paritaet zwischen Modal und Public Capture

1. Beide Flows verwenden denselben Feldblock.
2. Beide Flows validieren dieselben Pflichtfelder ueber denselben Helper.
3. Beide Flows zeigen dieselbe ruhige Rueckmeldung:
   - Inline-Fehler am Feld
   - neutrale Sammelmeldung oberhalb der CTA
   - Fokus auf das erste fehlerhafte Pflichtfeld
4. Beide Flows behandeln ein leeres Tool konsistent als optional.
5. Beide Flows behandeln unbekannte Tool-Namen konsistent als `Custom Tool`.

## Risiken

1. Das Tool ist jetzt bewusst optional. Auswertungen oder nachgelagerte Views muessen weiterhin mit fehlendem Tool-Namen umgehen koennen.
2. Der gemeinsame Helper setzt weiterhin `INTERNAL_ONLY`, wenn kein Wirkungsbereich gewaehlt wurde. Wer spaeter strengere Capture-Anforderungen will, muss das bewusst im Helper und in der API aendern.
3. Das Autocomplete speichert unbekannte Namen direkt als Freitext. Das verbessert den Flow, erhoeht aber die Varianz im Tool-Bestand.

## Rollback

1. Rueckbau des Helpers `shared-capture-fields.ts`
2. Rueckbau der Inline-Validierung in:
   - `src/components/register/quick-capture-modal.tsx`
   - `src/app/erfassen/page.tsx`
   - `src/components/register/quick-capture-fields.tsx`
3. Rueckbau der Public-Capture-API-Paritaet in `src/app/api/capture-by-code/route.ts`
4. Rueckbau der Custom-Tool-CTA in `src/components/tool-autocomplete.tsx`

## Verifikation

1. `npm run lint`
2. `npm run typecheck`
3. `node --import tsx --test src/lib/register-first/shared-capture-fields.test.ts`
4. Manueller Smoke:
   - Quick Capture mit fehlenden Pflichtfeldern
   - `'/erfassen'` mit fehlenden Pflichtfeldern
   - unbekanntes Tool eingeben und als `Custom Tool` weiterverwenden
