# Register-First Landingpage (Slice)

Stand: 2026-02-27  
Scope: Neue Route `/landingpage` für das AI Governance Register

## Ziel

Eine ruhige, institutionelle Landingpage bereitstellen, die:

1. Schatten-KI als Ausgangsproblem klar benennt.
2. Quick Capture (unter 30 Sekunden) im Hero verankert.
3. "dauerhaft kostenlos" als Kernbotschaft sichtbar macht.
4. AI Governance Control nur als optionale Erweiterung einordnet (ohne Funnel-Ton).

## Umsetzung

1. Neue Seite: `src/app/landingpage/page.tsx`
2. Typisierte Content-Quelle mit Schema-Validierung: `src/app/landingpage/content.ts`
3. Quick-Capture-CTA-Trigger:
   - `src/app/landingpage/quick-capture-trigger.tsx`
   - Primär-CTA öffnet direkt die Quick-Capture-Maske.
   - Nach erfolgreichem Speichern erfolgt die Navigation auf `/pass/[useCaseId]`.
4. Inhaltlicher Smoke-Test: `src/app/landingpage/content.smoke.ts`

## Datenfluss

1. Kein API-Call, keine Datenbankinteraktion.
2. Statische Inhalte aus `content.ts`.
3. Primär-CTA: Modal-Flow (`QuickCaptureModal`) -> `/pass/[useCaseId]`.
4. Sekundär-CTA: Link auf `/my-register`.

## Risiken

1. Sprachrisiko: Zu werblich oder zu weich formulierte Copy.
2. UX-Risiko: Ohne aktive Anmeldung wird auf den Login-Flow umgeleitet.
3. Kein Modell-/API-Risiko, da rein statische Route.

## Tests

1. Smoke-Test für Copy- und Akzeptanzkriterien:
   - Titel/Section-Struktur vorhanden
   - Quick Capture sichtbar
   - "dauerhaft kostenlos" sichtbar
   - EU AI Act Bezug vorhanden
   - Keine expliziten Funnel-Begriffe

## Rollback

1. Route entfernen:
   - `src/app/landingpage/page.tsx`
   - `src/app/landingpage/content.ts`
   - `src/app/landingpage/content.smoke.ts`
   - `src/app/landingpage/quick-capture-trigger.tsx`
2. Doku-Notiz entfernen: `docs/LANDINGPAGE_REGISTER_FIRST_2026-02-27.md`
