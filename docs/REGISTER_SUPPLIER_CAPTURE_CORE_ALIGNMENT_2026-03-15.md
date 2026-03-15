# Register Supplier Capture Core Alignment

Date: 2026-03-15

## Why

The supplier/request form had drifted away from the internal quick-capture flow:

- too much bespoke UI lived directly in the page component
- `Daten & Sensitivität` was visually heavier than the rest of the flow
- supplier identity (`email` + supplier organisation) was incomplete
- the external flow no longer felt like the same product language as quick capture

## Decision

- keep supplier submission as an external snapshot with preserved provenance
- do not clone the internal quick-capture form 1:1
- reuse the existing quick-capture field core for the shared capture rhythm:
  - purpose
  - systems
  - workflow relation
  - data sensitivity
- keep supplier-specific identity and risk estimation outside that shared core

## What Changed

1. Supplier form now starts with an identity block:
   - `supplierEmail`
   - `supplierOrganisation`
2. The capture core now reuses the quick-capture field component with a supplier-safe configuration:
   - no owner role
   - no internal contact person
   - no internal usage/decision section
   - same systems/workflow/data structure as internal capture
3. `Daten & Sensitivität` is now rendered through the shared accordion flow
4. AI Act risk estimation became an optional accordion
5. `supplierOrganisation` is stored in new submissions and used as the preferred actor/display name
6. Old supplier snapshots without `supplierOrganisation` remain readable
7. Data categories are now optional in supplier submissions, matching the lighter quick-capture posture

## Data Flow

1. Public supplier form submits:
   - `supplierEmail`
   - `supplierOrganisation`
   - systems/workflow
   - optional `dataCategory` / `dataCategories`
   - optional `aiActCategory`
2. `/api/supplier-submit` parses the payload with backward-compatible schema rules
3. The immutable external submission keeps the raw snapshot
4. When a supplier submission is turned into a register use case, provenance still points back to the external submission

## Risks

- `QuickCaptureFields` is now more configurable; regressions there would affect internal capture too
- supplier organisation is preserved in provenance and submission snapshots, but not mapped onto the internal `organisation` field of the use case card, which remains the register organisation
- the supplier flow is now much closer to quick capture, but still intentionally not identical

## Rollback

- revert the supplier page, supplier parser, and the quick-capture configuration additions
- old supplier snapshots remain readable because `supplierOrganisation` is optional in parsing
- removing the new organisation field from the UI would not invalidate already stored external submissions
