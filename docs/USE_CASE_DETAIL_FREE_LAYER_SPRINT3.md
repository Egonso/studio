# Use-Case Detail Free Layer (Sprint 3)

Stand: 2026-02-26  
Scope: Use-Case-Seite auf klare Register-Free-Ebene zuschneiden

## Ziel

Die Use-Case-Detailseite soll im Register vollstaendig wirken, ohne Control-Module in der primaeren Navigation.

## Umgesetzt

1. `src/components/register/detail/use-case-metadata-section.tsx`
   - Tab-Navigation entfernt (kein ISO/Portfolio als Primaer-Tabs).
   - Lock/Gating-Elemente entfernt.
   - Ein klarer Control-Einstieg eingefuehrt:
     - Button: `Im AI Governance Control anzeigen`
     - Subtext: `Organisation steuern und Audit-Faehigkeit herstellen`
   - Free-Elemente bleiben erhalten:
     - Stammdokumentation
     - Use-Case Pass Button
     - Smart-Hint-Pruefung
2. `src/app/my-register/[useCaseId]/page.tsx`
   - Rechte Spalte auf Register-Kern reduziert:
     - `ReviewSection` (Status-Workflow)
     - `AuditTrailSection` (minimaler Audit-Trail)
   - Gleichrangige ISO-/Liability-/Timeline-Module entfernt.
   - Ladepfad vereinfacht auf gezielten Use-Case-Fetch.

## Akzeptanzbezug

1. Use-Case-Seite wirkt als vollstaendige Free-Stammdokumentation.
2. Es gibt genau einen klaren Einstieg in Control aus der Detailseite.
3. Use-Case-Exports bleiben getrennt von Control-Orga-Ebene.

## Nicht-Ziel in Sprint 3

1. Keine neue Governance-Automation.
2. Keine Aenderung am Register-Datenmodell.
3. Keine Aktivierung von Control-Features ohne Flag-Freigabe.

## Rollback

1. `src/components/register/detail/use-case-metadata-section.tsx` auf Vorversion zuruecksetzen.
2. `src/app/my-register/[useCaseId]/page.tsx` auf Vorversion mit den entfernten Modulen zuruecksetzen.
3. Deployment neu ausrollen.
