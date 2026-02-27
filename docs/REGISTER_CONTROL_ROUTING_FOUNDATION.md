# Register / Control Routing Foundation

Stand: 2026-02-26  
Scope: Sprint 1 (IA Split + Terminologie + Routing-Fundament)

## Ziel

Die UI-Semantik trennt Register und Control klar, ohne bestehende `/dashboard`-Links zu brechen.

## Route Contract

1. `/my-register`
   - Primäre Arbeitsfläche für das AI Governance Register.
2. `/dashboard`
   - Technischer Kompatibilitäts-Alias für bestehende Integrationen und Links.
   - Wird in der UI als Register-Übersicht bezeichnet, nicht als "Dashboard".
3. `/control`
   - Technische Shell-Route für AI Governance Control.
   - Ist hinter Feature-Flag abgesichert.

## Terminologie-Regeln (Sprint 1)

1. Im Register-Kontext wird "Dashboard" nicht als sichtbares UI-Label verwendet.
2. Rücknavigation im Register lautet: `Zurück zum Register`.
3. Header-Navigation nutzt: `Register-Übersicht` (für `/dashboard`).

## Feature Flags (default: false)

In `src/lib/register-first/flags.ts` wurden folgende Control-Flags ergänzt:

1. `controlShell`
2. `controlKpiHeader`
3. `controlMaturityModel`
4. `controlActionQueue`
5. `controlPortfolioIntelligence`
6. `controlIsoAudit`
7. `controlPolicyEngine`
8. `controlOrgExportCenter`
9. `controlUpgradeTriggers`
10. `controlAnalytics`

## Aktivierung

Beispiel für die erste technische Freigabe:

1. `NEXT_PUBLIC_CONTROL_SHELL_ENABLED=true`
2. Deployment neu ausrollen.

## Rollback-Strategie

1. `NEXT_PUBLIC_CONTROL_SHELL_ENABLED=false` setzen.
2. Neu deployen.
3. `/control` zeigt wieder den sicheren Fallback-Zustand.
4. Bestehende `/dashboard`- und `/my-register`-Flows bleiben unverändert nutzbar.

