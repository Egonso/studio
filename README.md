# KI Register

KI Register is a register-first governance product for documenting real AI use cases, assigning human responsibility, recording review status, and producing scoped evidence such as the Use-Case Pass.

The primary activation outcome is not an account or an empty workspace. It is the first real AI use case captured with a clear next human-owned action.

## Product boundaries

- The AI use case is the primary record.
- Quick Capture keeps the first documentation step intentionally small.
- Assistive features may suggest structure, but they do not make governance or legal decisions.
- The Use-Case Pass is a scoped evidence artifact, not a conformity guarantee or legal advice.
- EUKIGesetz provides the stronger education entry; KI Register provides the operational register and follow-up workflow.

## Production systems

| Surface | Production source |
| --- | --- |
| Web application | [kiregister.com](https://kiregister.com), deployed by the Netlify project `studio-egonso` from `main` |
| Firebase project | `ai-act-compass-m6o05` |
| Cloud Functions | Firebase Functions on Node.js 22 |
| Database and auth | Firestore and Firebase Authentication |
| Course entry | [eukigesetz.com/erlebnis](https://eukigesetz.com/erlebnis/) |

`studio-egonso` is the only production Netlify project for this repository. Do not create or link a second Netlify project to work around account or CLI access. The obsolete duplicate project `pumuckels` was deleted on 2026-07-17.

## Architecture

| Layer | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 18, TypeScript |
| UI | Tailwind CSS and Radix-based components |
| Backend | Firebase Functions v1/v2 |
| Runtime | Node.js 22 for CI, Netlify builds, and Firebase Functions |
| Data | Firestore |
| Payments | Stripe |
| Hosting | Netlify for the web app; Firebase for backend resources |

The data model and query rules are documented in [docs/DATA_MODEL_AND_QUERIES.md](docs/DATA_MODEL_AND_QUERIES.md). Manual Firebase actions belong in [docs/manual_steps.md](docs/manual_steps.md).

## Repository map

- `src/app/` — Next.js routes and server endpoints
- `src/components/` — application and governance UI
- `src/lib/register-first/` — register-first contracts and workflow logic
- `src/lib/analytics/` — bounded, privacy-preserving product funnel events
- `functions/` — Stripe, email, supplier reminder, and public-information functions
- `docs/` — architecture, release, and operating documentation
- `agent-kit/` — portable use-case documentation toolkit

## Local development

Use Node.js 22. The repository includes `.nvmrc` for compatible version managers.

```bash
nvm use
npm ci
npm --prefix functions ci
npm run dev
```

The default development server runs on port `9002`. If Turbopack stalls locally, use:

```bash
npm run dev:compat
```

## Verification

Run the full application gate before a release:

```bash
npm run check
```

Useful narrower checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm --prefix functions run typecheck
npm --prefix functions run build
```

## Release workflow

1. Work on a `codex/*` feature branch.
2. Push the branch and review the Netlify deploy preview.
3. Require green CI before merging into `main`.
4. Merge through a pull request; do not develop directly on `main`.
5. Verify the production domain after Netlify publishes the merge.
6. Deploy Firebase resources separately when Functions, rules, or indexes changed.

See [docs/GIT_PREVIEW_RELEASE_FLOW.md](docs/GIT_PREVIEW_RELEASE_FLOW.md) for the complete release gates.

### Deploy Functions

The Functions runtime is pinned in both `functions/package.json` and `firebase.json`; `firebase.json` is authoritative for Firebase CLI deployments.

```bash
npm --prefix functions ci
npm --prefix functions run typecheck
npm --prefix functions run build
firebase deploy --only functions --project ai-act-compass-m6o05
```

After deployment, verify all five application functions report `nodejs22` and `ACTIVE`. Runtime migration details and rollback are recorded in [docs/NODE22_RUNTIME_MIGRATION_2026-07-17.md](docs/NODE22_RUNTIME_MIGRATION_2026-07-17.md).

## Privacy and governance

- Product funnel events accept only strict event names and bounded payloads.
- Form text, names, email addresses, and raw user/session/workspace identifiers are not stored in analytics collections.
- Session, user, workspace, and trusted external references are hashed before storage.
- Analytics failures must not block capture, review, supplier processing, checkout, or export.
- No automated status change may be presented as a human governance decision.

## Agent-assisted documentation

Use the repository wrapper for documented agent-kit flows:

```bash
npm run studio:agent -- onboard
npm run studio:agent -- capture
npm run studio:agent -- validate <manifest>
```

Local working notes belong in `private-docs/`, which is intentionally excluded from version control.
