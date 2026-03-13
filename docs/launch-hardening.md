# Launch Hardening

## Register Scope
- Canonical register scope is `personal` or `workspace:{orgId}`.
- Registers remain stored under `users/{ownerId}/registers/{registerId}`.
- Workspace access resolves the physical owner path through the register repository and `workspaceId`.
- New workspace-scoped registers are created under the creating actor's user document with `workspaceId = orgId`.
- Workspace linking is completed through `POST /api/workspaces/[orgId]/registers/link`.
- Active/default register state is stored per scope:
  - `personal`
  - `workspace:{orgId}`

## Build And CI Gates
- `next.config.ts` no longer suppresses TypeScript or ESLint failures during build.
- `tsconfig.json` no longer depends on pre-existing `.next/types` artifacts for `npm run typecheck`.
- Next.js build-time route typing is isolated in `tsconfig.next.json`, which is referenced through `next.config.ts`.
- The canonical verification command is `npm run check`.
- GitHub Actions CI continues to run:
  - `typecheck`
  - `lint`
  - `test`
  - `build`

## Legacy Isolation
- Canonical routes remain defined in `src/lib/navigation/route-manifest.ts`.
- Deprecated routes continue to redirect through the manifest alias map.
- Legacy routes are classified in `LEGACY_ROUTE_INVENTORY` with one of:
  - `archive`
  - `keep_isolated`
  - `migrate`
- Current default posture is isolation-first:
  - public users and signed-in users stay on canonical register/control routes
  - legacy project-era pages stay redirected or isolated until their data-service dependencies are retired
