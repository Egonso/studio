# Action Queue + Deep Linking (Sprint 5)

Stand: 2026-02-27  
Scope: Priorisierte Massnahmen in Control und zielgenaue Navigation in Use-Case-Details

## Ziel

Control liefert in unter 30 Sekunden priorisierte Empfehlungen mit direktem Sprung in den relevanten Use-Case-Kontext.

## Umgesetzt

1. `src/lib/control/deep-link.ts`
   - Einheitlicher Focus-Contract:
     - `owner`
     - `review`
     - `oversight`
     - `policy`
     - `audit`
   - Helper fuer Deep-Link-Erzeugung:
     - `/my-register/[useCaseId]?focus=<target>`
2. `src/lib/control/action-queue-engine.ts`
   - Deterministische Priorisierungs-Engine (5-10 Empfehlungen).
   - Jede Empfehlung enthaelt:
     - Problem
     - Risiko/Impact
     - Empfohlene Aktion
     - Deep Link + Focus-Target
3. `src/components/control/action-queue.tsx`
   - UI-Liste mit priorisierten Empfehlungen und direktem Sprung zum Einsatzfall.
4. `src/app/control/page.tsx`
   - Action Queue in Control integriert (hinter `controlActionQueue` Flag).
5. `src/app/my-register/[useCaseId]/page.tsx`
   - `focus`-Parameter wird ausgewertet.
   - Scroll + temporaeres Highlight fuer die relevanten Bereiche.
   - Ungueltige Focus-Werte sind fail-safe und werden ignoriert.
6. `src/components/register/detail/use-case-metadata-section.tsx`
   - Fokusfaehige Ziele fuer `owner`, `oversight`, `policy` hinzugefuegt.
7. `src/lib/control/__tests__/action-queue-engine.smoke.ts`
   - Smoke-Test fuer Priorisierung und Deep-Link-Schema.

## Deep-Link Contract

1. Schema:
   - `/my-register/[useCaseId]?focus=owner|review|oversight|policy|audit`
2. Verhalten:
   - Gueltiger `focus`:
     - Scroll auf Zielbereich
     - temporaeres visuelles Highlight
   - Ungueltiger `focus`:
     - keine Exception
     - Standardansicht bleibt bedienbar
     - Hinweistext wird angezeigt

## Priorisierungslogik (Auszug)

1. Hochrisiko ohne Aufsicht (hoechste Prioritaet)
2. Ueberfaelliger Review
3. Fehlender Owner
4. Fehlende Review-Struktur
5. Fehlendes Policy-Mapping
6. Fehlende Audit-Historie
7. Faelliger Review (naechste 30 Tage)
8. UNREVIEWED-Status ohne formale Pruefung

Wenn weniger als 5 Regeln greifen, werden niedrig priorisierte Kontinuitaets-Checks ergaenzt, damit die Queue nutzbar bleibt.

## Grenzen und Risiken

1. Priorisierung basiert auf dokumentierten Registerdaten; unvollstaendige Daten koennen Prioritaeten verzerren.
2. `oversight` und `policy` fokussieren auf Metadatenbereiche in der Free-Detailseite; tiefergehende Steuerlogik bleibt im Control-Kontext.
3. Queue ist regelbasiert (deterministisch), nicht lernend.

## Rollback

1. Action Queue aus `/control` entfernen:
   - `src/components/control/action-queue.tsx`
   - `src/lib/control/action-queue-engine.ts`
2. Focus-Handling aus Detailseite zurueckbauen:
   - `src/app/my-register/[useCaseId]/page.tsx`
   - `src/components/register/detail/use-case-metadata-section.tsx`
3. Deep-Link-Helfer und Sprint-5-Doku entfernen:
   - `src/lib/control/deep-link.ts`
   - `docs/ACTION_QUEUE_DEEP_LINKING_SPRINT5.md`

