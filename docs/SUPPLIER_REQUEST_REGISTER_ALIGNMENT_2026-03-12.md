# Supplier Request Register Alignment

Date: 2026-03-12

## Problem

The public supplier request flow already existed, but `src/app/api/supplier-submit/route.ts` wrote a hand-built Firestore document instead of a real `UseCaseCard`.

Observed inconsistencies in the old write path:

- `cardVersion: "1.2"` even though the validated register schema only accepts `"1.0"` and `"1.1"`.
- `status: "draft"` even though the register status model only accepts `UNREVIEWED`, `REVIEW_RECOMMENDED`, `REVIEWED`, `PROOF_READY`.
- Semantically wrong defaults such as `usageContexts: ["EXTERNAL_PUBLIC"]` based on transport channel rather than register meaning.
- No shared normalization with the existing record-of-truth builder (`prepareUseCaseForStorage`).

Result: supplier submissions could exist in Firestore while drifting away from the validated register card contract. That was both a visibility problem and a data-quality / stability problem.

## Decision

Supplier requests remain normal register use cases.

Why this path was chosen:

- The existing register card already has the required truth fields for status, timestamps, tool name, organisation, review hints, and governance assessment.
- The existing generic `labels` array is sufficient to mark origin without inventing a shadow structure.
- A separate supplier request model would duplicate status handling, rendering, filtering, and long-term migration work without clear business gain.

Implemented origin markers:

- `labels: [{ key: "source", value: "supplier_request" }]`
- `labels: [{ key: "supplier_email", value: "<mail>" }]`

## New Storage Path

`supplier-submit` now creates cards through `createSupplierRequestUseCase(...)`, which wraps the shared builder and validates input before writing.

Storage behavior now:

- Builds a real schema-compatible `UseCaseCard`
- Uses `toolId: "other"` and `toolFreeText` for supplier-provided tool names
- Uses `status: "UNREVIEWED"` from the existing status flow
- Stores the supplier contact via labels and keeps the card in the normal register collection
- Sanitizes the payload before Firestore write

Important default:

- `usageContexts` is currently normalized to `["INTERNAL_ONLY"]`

Reason:

- The public supplier form does not currently ask for the real Wirkungsbereich.
- The previous `EXTERNAL_PUBLIC` default encoded the transport channel, not the domain meaning.
- `INTERNAL_ONLY` is the least expansive assumption within the existing schema, and the card is explicitly marked with a review hint so register users can correct it.

## Register Display / Filter Logic

The register board now exposes supplier submissions without creating a second product surface.

Implemented UI behavior:

- Supplier cards are visible in the normal board with a small `Lieferantenanfrage` badge
- A dedicated document filter `supplier_requests` exposes a quiet supplier subview
- The supplier subview shows:
  - tool / request
  - supplier contact
  - created date
  - current register status
  - risk class
- The register header shows a supplier-request count and links into the filtered view

The board still renders the same underlying `UseCaseCard` objects. No parallel read model was introduced.

## Existing Data Risks

This change does not automatically migrate old supplier submissions that were already written with invalid card values.

Known risk for old data:

- Existing cards with `cardVersion: "1.2"` or `status: "draft"` remain historical debt
- Client-side typed reads may fail on those records if they are loaded through strict parsers
- Search and filtering now work better for supplier cards because tool fields and label values are included, but invalid legacy cards still need cleanup

Recommended follow-up if legacy data exists:

1. Identify supplier-origin cards with label `source=supplier_request`
2. Detect invalid `cardVersion` / `status` values
3. Rewrite them through the same normalization helper or a one-off migration script

## Rollback

If rollback is required:

1. Revert the supplier-request helper and board filter UI
2. Restore the previous `supplier-submit` route

Rollback risk:

- Reintroducing the old route will also reintroduce schema drift on every new submission
- Cards already written by the new path remain valid register cards and do not require rollback-side data conversion

## Files

- `src/app/api/supplier-submit/route.ts`
- `src/lib/register-first/supplier-requests.ts`
- `src/components/register/register-board.tsx`
- `src/components/register/governance-header.tsx`
- `src/lib/register-first/register-repository.ts`
- `src/lib/register-first/repository.ts`
