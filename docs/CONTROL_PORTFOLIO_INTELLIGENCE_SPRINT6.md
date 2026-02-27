# Control Portfolio Intelligence (Sprint 6)

Stand: 2026-02-27  
Scope: Eigenstaendiger Control-Bereich fuer org-weite Risiko-, Owner- und Statusanalyse

## Ziel

Portfolio Intelligence als eigener Control-Bereich aufbauen, klar getrennt vom Register.

## Umgesetzt

1. `src/lib/control/portfolio-metrics.ts`
   - Deterministische Metriken fuer:
     - Risikoverteilung
     - Risk-Status-Matrix (ruhige Heatmap in Graustufen)
     - Fachbereichsanalyse
     - Owner-Performance
     - Status-Verteilung
     - Risk Concentration Index (RCI)
   - Alle Segmentzeilen liefern Drilldown-Links auf konkrete Use Cases.
2. `src/components/control/portfolio-intelligence.tsx`
   - Audit-lesbare Portfolio-Ansicht ohne Warnfarben und ohne Alarm-Optik.
3. `src/app/control/portfolio/page.tsx`
   - Neue Route fuer Portfolio Intelligence.
   - Gating:
     - `controlShell` muss aktiv sein.
     - `controlPortfolioIntelligence` schaltet die Ansicht frei.
4. `src/app/control/page.tsx`
   - Bereichsnavigation erweitert um Einstieg in ` /control/portfolio`.
5. `src/lib/control/__tests__/portfolio-metrics.smoke.ts`
   - Smoke-Tests fuer Metrikberechnung, Drilldown-Schema und Empty-State-Verhalten.

## Risk Concentration Index (RCI)

1. Datengrundlage:
   - Systeme mit Risikoklasse `Hochrisiko` oder `Verboten`.
   - Gruppierung nach Fachbereich.
2. Methode:
   - HHI (Herfindahl-Hirschman Index) auf Gruppenanteile.
   - Normalisierung auf 0-100 fuer Vergleichbarkeit.
3. Interpretation:
   - `DIFFUSE`: geringe Konzentration
   - `BALANCED`: mittlere Konzentration
   - `CLUSTERED`: starke Konzentration

## Drilldown-Contract

1. Jede Kachel/Zeile bietet einen Link auf konkrete Use Cases.
2. Linkformat:
   - `/my-register/[useCaseId]?focus=owner|review|oversight|policy|audit`
3. Focus-Zuordnung:
   - Risiko/Fachbereich/RCI -> `oversight`
   - Owner -> `owner`
   - Status -> `review`

## Empty-State-Verhalten

1. Leere Datenlage liefert weiterhin stabile Metrikstrukturen (0-Werte).
2. UI zeigt klare Empty States statt Fehlern.

## Grenzen und Risiken

1. Analysequalitaet haengt direkt von Vollstaendigkeit der Registerdaten ab.
2. RCI nutzt derzeit Fachbereiche als Konzentrationsdimension.
3. Drilldowns springen auf einzelne Use Cases, nicht auf komplexe Mehrfachfilter.

## Rollback

1. Portfolio-Route entfernen:
   - `src/app/control/portfolio/page.tsx`
2. Portfolio-Komponente und Metrikmodul entfernen:
   - `src/components/control/portfolio-intelligence.tsx`
   - `src/lib/control/portfolio-metrics.ts`
3. Einstieg in `src/app/control/page.tsx` zurueckbauen.
4. Sprint-6-Doku und Smoke-Test optional entfernen:
   - `docs/CONTROL_PORTFOLIO_INTELLIGENCE_SPRINT6.md`
   - `src/lib/control/__tests__/portfolio-metrics.smoke.ts`

