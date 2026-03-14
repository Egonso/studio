# Register Multisystem Core Sprint 1

Date: 2026-03-14

## Goal

Add a backward-compatible core for multi-system capture without changing the visible capture UI yet.

The register stays use-case-first:

- no new top-level object `automation`
- no raw `toolIds[]` primary model
- no automated governance decisions derived from workflow metadata

## What Changed

- `UseCaseCard` and `CaptureInput` now support optional `workflow`
- `workflow.additionalSystems[]` stores additional involved systems in order
- `connectionMode` and `summary` can be stored alongside the additional systems
- central helpers now resolve and split ordered systems:
  - `resolveOrderedSystemsFromCard(card)`
  - `splitOrderedSystemsForStorage(orderedSystems, options)`
- read-time normalization canonicalizes workflow metadata and additional-system ordering
- new feature flag scaffold added:
  - `NEXT_PUBLIC_REGISTER_FIRST_MULTISYSTEM_CAPTURE`
  - `REGISTER_FIRST_MULTISYSTEM_CAPTURE`

## Why Not `toolIds[]`

A raw `toolIds[]` primary model would force too many downstream changes at once:

- list and detail surfaces still read `toolId/toolFreeText`
- pass/export/proof-pack still assume one primary system
- supplier/public intake snapshots still serialize singular tool fields
- search, migration, and repository paths already normalize around the current primary-system shape

Keeping the first system mirrored in `toolId/toolFreeText` lets later UI sprints add multiple systems without breaking existing readers immediately.

## Data Flow

1. Capture input may include optional `workflow`
2. Builder writes a canonical `1.1` card
3. Primary system stays in top-level `toolId/toolFreeText`
4. Additional systems and optional relationship metadata live in `workflow`
5. Read paths normalize workflow into canonical ordering before schema validation

## APIs Are Included

The technical fields still use `toolId/toolFreeText` for compatibility, but the semantics are broader:

- SaaS tools
- APIs
- models
- connectors / automation platforms
- internal services

## Risks

- Some read surfaces still only render the primary system until later UI sprints adopt the ordered-system helpers
- Supplier/public/external-submission flows are not UI-upgraded in this sprint
- Existing exports are not yet enriched with workflow details in this sprint

## Rollback

- Disable future UI usage via `ff_register_multisystem_capture`
- The stored `workflow` field is additive and optional, so older readers keep functioning on the primary system fields
- Reverting this sprint only requires removing the additive schema/types/helper support; no destructive migration is needed
