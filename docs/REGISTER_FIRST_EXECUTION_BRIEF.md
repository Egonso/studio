# Register First Execution Brief

## Purpose

Implement Register First safely, with preview-first delivery and a stable production `main`.

## Confirmed Decisions

1. Product strategy: **Hybrid Entry** + **status-driven output**
2. Hybrid Entry:
   - Shortcut-first
   - In-app fallback entry
   - Sticky launcher optional (default off)
3. Status model:
   - `UNREVIEWED` (default)
   - `REVIEW_RECOMMENDED`
   - `REVIEWED`
   - `PROOF_READY`
4. No automated governance decisions:
   - no forced auto-review
   - no auto-escalation
   - no auto-policy generation
5. Capture text flow:
   - use proposed flow
   - exception: step 3 label stays original: **"Bist du aktuell dafür verantwortlich?"**

## Delivery Safety Rules

1. Never ship directly to `main`.
2. Build on `codex/*` feature branches.
3. Deploy and validate on preview/staging first.
4. Merge to `main` only after acceptance.
5. Keep large new functionality behind feature flags.

## Current GitHub State

- Feature branch: `codex/register-first-foundation`
- PR created: https://github.com/Egonso/studio/pull/4
- Added files in PR:
  - `docs/GIT_PREVIEW_RELEASE_FLOW.md`
  - `scripts/setup_github_branch_protection.sh`

## Important Constraint

Branch protection on `main` cannot be enforced by a non-admin token.
Current account has `write` permission, not `admin`.

Use an admin account to run:

```bash
cd /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio
./scripts/setup_github_branch_protection.sh Egonso/studio main
```

## Suggested Implementation Sequence

1. ADR finalize (Register First as product core).
2. Domain model freeze for Register v1.
3. Register service + data model implementation.
4. Register UI route (`/register`) as standalone module.
5. Quick Capture v1 implementation.
6. Hybrid entry integration.
7. Status-gated output.
8. Dashboard/header integration.
9. Rules/indexes hardening and QA.

## Definition of Done (per PR)

- Single clear scope
- `lint` and `typecheck` green
- tests for changed behavior
- updated documentation in `docs/`
- no hidden breaking changes
- rollback strategy documented

