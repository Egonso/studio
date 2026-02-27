# Register UI Refinement + Flag Activation

Stand: 2026-02-27  
Scope: Register-Header, Use-Case-Detail-UI, Feature-Flag-Aktivierung für Testbetrieb

## Ziel

1. Register-Header auf zwei Kernkennzahlen reduzieren.
2. Direkten "Überblick"-Einstieg neben Register-Auswahl bereitstellen.
3. Use-Case-Detailansicht ruhiger und stärker im Register-Stil darstellen.
4. Alle Control-Feature-Flags für Testzwecke aktivieren.

## Umsetzung

1. `src/components/register/governance-header.tsx`
   - Block "Dokumentationsreife" entfernt.
   - Block "Statusverteilung" entfernt.
   - Nur noch:
     - Einsatzfälle gesamt
     - Offene Prüfungen
2. `src/app/my-register/page.tsx`
   - Neuer kleiner Button `Überblick` (Route: `/dashboard`).
   - Position direkt bei Registerauswahl / Register-Aktionen.
3. `src/components/register/detail/use-case-metadata-section.tsx`
   - "Kontext & Risiko" auf kompakte, gerahmte Karten umgestellt.
   - Sektionen "Eingesetztes KI-System" und "Verantwortlich" visuell verdichtet.
   - Keine Änderung der Fachlogik, nur UI-Struktur und Spacing.
4. `src/app/my-register/[useCaseId]/page.tsx`
   - Vertikale Abstände reduziert für kompaktere Darstellung.
5. Feature-Flags aktiviert:
   - `apphosting.yaml`
   - `netlify.toml`
   - `NEXT_PUBLIC_CONTROL_*` Flags auf `true` für KPI Header, Maturity, Action Queue, Portfolio, ISO/Audit, Policy Engine, Export Center, Upgrade Triggers, Analytics.

## Datenfluss / Logik

1. Keine API- oder Datenmodell-Änderung.
2. Keine Änderung an Statusworkflow, Review-Logik, Export-Logik.
3. Navigationserweiterung über bestehende Route `/dashboard`.

## Risiken

1. Alle aktivierten Flags können unvollständige Bereiche sichtbar machen, die bisher bewusst hinter Flags lagen.
2. Neue kompakte UI kann in Edge-Cases (lange Texte) enger wirken.

## Rollback

1. Revert der folgenden Dateien:
   - `src/components/register/governance-header.tsx`
   - `src/app/my-register/page.tsx`
   - `src/components/register/detail/use-case-metadata-section.tsx`
   - `src/app/my-register/[useCaseId]/page.tsx`
   - `apphosting.yaml`
   - `netlify.toml`
2. Optional: Feature-Flags wieder auf `false` setzen.
