# Register Card Model

Date: 2026-03-14

## Canonical Card Shape

All new register writes use the canonical `UseCaseCard` model:

- `cardVersion: "1.1"`
- `status`:
  - `UNREVIEWED`
  - `REVIEW_RECOMMENDED`
  - `REVIEWED`
  - `PROOF_READY`
- `origin`:
  - `source: "manual" | "access_code" | "supplier_request" | "import"`
  - `submittedByName`
  - `submittedByEmail`
  - `sourceRequestId`
  - `capturedByUserId`
- `manualEdits[]`:
  - `editId`
  - `editedAt`
  - `editedBy`
  - `editedByName`
  - `summary`
  - `changedFields[]`
- optional `workflow`:
  - `additionalSystems[]`
    - `entryId`
    - `position`
    - `toolId`
    - `toolFreeText`
  - `connectionMode: "MANUAL_SEQUENCE" | "SEMI_AUTOMATED" | "FULLY_AUTOMATED"`
  - `summary`
- optional `systemPublicInfo[]`:
  - `systemKey`
  - `toolId`
  - `toolFreeText`
  - `displayName`
  - `vendor`
  - `providerType`
  - `publicInfo`

Canonical writes are produced through the shared register-first builders and service layer. New writes must not emit `cardVersion: "1.0"` or unsupported status names such as `draft`.

## Multi-System Compatibility Shape

The register remains use-case-first. Multiple systems are stored as an optional workflow extension, not as a new top-level object:

- `toolId` / `toolFreeText` continue to represent the first selected system for backward compatibility
- `workflow.additionalSystems[]` stores only the further involved systems in order
- `workflow` may also carry optional relationship metadata (`connectionMode`, `summary`)

This intentionally avoids a raw `toolIds[]` primary model. Existing list, export, supplier, and public-capture paths can keep reading the primary system while newer flows resolve a full ordered system list from the card.

Compliance stays use-case-first as well, but no longer collapses the whole card onto one `Primärsystem`:

- `Ablauf & Systeme` keeps the execution order
- `systemPublicInfo[]` stores compliance research per deduplicated involved system
- duplicate workflow steps for the same system still map to one compliance object
- legacy `publicInfo` remains readable as a fallback for single-system or pre-sprint cards

Supplier and external-submission snapshots follow the same compatibility rule:

- `toolName` remains the singular-compatible mirror of the first supplier-entered system
- additional supplier-entered systems are stored in `workflow.additionalSystems[]`
- optional supplier relationship metadata is stored in `workflow.connectionMode` / `workflow.summary`
- supplier data categories are stored canonically in `dataCategories[]`
- `dataCategory` remains as legacy-compatible mirror of `dataCategories[0]`
- old supplier snapshots with only `toolName` remain valid and readable

The unified audit timeline is built from append-only signals where possible:

- `createdAt`
- `origin`
- `manualEdits[]`
- `statusHistory[]`
- `reviews[]`
- `proof.generatedAt`
- `sealedAt`
- linked `externalSubmissions` review outcomes

## Legacy Normalization

Legacy records are normalized at read time before schema validation. This is non-destructive: Firestore documents are not rewritten just by being read.

Normalized legacy aliases:

- `cardVersion`
  - `1.2` -> `1.1`
  - `v1.0` -> `1.0`
  - `v1.1` -> `1.1`
- `status`
  - `draft`, `new`, `created` -> `UNREVIEWED`
  - `review_required`, `needs_review` -> `REVIEW_RECOMMENDED`
  - `complete`, `completed`, `approved` -> `REVIEWED`
  - `ready_for_proof` -> `PROOF_READY`
- `usageContexts`
  - `CUSTOMER_FACING` -> `CUSTOMERS`
  - `EMPLOYEE_FACING` -> `EMPLOYEES`
  - `EXTERNAL_PUBLIC` -> `PUBLIC`
- `dataCategory`
  - `NONE` -> `NO_PERSONAL_DATA`
  - `INTERNAL` -> `INTERNAL_CONFIDENTIAL`
  - `PERSONAL` -> `PERSONAL_DATA`
  - `SENSITIVE` -> `SPECIAL_PERSONAL`
- `workflow`
  - connection-mode aliases are normalized into canonical values
  - additional systems are re-ordered into canonical positions
- `systemPublicInfo`
  - invalid or empty entries are dropped during read normalization
  - provider types are normalized into canonical values where possible

## Supplier / External Intake Safety

Broken historical supplier-created cards are normalized on read:

- invalid `cardVersion` / `status` values are mapped to canonical values
- supplier records with the old external-public placeholder are normalized to `usageContexts: ["INTERNAL_ONLY"]`
- `toolName` is mapped into canonical tool fields (`toolId: "other"`, `toolFreeText`)
- singular supplier `dataCategory` values are normalized into canonical `dataCategories[]`
- `origin` is derived from legacy `labels`, `capturedBy`, and `externalIntake` fields

The original provenance fields are preserved:

- `capturedBy`
- `capturedByName`
- `capturedViaCode`
- `accessCodeLabel`
- `externalIntake`

## Export Behavior

Export and pass/proof-pack generators now shape legacy cards into canonical v1.1 in memory when needed. This keeps list/detail/export flows working even when the stored document is older or was created by a broken legacy path.

Sprint 4 extends the read/edit surfaces around the same compatibility model:

- register detail keeps the use case primary and adds a subordinate section `Ablauf & Systeme`
- board/list surfaces show a compact multi-system badge instead of switching to a tool-first layout
- pass / JSON / PDF / proof-pack include a neutral workflow section only when multiple systems or relationship metadata exist
- search and public lookup readers resolve all ordered systems, not only the singular top-level mirror
- legacy-compatible singular fields such as `toolId`, `toolFreeText`, and `toolName` remain in place where external contracts still depend on them

## Feature Flag

Sprint 1 adds the dormant feature flag `ff_register_multisystem_capture` via:

- `NEXT_PUBLIC_REGISTER_FIRST_MULTISYSTEM_CAPTURE`
- `REGISTER_FIRST_MULTISYSTEM_CAPTURE`

Sprint 3 adds a separate supplier/public intake flag:

- `NEXT_PUBLIC_REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE`
- `REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE`

Both remain `false` by default until the corresponding capture surfaces are accepted.

Sprint 4 does not add another rollout flag. It reads the already stored optional `workflow` shape and keeps the new detail editor behind the existing multi-system capture acceptance path.

Sprint 5A adds no new rollout flag. It extends the detail-side compliance model additively:

- `publicInfo` remains as legacy fallback
- `systemPublicInfo[]` becomes the preferred read path for multi-system compliance
- detail UI deduplicates systems before compliance display or research

Sprint 5B keeps the supplier/public request flow slim while aligning the data taxonomy:

- supplier/request UI uses a compact multi-select for `Daten & Sensitivität`
- `dataCategories[]` becomes the canonical supplier payload field
- `dataCategory` remains the first-entry fallback for older contracts and readers
- `SPECIAL_PERSONAL` implies `PERSONAL_DATA` during normalization
