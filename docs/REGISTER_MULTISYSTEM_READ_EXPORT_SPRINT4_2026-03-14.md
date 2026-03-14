# Register Multisystem Read & Export Sprint 4

Date: 2026-03-14

## Why

Sprint 1 introduced the backward-compatible `workflow` shape.
Sprint 2 and 3 added capture for internal and supplier-facing intake.

Without Sprint 4, multi-system/API use cases could be stored, but many read and export surfaces would still behave as if only `toolId` / `toolFreeText` existed. That would create silent product inconsistency: capture knows more than board, detail, pass, proof-pack, and search.

## Scope

This sprint makes multi-system cases visible in:

- register detail
- register board
- use-case pass card
- pass page
- JSON/pass export
- proof-pack export/PDF
- timeline labels
- repository/public lookup readers that still searched or displayed only singular tool fields

## Key Decisions

1. Keep the model use-case-first.
   The new detail block is subordinate to the main use-case metadata and governance sections.

2. Do not introduce a pipeline builder.
   Editing supports add/remove/up/down plus save/cancel only.

3. Preserve singular compatibility fields.
   `toolId` / `toolFreeText` remain the primary mirror for old contracts, while read paths resolve an ordered system list from the card.

4. Prefer neutral wording.
   New read/export copy uses `Systeme` or `Ablauf & beteiligte Systeme`, not only `Tools`.

## Data Flow

1. Storage remains:
   - first system in `toolId` / `toolFreeText`
   - further systems in `workflow.additionalSystems[]`
   - optional relationship metadata in `workflow.connectionMode` / `workflow.summary`

2. Read surfaces resolve a derived ordered list via shared helpers:
   - `resolveUseCaseSystemEntries(...)`
   - `resolveUseCaseWorkflowDisplay(...)`
   - `getUseCaseSystemsSummary(...)`
   - `getUseCaseWorkflowBadge(...)`

3. Detail edit saves through `buildUseCaseWorkflowUpdates(...)`, which splits the ordered list back into:
   - singular compatibility fields
   - optional workflow extension

## Risks

- Some older contracts still expose singular names such as `tool` or `toolName`; these are kept for compatibility and now mirror the derived multi-system summary where possible.
- Additional systems that were stored only as raw ids may still fall back to ids if they are not present in the bundled registry catalog.
- The new detail editor is intentionally local-state-based and not yet covered by a browser integration test in this sprint.

## Rollback

- Storage is additive only; no migration or destructive rewrite is required.
- UI rollback is limited to removing the workflow section and helper-based read rendering.
- Existing singular fields remain intact, so old surfaces continue to work if Sprint 4 UI changes are reverted.
