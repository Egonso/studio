# Register Card Model

Date: 2026-03-12

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

Canonical writes are produced through the shared register-first builders and service layer. New writes must not emit `cardVersion: "1.0"` or unsupported status names such as `draft`.

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

## Supplier / External Intake Safety

Broken historical supplier-created cards are normalized on read:

- invalid `cardVersion` / `status` values are mapped to canonical values
- supplier records with the old external-public placeholder are normalized to `usageContexts: ["INTERNAL_ONLY"]`
- `toolName` is mapped into canonical tool fields (`toolId: "other"`, `toolFreeText`)
- `origin` is derived from legacy `labels`, `capturedBy`, and `externalIntake` fields

The original provenance fields are preserved:

- `capturedBy`
- `capturedByName`
- `capturedViaCode`
- `accessCodeLabel`
- `externalIntake`

## Export Behavior

Export and pass/proof-pack generators now shape legacy cards into canonical v1.1 in memory when needed. This keeps list/detail/export flows working even when the stored document is older or was created by a broken legacy path.
