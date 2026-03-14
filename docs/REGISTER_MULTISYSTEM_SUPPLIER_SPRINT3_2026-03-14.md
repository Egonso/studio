# Register Multisystem Supplier Sprint 3

Date: 2026-03-14

## Goal

Extend the multisystem/API capture model into supplier-request and external-submission flows without creating a second object model.

The register stays use-case-first:

- no new top-level `automation` object
- no tool-first supplier builder
- no shadow logic between internal capture and external submissions
- no automated governance decisions derived from workflow metadata

## What Changed

- supplier submissions can now describe multiple involved systems while staying singular-compatible
- the first supplier-entered system still mirrors into `toolName`
- further supplier-entered systems are normalized into `workflow.additionalSystems[]`
- optional supplier relationship metadata is stored in:
  - `workflow.connectionMode`
  - `workflow.summary`
- external-submission readers now resolve ordered systems from supplier and access-code snapshots
- inbox and enterprise views now summarize multisystem submissions compactly
- separate supplier feature flag scaffold added:
  - `NEXT_PUBLIC_REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE`
  - `REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE`

## Why Not A Separate Supplier Model

A separate supplier-only multisystem shape would immediately drift away from the canonical card model:

- review and merge paths would need one-off mapping logic
- inbox readers would branch on source type instead of reading a shared workflow shape
- later exports and pass views would inherit avoidable snapshot differences

By keeping the first system mirrored in `toolName` and using `workflow` for the rest, old supplier snapshots remain readable while new submissions already fit the canonical register-first semantics.

## Supplier Capture Differences

The supplier/public form stays deliberately slimmer than the internal quick capture:

- free-text systems instead of catalog autocomplete
- first system remains required
- additional systems are optional and additive
- the relationship block only appears once 2+ systems are provided

This keeps the public supplier flow lightweight while preserving the same storage semantics as internal capture.

## Data Flow

1. Supplier form submits `toolName` plus optional ordered `systems[]`
2. Server parser normalizes systems and optional relationship metadata
3. First system stays mirrored in `toolName`
4. Additional systems are stored in `workflow.additionalSystems[]`
5. External submission snapshot stays immutable
6. Review / merge creates a canonical use case card with the same `workflow`
7. Inbox and enterprise readers reconstruct a compact ordered-system summary from the snapshot

## Risks

- Supplier UI still uses free-text system names, so registry-level product resolution is deferred
- Search now includes system summaries, but deeper workflow-object search is still intentionally simple
- The supplier flag is separate from the internal multisystem flag, so rollout needs explicit coordination
- Some older control/export surfaces outside the external-submission path may still render only the first system until later read-surface slices

## Rollback

- disable supplier multisystem capture via `ff_supplier_multisystem_capture`
- old supplier submissions with only `toolName` continue to work unchanged
- the new `workflow` payload remains additive, so rollback does not require data migration
