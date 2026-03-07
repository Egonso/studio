# Control Repair Navigation fuer Action Queue und Maturity

Stand: 2026-03-07  
Scope: `AI Governance Control`, Use-Case-Detailnavigation, Governance-Reparaturfuehrung

## Ziel

1. Neutrales Oeffnen eines Einsatzfalls von reparaturorientierten Deep-Links trennen.
2. Unerfuellte Governance-Kriterien nur dann klickbar machen, wenn die Zielstelle fachlich wirklich zur Behebung passt.
3. Bestehende `oversight`-Drilldowns rueckwaertskompatibel auf den neuen Governance-Reparaturbereich abbilden.

## Warum

- `Zum Einsatzfall` war in der Action Queue semantisch falsch: Der Link sprang oft direkt in einen heruntergescrollten Reparaturkontext.
- Das Maturity-Panel zeigte Defizite, bot aber keine gezielte Weiterleitung dorthin, wo ein User sie beheben kann.
- Ein pauschal klickbares ganzes Level waere irrefuehrend, weil mehrere Kriterien unterschiedliche Ursachen und Zielstellen haben.

## Produktentscheidung

1. Action Queue bekommt zwei Pfade:
   - gezielte Reparatur-CTA, wenn eine echte Zielstelle existiert
   - neutrale Detailansicht als `Einsatzfall öffnen`
2. Maturity-Kriterien bekommen nur dann eine CTA, wenn die Behebung ueber eine konkrete Zielstelle moeglich ist.
3. Legacy-Links mit `focus=oversight` landen nicht mehr bei einem blossen Hinweisblock, sondern im Governance-Nachweis-Bereich des Einsatzfalls.
4. Kriterien ohne echte Zielstelle, z. B. Policy-Mapping ohne dedizierte Edit-Flaeche, bleiben bewusst nicht pseudo-klickbar.

## Umsetzung

1. `src/lib/control/deep-link.ts`
   - neue Governance-Felder fuer Reparaturkontexte (`oversight`, `reviewCycle`, `history`)
   - Builder fuer neutrale Detail-Links und fokussierte Reparatur-Links
2. `src/lib/control/action-queue-engine.ts`
   - Empfehlungen tragen jetzt getrennt `deepLink` und `viewLink`
   - Reparatur-Links zeigen auf konkrete Zielstellen statt generisch auf den Einsatzfall
3. `src/components/control/action-queue.tsx`
   - primaere Reparatur-CTA plus sekundaeres `Einsatzfall öffnen`
4. `src/lib/control/maturity-calculator.ts`
   - unerfuellte Kriterien koennen optional `actionHref` und `actionLabel` tragen
5. `src/components/control/control-maturity-panel.tsx`
   - rendert gezielte CTAs pro Kriterium und pro Level nur fuer den ersten wirklich behebbaren Gap
6. `src/app/my-register/[useCaseId]/page.tsx`
   - normalisiert alte `oversight`-Deep-Links auf den Governance-Bereich
   - wertet Governance-Felder aus und oeffnet Inline-Edit nur fuer wirklich editierbare Felder
7. `src/components/register/detail/governance-liability-section.tsx`
   - kann gezielt auf Aufsicht, Review-Zyklus oder Pruefhistorie fokussiert werden
   - oeffnet Inline-Edit fuer Aufsicht oder Review-Zyklus automatisch bei Reparatur-Links

## Datenfluss

1. Control berechnet Gaps deterministisch aus Registerdaten.
2. Fuer jeden Gap wird nur dann ein Reparatur-Link erzeugt, wenn ein passender Screen- oder Feldkontext existiert.
3. Die Detailseite interpretiert `focus`, optional `field` und optional `edit=1`.
4. Governance-Reparaturen landen im Governance-Nachweis-Bereich; neutrale Links oeffnen die Detailseite ohne Scrollsprung.

## Betroffene Dateien

- `src/lib/control/deep-link.ts`
- `src/lib/control/action-queue-engine.ts`
- `src/components/control/action-queue.tsx`
- `src/lib/control/maturity-calculator.ts`
- `src/components/control/control-maturity-panel.tsx`
- `src/app/my-register/[useCaseId]/page.tsx`
- `src/components/register/detail/governance-liability-section.tsx`
- `src/lib/control/__tests__/action-queue-engine.smoke.ts`
- `src/lib/control/__tests__/maturity-calculator.smoke.ts`

## Risiken

1. Nicht jeder Governance-Gap hat heute schon eine echte Edit-Flaeche. Diese Faelle bleiben absichtlich ohne CTA, bis die Zieloberflaeche existiert.
2. Legacy-Links mit `focus=oversight` fuehren jetzt an einen anderen Detailbereich als zuvor. Das ist beabsichtigt, kann aber bei internem Gewohnheitsverhalten auffallen.
3. Die Governance-Reparaturfuehrung ist an `controlShell` gebunden; ohne aktivierten Control-Bereich bleibt nur die klassische Detailansicht.

## Rollback

1. Revert der oben genannten Dateien.
2. Keine Datenmigration noetig, da nur Navigations- und UI-Logik angepasst wurde.
