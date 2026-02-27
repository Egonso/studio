# Control Policy Engine + Trigger-Logik + Analytics (Sprint 8)

Stand: 2026-02-27  
Scope: Finalisierung der Control-Ebene mit Policy-Intelligenz, Triggern und Event-Taxonomie

## Ziel

1. Policy Engine als organisationsweite Steuerungssicht in `/control/policies` bereitstellen.
2. Trigger-Logik fuer Register-zu-Control Ueberleitung deterministisch umsetzen.
3. Analytics-Funnel fuer Control-Nutzung und Ergebniswirkung instrumentieren.

## Umgesetzt

1. Policy-Engine-Logik in Control:
   - `src/lib/control/policy/coverage.ts`
   - Coverage %, Mapping `Policy -> Use Cases`, Versionierungskennzahlen.
   - Deterministische Preview-Generierung aus Registerdaten (`assemblePolicy*`).

2. Neue Policy-Route:
   - `src/app/control/policies/page.tsx`
   - Feature-Flag-Gating:
     - `controlShell`
     - `controlPolicyEngine`

3. Policy-UI:
   - `src/components/control/control-policy-engine.tsx`
   - Zeigt:
     - Policy Coverage %
     - Mapping-Tabelle mit Versionsstand
     - Ungemappte Use Cases mit Deep Links
     - Deterministische Preview inkl. Datenbasis und Section-IDs

4. Trigger-Engine:
   - `src/lib/control/triggers.ts`
   - Triggerbedingungen (exakt):
     - > 10 Use Cases
     - Review ueberfaellig
     - Hochrisiko ohne Aufsicht
     - ISO-Readiness < 70%
     - Externer Stakeholder-Nachweis benoetigt
   - Sprache:
     - `Sie dokumentieren. Jetzt sollten Sie steuern.`
     - CTA: `Governance professionalisieren`

5. Trigger-UI im Register:
   - `src/components/dashboard.tsx`
   - Trigger-Card in der Register-Overview (`/dashboard`), ohne Upsell-Dialog.

6. Analytics-Taxonomie:
   - `src/lib/analytics/control-events.ts`
   - Events:
     - `control_opened`
     - `trigger_shown`
     - `trigger_clicked`
     - `control_conversion`
     - `recommendation_completed`
     - `maturity_level_changed`
   - Persistenz lokal (LocalStorage), defensiv und testbar.

7. Analytics-Verdrahtung:
   - Register-Overview: `trigger_shown`, `trigger_clicked`
   - Control-Routen: `control_opened`
   - Control-Overview:
     - `control_conversion` bei Trigger-Einstieg
     - `recommendation_completed` via Queue-Delta
     - `maturity_level_changed` via Level-Delta

8. Control-Navigation erweitert:
   - `src/app/control/page.tsx`
   - Bereich `Policy Engine` hinzugefuegt (flag-gated).

## Event-Taxonomie (Payload-Contract)

1. `control_opened`
   - `route`, `entry`
2. `trigger_shown`
   - `source`, `trigger_ids`, `trigger_count`, `use_case_count`
3. `trigger_clicked`
   - `source`, `trigger_ids`, `trigger_count`, `use_case_count`
4. `control_conversion`
   - `source`, `trigger_ids`, `trigger_count`
5. `recommendation_completed`
   - `route`, `resolved_count`, `resolved_ids`, `open_count_after_sync`, optional `seconds_to_first_completion`
6. `maturity_level_changed`
   - `route`, `previous_level`, `current_level`, `delta`

## Rollout (Flag-weise)

1. `controlPolicyEngine`:
   - aktiviert `/control/policies` und Policy-UI.
2. `controlUpgradeTriggers`:
   - aktiviert Trigger-Card in Register-Overview.
3. `controlAnalytics`:
   - aktiviert Event-Tracking fuer Trigger/Control-Funnel.

Alle Flags bleiben default `false`.

## Smoke-Tests

1. `src/lib/control/__tests__/triggers.smoke.ts`
2. `src/lib/control/__tests__/control-events.smoke.ts`
3. `src/lib/control/__tests__/policy-coverage.smoke.ts`

## Risiken / Grenzen

1. Analytics ist aktuell lokal gespeichert (LocalStorage), nicht zentral aggregiert.
2. `recommendation_completed` wird ueber Queue-Deltas erkannt (deterministische Heuristik).
3. Policy-Mapping bleibt von sauber gepflegten `policyLinks` im Register abhaengig.

## Rollback

1. Neue Route entfernen:
   - `src/app/control/policies/page.tsx`
2. Neue Policy-Komponente entfernen:
   - `src/components/control/control-policy-engine.tsx`
3. Neue Libs entfernen:
   - `src/lib/control/policy/coverage.ts`
   - `src/lib/control/triggers.ts`
   - `src/lib/analytics/control-events.ts`
4. Navigation in `src/app/control/page.tsx` auf Vorstand zuruecksetzen.
5. Trigger-Card aus `src/components/dashboard.tsx` entfernen.
6. Sprint-8-Doku und Smoke-Tests optional entfernen.
