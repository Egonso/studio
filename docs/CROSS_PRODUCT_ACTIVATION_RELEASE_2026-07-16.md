# Cross-product activation release

Date: 2026-07-16

## Why

EUKIGesetz and KI Register now share one measurable product outcome: a learner or contributor documents the first real AI use case, receives an explicit receipt, and can see the next human-owned action.

## User flow

1. EUKIGesetz exposes learner and team paths and records bounded course-funnel events.
2. The solo Stripe payment link carries an anonymous journey reference. The Stripe webhook is the purchase-completion source of truth.
3. A completed course displays a scoped certificate receipt and a primary first-use-case action.
4. `/capture` records a direct, draft-assisted, or coverage-assisted start, validates locally, and stores no form text in analytics.
5. Success states distinguish local browser storage from a real register and name the next reviewer.
6. The register overview ranks one advisory action and derives team progress from real records.
7. Supplier, review, pass, share, verification, and export actions support action-based return measurement.

## Data flow

### `productFunnelEvents`

Admin-only append collection written by:

- `POST /api/analytics/product-funnel` after strict Zod validation;
- trusted server flows for course completion, supplier submission, and certificate verification;
- the Stripe Functions webhook for completed training purchases.

Stored fields are limited to event enum, bounded payload enum, source, hashed session/user/workspace identifiers, identity hash, timestamps, privacy contract version, and an optional hashed external reference. Raw browser-session, Firebase-user, and workspace identifiers are not stored in the analytics collections.

The collection must never contain purpose descriptions, names, emails, raw referrers, document text, or form content.

### `productFunnelMilestones`

Admin-only derived collection keyed by a hashed workspace, user, or anonymous-session identity. The first real use case creates the activation milestone. Later operational actions can create one D7 and one D30 action-return event transactionally.

No migration, backfill, Firestore rule change, or index is required.

## Feature flags

- `NEXT_PUBLIC_COURSE_ACTIVATION_HANDOFF`
- `NEXT_PUBLIC_REGISTER_ACTIVATION_GUIDE`
- `NEXT_PUBLIC_PRODUCT_FUNNEL_ANALYTICS`

All three flags default to `false` in application code and are enabled explicitly in the production hosting configuration.

## Failure behavior

- Analytics failures never block capture, review, supplier processing, certificate issuance, checkout, or export.
- Unknown event fields and PII-like free-text additions are rejected by the strict contract.
- Cross-origin browser events are accepted only from the documented KI Register, EUKIGesetz, and local development origins.
- The register action rank is deterministic and explanatory; it never changes status or makes a governance decision.

## Deployment

1. Run lint, tests, isolated typecheck, root production build, and Functions TypeScript build.
2. Validate EUKIGesetz static-script syntax, anchors, local resources, desktop, and mobile layouts.
3. Merge and deploy the Studio pull request first so the analytics endpoint is available.
4. Deploy Functions with `firebase deploy --only functions --project ai-act-compass-m6o05` and verify the analytics endpoint without PII.
5. Merge the EUKIGesetz pull request only after the endpoint is healthy.
6. Verify both production domains and their cross-product handoff.

## Post-release maintenance (2026-07-17)

- GitHub CI, Netlify builds, and Firebase Functions moved from Node.js 20 to Node.js 22.
- The production Netlify project remains `studio-egonso`; its asset set was reverified against `kiregister.com`.
- The obsolete duplicate Netlify project `pumuckels` had no custom domain, served older assets, and was permanently deleted.
- Runtime migration evidence and rollback are documented in `docs/NODE22_RUNTIME_MIGRATION_2026-07-17.md`.

## Rollback

- Disable the three feature flags to remove the handoff, activation guide, and event ingestion without changing stored use cases.
- Revert the EUKIGesetz static instrumentation commit to remove cross-product course tracking.
- Revert the Functions deployment if Stripe webhook behavior changes unexpectedly; entitlement processing remains covered by the previous function revision.
- No data rollback is required because the release is additive and does not migrate canonical product records.
