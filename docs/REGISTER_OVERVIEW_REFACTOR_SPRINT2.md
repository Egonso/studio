# Register Overview Refactor (Sprint 2)

Stand: 2026-02-26  
Scope: Dashboard-Oberflaeche auf Register-Overview umstellen

## Ziel

Die bisherige `/dashboard`-Ansicht zeigt keine Control-nahen Lens-/Upgrade-Module mehr, sondern eine klare Register-Overview.

## Umgesetzt

1. `src/components/dashboard.tsx` ist auf Register-Overview fokussiert:
   - Register-Kachel
   - Utility-Aktionen
   - Status-Workflow-Transparenz
2. `src/components/dashboard/register-tile.tsx` enthaelt die ruhigen Utility-Aktionen:
   - KI-Einsatzfall erfassen
   - Lieferant anfragen
   - Erfassungslink teilen
3. `src/components/register/governance-header.tsx` wurde von Control-Elementen bereinigt:
   - Lock/Erweitert entfernt
   - Dual-Score-Sektion entfernt
   - Utility-Leiste bleibt neutral
4. `src/app/dashboard/page.tsx` reicht `register` sauber an die Overview durch.

## Nicht-Ziel in Sprint 2

1. Kein Aufbau von AI Governance Control Features.
2. Keine Aenderung am Use-Case-Detailmodell.
3. Keine Datenmodell-Migration.

## Rollback

1. `src/components/dashboard.tsx` auf vorherigen Stand zuruecksetzen.
2. `src/components/dashboard/register-tile.tsx` auf den urspruenglichen CTA-Block zuruecksetzen.
3. `src/components/register/governance-header.tsx` auf vorherige Auspraegung zuruecksetzen.
4. `src/app/dashboard/page.tsx` Prop-Weitergabe rueckgaengig machen.

