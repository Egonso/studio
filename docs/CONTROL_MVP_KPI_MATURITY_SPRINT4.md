# Control MVP: KPI Header + Maturity Model (Sprint 4)

Stand: 2026-02-26  
Scope: Aufbau der ersten steuernden Control-Ebene mit transparenter Berechnungslogik

## Ziel

`/control` liefert einen sachlichen 10-Sekunden-Ueberblick und ein nachvollziehbares Governance-Maturity-Level.

## Umgesetzt

1. `src/lib/control/maturity-calculator.ts`
   - Deterministische KPI-Berechnung fuer:
     - Systeme gesamt
     - Hochrisiko (Anzahl + Prozent)
     - Reviews faellig / ueberfaellig
     - Systeme ohne Owner
     - Governance Score
     - ISO-Readiness %
   - Deterministisches Maturity-Modell Level 1-5 mit:
     - erfuellten/fehlenden Kriterien
     - Datengrundlage je Kriterium
     - klaren Schwellwerten
2. `src/components/control/control-kpi-header.tsx`
   - Ruhiger KPI-Header ohne Warnfarben/Balken.
3. `src/components/control/control-maturity-panel.tsx`
   - Level-Darstellung mit Kriterien pro Reifegrad.
4. `src/app/control/page.tsx`
   - Control-MVP-Seite mit Datenladung aus Register.
   - Feature-Flag-Handling:
     - Route weiterhin hinter `controlShell`.
     - KPI-Panel hinter `controlKpiHeader`.
     - Maturity-Panel hinter `controlMaturityModel`.
   - Transparenz-Block fuer Formel und Datengrundlage.
5. `src/lib/control/__tests__/maturity-calculator.smoke.ts`
   - Smoke-Tests fuer Teilreife- und Audit-ready-Szenario.

## Formel (transparent)

1. Governance Score:
   - 30% Dokumentationsabdeckung
   - 20% Owner-Coverage
   - 20% Review-Struktur
   - 15% Aufsichtsabdeckung
   - 15% Policy-Mapping
2. ISO-Readiness:
   - 35% Review-Struktur
   - 25% Dokumentationslevel
   - 25% Aufsicht
   - 15% Audit-Historie
3. Review-Fenster:
   - "faellig": naechstes Review innerhalb 30 Tage
   - "ueberfaellig": naechstes Review in der Vergangenheit

## Schwellwerte Maturity

1. Dokumentation: >= 90%
2. Owner-Coverage: >= 80%
3. Review-Coverage: >= 80%
4. Hochrisiko mit Aufsicht: 100%
5. Policy-Mapping: >= 70%
6. Audit-Coverage: >= 80%
7. ISO-Readiness fuer Level 5: >= 80%

## Grenzen und Risiken

1. Maturity basiert auf dokumentierten Registerdaten; Datenluecken senken den Score direkt.
2. Policy-Mapping verwendet aktuell `policyLinks` pro Use Case als Nachweis.
3. Audit-Historie wird ueber `reviews`, `statusHistory` und vorhandene `proof`-Daten angenaehert.
4. Bei leerem Register sind Kennzahlen konservativ (0), nicht prognostisch.

## Rollback

1. `src/app/control/page.tsx` auf Vorversion zuruecksetzen.
2. Neue Control-Komponenten und Calculator entfernen:
   - `src/components/control/control-kpi-header.tsx`
   - `src/components/control/control-maturity-panel.tsx`
   - `src/lib/control/maturity-calculator.ts`
3. Sprint-4-Doku und Smoke-Test entfernen (optional):
   - `docs/CONTROL_MVP_KPI_MATURITY_SPRINT4.md`
   - `src/lib/control/__tests__/maturity-calculator.smoke.ts`
