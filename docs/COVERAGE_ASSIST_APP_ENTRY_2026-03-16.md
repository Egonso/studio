# Coverage Assist App Entry (2026-03-16)

## Why

Phase 1 needs one narrow step between browser detection and `QuickCaptureModal`.
If the app opens directly with a blank form, the assist feels weak. If it opens with a
finished use case, the product drifts into false automation. The app entry keeps the
user in control while reducing the most obvious friction.

## Flow

1. `/capture` reads the Coverage Assist query contract.
2. The assist step is enabled only when:
   - the pilot rollout gate is fully enabled
   - the assist query is valid
   - the detected `toolId` resolves against the shipped tool catalog
3. The app shows:
   - detected tool name
   - transparency text
   - up to four seed suggestions from the Phase-1 seed library
   - custom purpose fallback
   - tool-only fallback
4. Only after a user action does `QuickCaptureModal` open with `initialDraft`.

## Persistence rule

- Confirmed captures stay human-created.
- `origin.source` is not extended for Coverage Assist.
- Coverage Assist is persisted only as additive `assistContext`.
- No suggestion collection is created in Phase 1.

## Fallback rules

- Invalid assist query: fall back to the existing `/capture` flow.
- Unknown tool: fall back to the existing `/capture` flow.
- Tool without seed suggestions: keep tool prefilled and let the user continue with custom or blank purpose.

## Analytics

- `assist_signal_shown` when the extension first shows a quiet signal for a detected tool
- `assist_entry_shown` when the app-side entry becomes visible
- `assist_suggestion_selected` when a seed is chosen
- `assist_dismissed` when seed suggestions are skipped
- `assist_saved` when a human-confirmed capture is stored

All analytics stay local and lightweight in Phase 1.

## Rollback

- Keep the feature flags at `false`.
- Or remove the `/capture` assist entry branch and let `/capture` ignore assist query params again.
