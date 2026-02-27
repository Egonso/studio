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
3. Inhaltlicher Smoke-Test: `src/app/landingpage/content.smoke.ts`

## Datenfluss

1. Kein API-Call, keine Datenbankinteraktion.
2. Statische Inhalte aus `content.ts`.
3. CTAs verlinken auf bestehende Flows (`/capture`, `/my-register`, `/login`).

## Risiken

1. Sprachrisiko: Zu werblich oder zu weich formulierte Copy.
2. UX-Risiko: CTA-Ziel haengt vom bestehenden Auth-Flow ab.
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
2. Doku-Notiz entfernen: `docs/LANDINGPAGE_REGISTER_FIRST_2026-02-27.md`
