# Control ISO & Audit Layer + Organisations-Export-Center (Sprint 7)

Stand: 2026-02-27  
Scope: Organisationsweite Auditsteuerung und Export-artefakte in `/control`

## Ziel

Control um zwei getrennte Organisationsbereiche erweitern:

1. `ISO & Audit Layer` fuer org-weite Lifecycle-Sicht, Gap-Analyse und immutable Historie.
2. `Organisations-Export-Center` fuer vier org-weite Artefakte:
   - ISO 42001 Dossier
   - Governance Report
   - Trust Portal Bundle
   - Policy Bundle

## Umgesetzt

1. Neue Audit-Library:
   - `src/lib/control/audit/org-audit-layer.ts`
   - Deterministische Aggregation fuer:
     - ISO Lifecycle Summary
     - ISO-Clause-Progress (4/5/6/8/9/10)
     - Gap-Analyse mit Deep Links
     - Immutable Review/Status-History mit stabiler Referenz (`IMM-...`)

2. Neue Export-Library:
   - `src/lib/control/exports/org-export-center.ts`
   - Builder fuer vier Exporttypen inkl. Dateinamen/Mime-Types.
   - Dossier-Precheck: bei fehlender Reife wird eine Vorpruefungsdatei exportiert statt Crash.

3. Neue Control-Routen:
   - `src/app/control/audit/page.tsx`
   - `src/app/control/exports/page.tsx`
   - Gating:
     - `controlShell` als Voraussetzung
     - `controlIsoAudit` bzw. `controlOrgExportCenter` fuer Freigabe

4. Neue Control-Komponenten:
   - `src/components/control/control-audit-layer.tsx`
   - `src/components/control/control-export-center.tsx`

5. Navigation erweitert:
   - `src/app/control/page.tsx`
   - Bereichsbuttons fuer:
     - Portfolio Intelligence
     - ISO & Audit Layer
     - Organisations-Export-Center

6. Smoke-Tests fuer Sprint-7-Logik:
   - `src/lib/control/__tests__/org-audit-layer.smoke.ts`
   - `src/lib/control/__tests__/org-export-center.smoke.ts`

## Exportabgrenzung Free vs Paid

1. Free im Register bleibt unveraendert:
   - Use-Case-Pass PDF
   - Use-Case-Pass JSON

2. Paid in Control (organisationsweit):
   - ISO 42001 Dossier
   - Governance Report
   - Trust Portal Bundle
   - Policy Bundle

3. Trennung in der UI:
   - Organisations-Export-Center zeigt expliziten Hinweis,
     dass Use-Case-Pass Exporte im Register verbleiben.
   - Keine Vermischung beider Exportarten in derselben UI-Zone.

## Datenfluss

1. Register bleibt Record of Truth (`UseCaseCard`, `OrgSettings`).
2. Control berechnet nur abgeleitete org-weite Sicht.
3. Export-Center serialisiert aus Registerdaten + Policies:
   - keine automatische Governance-Entscheidung,
   - keine Blackbox-Scoring-Logik.

## Risiken / Grenzen

1. Policy-Bundle-Mapping basiert auf `policyLinks` und exakter Policy-ID-Zuordnung.
2. Trust-Portal-Bundle aggregiert aktuelle Registersicht; externe Publikationsprozesse bleiben unveraendert.
3. Dossier-Readiness haengt von Org-Baselines (Policy, Branche, gepruefte Use Cases) ab.

## Rollback

1. Neue Routen entfernen:
   - `src/app/control/audit/page.tsx`
   - `src/app/control/exports/page.tsx`

2. Neue Komponenten entfernen:
   - `src/components/control/control-audit-layer.tsx`
   - `src/components/control/control-export-center.tsx`

3. Neue Libs entfernen:
   - `src/lib/control/audit/org-audit-layer.ts`
   - `src/lib/control/exports/org-export-center.ts`

4. Navigation in `src/app/control/page.tsx` auf vorherigen Stand zuruecksetzen.

5. Sprint-7-Doku und Smoke-Tests optional entfernen:
   - `docs/CONTROL_AUDIT_EXPORT_CENTER_SPRINT7.md`
   - `src/lib/control/__tests__/org-audit-layer.smoke.ts`
   - `src/lib/control/__tests__/org-export-center.smoke.ts`
