# Coverage Assist Foundations (Phase 1)

## Scope

This slice introduces only the foundations for personal Coverage Assist in Phase 1:

- typed detection entries for local browser matching
- typed seed suggestions for future assisted prefill
- a strict query contract for `/capture?assist=coverage`
- additive `assistContext` persistence on the canonical Use Case Card
- feature flags defaulted to `false`
- a lightweight local analytics contract

This slice does **not** ship a complete UI flow, server-side suggestion inbox, or any automated creation of Use Case Cards.

## Data Boundaries

Coverage Assist is deliberately separated into three layers:

1. `src/data/coverage-assist-detection.json`
   Local tool/domain detection hints for the browser extension.
2. `src/data/coverage-assist-seed-library.json`
   Curated human-facing seed suggestions for the assist step.
3. `src/lib/coverage-assist/*`
   Pure contracts and helpers for matching, capture-link building, and persisted assist context.

The seed library is intentionally starter-grade and curated. It is not treated as governance truth.

## Persistence Rule

Confirmed Use Cases remain human-created. The canonical origin stays unchanged (`manual`, `access_code`, `supplier_request`, `import`).

Coverage Assist metadata is stored only as additive `assistContext` on the Use Case Card:

- `assist = "coverage"`
- assist source
- detected tool id
- matched host/path
- optional seed suggestion reference

There is no separate suggestion collection and no autonomous write path.

## Analytics Rule

Coverage Assist analytics follow the same lightweight local-storage pattern as Control analytics:

- `assist_signal_shown`
- `assist_entry_shown`
- `assist_suggestion_selected`
- `assist_custom_purpose_used`
- `assist_dismissed`
- `assist_saved`
- `assist_disabled`

The contract stores aggregate event payloads only. It does not persist browsing history.

## Feature Flags

Phase 1 foundations are gated behind three flags, all defaulting to `false`:

- `coverageAssistPhase1`
- `coverageAssistExtension`
- `coverageAssistSeedLibrary`

## Migration and Rollback

Data impact is additive only:

- no backfill required
- no new collection required
- no new `UseCaseOriginSource`

Rollback is straightforward:

1. keep the feature flags off
2. ignore `assistContext` on read paths if needed
3. remove the additive field in a later cleanup once no writer depends on it
