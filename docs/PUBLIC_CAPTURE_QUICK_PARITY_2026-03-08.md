# Public Capture an Quick Capture angleichen

Status: umgesetzt am 2026-03-08

## Problem

Die oeffentliche Erfassungsmaske unter `/erfassen` nutzte noch einen reduzierten Single-Select-Flow:

1. `usageContext` statt `usageContexts[]`
2. `dataCategory` statt `dataCategories[]`
3. kein Accordion fuer optionale Vertiefung
4. anderes Interaktionsmodell als Quick Capture

Dadurch entstanden zwei Capture-Sprachen fuer denselben Use-Case-Typ. Das ist UX-seitig verwirrend und technisch riskant, weil die oeffentliche Erfassung hinter dem eigentlichen Register-Flow zurueckfaellt.

## Entscheidung

Die oeffentliche Erfassungsmaske wird auf denselben Capture-Kern wie Quick Capture gehoben:

1. gleicher Eingabeblock fuer `Use-Case Name`, `Owner-Rolle`, `Kontaktperson`, `System / Tool`
2. gleiche aufklappbare Bereiche `Wirkung & Betroffene` und `Daten & Sensitivitaet`
3. Mehrfachauswahl fuer Wirkungsbereich und Datenkategorien
4. optionaler `decisionInfluence` statt separater Speziallogik

Die API bleibt rueckwaertskompatibel: `POST /api/capture-by-code` akzeptiert weiterhin alte Single-Select-Felder und normalisiert sie intern auf den neuen Auswahlkern.

## Umsetzung

1. Gemeinsame UI fuer Capture-Felder:
   - `src/components/register/quick-capture-fields.tsx`
2. Gemeinsame Auswahl-Logik fuer Datenkategorien:
   - `src/lib/register-first/capture-selections.ts`
3. Oeffentliche Erfassungsseite auf denselben Eingabeblock umgestellt:
   - `src/app/erfassen/page.tsx`
4. Quick Capture verwendet denselben Eingabeblock statt eigener Feld-Implementierung:
   - `src/components/register/quick-capture-modal.tsx`
5. Capture-by-code-Serverroute akzeptiert Arrays und normalisiert alte/neue Payloads:
   - `src/app/api/capture-by-code/route.ts`
   - `src/lib/capture-by-code/selections.ts`
6. Owner-Fallback folgt derselben neuen Payload-Struktur:
   - `src/lib/capture-by-code/client-fallback.ts`

## Datenfluss

1. UI sammelt `usageContexts[]`, `dataCategories[]` und optional `decisionInfluence`.
2. Public Capture sendet diese Felder an `POST /api/capture-by-code`.
3. Die Route normalisiert:
   - neue Array-Felder bevorzugt
   - alte Single-Select-Felder als Fallback
   - Default fuer fehlenden Wirkungsbereich bleibt `INTERNAL_ONLY`
4. Danach wird weiter ueber `prepareUseCaseForStorage(...)` gespeichert.

## Rueckwaertskompatibilitaet

Erhalten:

1. `usageContext` wird weiter akzeptiert.
2. `dataCategory` wird weiter akzeptiert.
3. `ownerName` wird weiter als Fallback fuer `ownerRole` interpretiert.
4. Bestehende Access-Code-Links und alte Clients brechen dadurch nicht.

## Risiken

1. Die gemeinsame Feldkomponente erzeugt gewollt engere UI-Paritaet. Wenn Quick Capture spaeter stark umgebaut wird, muss Public Capture bewusst mitgezogen werden.
2. Das Legacy-Feld `dataCategory` bleibt im Card-Modell vorhanden. Die neue UI arbeitet aber fachlich mit `dataCategories[]`.

## Rollback

1. Rueckbau der gemeinsamen Feldkomponente aus `/erfassen`
2. Rueckbau der Auswahl-Normalisierung in `capture-by-code`
3. Quick Capture kann auf die alte lokale Feld-Implementierung zurueckgesetzt werden

## Verifikation

1. `npm run lint`
2. `npm run typecheck`
3. `node --import tsx --test src/lib/register-first/capture-selections.test.ts src/lib/capture-by-code/selections.test.ts src/lib/capture-by-code/client-fallback.test.ts`
