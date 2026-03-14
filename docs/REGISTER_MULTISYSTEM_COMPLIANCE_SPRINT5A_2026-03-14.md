# Register Multisystem Compliance Sprint 5A

Date: 2026-03-14

## Why

`Primärsystem & Compliance` was too narrow once a use case can involve multiple
systems, APIs, models, or connectors. The sequence still belongs to
`Ablauf & Systeme`, but compliance research should work on the deduplicated set
of involved systems.

## Decision

- Keep the use case as the primary object
- Keep `workflow` as the ordered system list
- Add optional `systemPublicInfo[]` to store compliance research per unique
  involved system
- Keep legacy `publicInfo` readable as fallback for older and single-system
  cards
- Do not introduce a new top-level object and do not auto-derive governance
  decisions from researched data

## Data Flow

1. `resolveUniqueSystemsForCompliance(card)` derives a deduplicated system list
   from top-level system fields plus `workflow.additionalSystems`
2. The detail UI renders compliance per unique system instead of per workflow
   step
3. Compliance checks still use the existing `/api/tools/public-info-check`
   endpoint one system at a time
4. Successful results are persisted into `systemPublicInfo[]`
5. The primary system result is also mirrored into legacy `publicInfo` when
   available, so older readers remain useful

## Risks

- `publicInfo` and `systemPublicInfo[]` can temporarily diverge if older update
  paths only write the legacy field
- Tool identity is not perfect because some UI paths still store product names
  in `toolId`; deduplication is therefore best-effort, not mathematically exact
- The detail UI now owns bulk orchestration in the client instead of a separate
  bulk API, which keeps the slice small but is not the final scalability shape

## Rollback

- The change is additive: existing cards remain valid
- Reverting this sprint means removing `systemPublicInfo[]` readers/writers and
  falling back to legacy `publicInfo`
- No destructive migration is required because old data is left untouched
