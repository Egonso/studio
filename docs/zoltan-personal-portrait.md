# Zoltan Personal Portrait Route

## Why

The `/zoltan` route is an isolated German-language personal-brand page for Alexander Zoltan Gál. The current concept centers on `Menschlichkeit unter extremen Bedingungen` and uses a dark-blue honeycomb field as the main visual metaphor. It is intentionally separate from the KIRegister product surfaces so it can be reviewed without changing the public auth entry, register workflows, Firestore data model, or conversion paths.

## Data Flow

- Static Next.js route under `src/app/[locale]/zoltan/page.tsx`.
- Client-side visual experience in `src/components/zoltan/zoltan-portrait-experience.tsx`.
- Uses the existing public portrait asset at `/images/faculty/zoltan-gal.png` only as a small signature element.
- Uses browser-only WebGL through `three`, scroll choreography through `gsap/ScrollTrigger`, and optional user-initiated Web Audio.
- No server actions, database reads, analytics writes, API calls, or user-data transmission are introduced.

## Content Sources

The page copy was synthesized from public pages and local project documents:

- Public therapy and psycho-oncology profiles.
- Humanistische Psychoonkologie Fortbildung pages and local HPF project notes.
- KIRegister strategy and Register-First documents.
- Local mission notes for Creating Consciousness and Qualia Engine.

Private health, family, financial, credential, and raw personal-message content was not used as page content. The visible page intentionally avoids a public evidence shelf or construction notes.

## Risks

- The page is more cinematic and expressive than the KIRegister governance UI. This is deliberate because it is a personal page, not a product workflow.
- The copy includes interpreted positioning. It should be reviewed before publishing as an official personal site.
- Ambient sound is optional and starts only after user action.

## Rollback

Remove `src/app/[locale]/zoltan/page.tsx`, `src/components/zoltan/`, the `/zoltan` exclusions in `route-manifest.ts`, and the `gsap` / `three` dependencies if no other feature uses them.
