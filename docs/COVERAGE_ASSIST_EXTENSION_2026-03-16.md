# Coverage Assist Extension (Phase 1)

## Scope

This slice keeps the browser extension intentionally thin:

- local host match only
- explicit opt-in on the device
- quiet icon signal instead of push or overlay
- deep-link into Studio for the actual review step

The extension does **not** ask the contextual capture question itself.

## Privacy Boundary

Phase 1 extension logic is limited to:

- checking the active tab host against a bundled detection file
- storing a local opt-in flag
- storing locally dismissed tool ids

It does **not**:

- read browsing history
- inspect page contents
- send detection events to the server

## Technical Note

The extension is loaded from `extensions/ki-register-quick-capture/` as its own package root.

Because of that, it cannot directly read `src/data/coverage-assist-detection.json` at runtime. Phase 1 therefore uses a bundled snapshot file inside the extension folder:

- `extensions/ki-register-quick-capture/coverage-assist-detection.json`

That duplication is deliberate technical debt for Phase 1 and should be replaced later by a build-sync step.

## Rollback

Rollback is simple:

1. remove `default_popup` from the manifest
2. remove popup files
3. keep `background.js` on the old quick-capture-only flow
4. leave the Studio-side contracts untouched
