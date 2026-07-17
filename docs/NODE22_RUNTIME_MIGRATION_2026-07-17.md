# Node.js 22 runtime migration

Date: 2026-07-17

## Decision

Move GitHub CI, Netlify builds, and Firebase Functions from Node.js 20 to Node.js 22.

Node.js 20 entered the Google Cloud Functions deprecation phase on 2026-04-30 and is scheduled for decommissioning on 2026-10-30. Node.js 22 is supported for both first-generation and second-generation Functions and is scheduled for deprecation on 2027-04-30 and decommissioning on 2027-10-31.

Official references:

- [Cloud Run functions runtime support](https://docs.cloud.google.com/functions/docs/runtime-support)
- [Firebase: manage Functions runtimes](https://firebase.google.com/docs/functions/manage-functions)

## Scope

- `firebase.json`: Functions runtime `nodejs22`
- `functions/package.json`: engine `22`
- `functions/package-lock.json`: root engine metadata `22`
- `.github/workflows/ci.yml`: Node.js 22
- `netlify.toml`: Netlify build runtime 22
- `.nvmrc`: local development default 22

No application behavior, API contract, Firestore schema, rules, indexes, secrets, or stored data changes are part of this migration.

## Compatibility strategy

The Functions code remains CommonJS and is compiled by the existing TypeScript configuration. The dependency graph is intentionally unchanged so runtime compatibility can be isolated from package-upgrade risk.

The existing `firebase-functions` dependency warning is a separate maintenance concern. It should be handled in its own pull request with focused regression checks rather than bundled into the runtime migration.

### Dependency audit baseline

The clean Node.js 22 installs reported pre-existing lockfile debt:

- application: 130 advisories (`9 low`, `85 moderate`, `30 high`, `6 critical`);
- Functions: 22 advisories (`1 low`, `13 moderate`, `5 high`, `3 critical`).

This migration does not apply `npm audit fix --force` or alter the dependency graph. Dependency remediation needs a separate, reviewable maintenance pull request because forced upgrades can introduce breaking application and Firebase SDK changes.

## Verification gates

Before merge:

1. install Functions dependencies with Node.js 22;
2. run Functions typecheck and build;
3. require the full GitHub CI workflow on Node.js 22;
4. require the `studio-egonso` Netlify deploy preview.

After merge:

1. deploy all Functions from the exact merged commit;
2. verify all five application Functions are `ACTIVE` and report `nodejs22`;
3. verify the production web application remains available;
4. run a bounded, non-PII analytics request through the production API.

## Deployment

```bash
npm --prefix functions ci
npm --prefix functions run typecheck
npm --prefix functions run build
firebase deploy --only functions --project ai-act-compass-m6o05
```

## Rollback

Before Node.js 20 decommissioning, revert this migration commit and redeploy Functions to restore the previous runtime. This rollback is time-limited and must not become a reason to postpone a Node.js 22 compatibility fix. No data rollback is required.
