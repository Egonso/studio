# Firebase Functions deployment guide

## Production target

- Firebase project: `ai-act-compass-m6o05`
- Codebase: `app`
- Runtime: Node.js 22
- Runtime source of truth: `firebase.json`
- Package compatibility declaration: `functions/package.json`

The application currently deploys five Functions:

- `api`
- `stripeWebhook`
- `scheduledSupplierReminders`
- `checkPublicInfo`
- `sendWelcomeEmailOnPurchase`

## Preflight

1. Work from a clean checkout of the merged commit.
2. Use Node.js 22 and a current Firebase CLI.
3. Confirm the Firebase project explicitly; do not rely on an implicit default.
4. Confirm required secrets exist through metadata commands. Never print secret values into the terminal transcript or documentation.
5. Preserve the existing non-secret parameter values for sender, templates, and public origin.

This runtime migration does not require Firestore rules, indexes, schema changes, or data backfills.

## Build and deploy

```bash
npm --prefix functions ci
npm --prefix functions run typecheck
npm --prefix functions run build
firebase deploy --only functions --project ai-act-compass-m6o05
```

If local source discovery is unusually slow, diagnose the filesystem or deploy from a clean checkout. The deployment must still use the exact merged source.

## Configuration boundaries

Secrets are managed with Firebase Functions secrets. Examples include Stripe, Emailit, and supplier-session credentials. Do not store them in tracked files.

Non-secret parameters include:

- `EMAILIT_FROM_EMAIL`
- `EMAILIT_SUPPLIER_REMINDER_TEMPLATE`
- `EMAILIT_WELCOME_TEMPLATE`
- `APP_PUBLIC_ORIGIN`

The deployment may prompt for these values when a clean checkout has no local parameter file. Reuse the current production values; do not guess or silently replace them.

## Verification

After deployment:

```bash
firebase functions:list --project ai-act-compass-m6o05
```

Verify that all five application Functions are `ACTIVE` on `nodejs22`. Then run the smallest safe live checks for the changed behavior, such as the public API health path or a bounded, non-PII analytics event.

## Rollback

The runtime-only rollback is to revert the migration commit and redeploy the prior runtime while Node.js 20 deployments remain permitted. This is a time-limited fallback because Node.js 20 is scheduled for decommissioning on 2026-10-30. Functional code regressions should be handled by reverting the responsible application commit and redeploying from a clean checkout.

See [docs/NODE22_RUNTIME_MIGRATION_2026-07-17.md](docs/NODE22_RUNTIME_MIGRATION_2026-07-17.md) for the migration evidence and support window.
