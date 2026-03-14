# Register Supplier Data Taxonomy Sprint 5B

Date: 2026-03-14

## Why

The supplier/request flow still captured only one `dataCategory`, while the
internal register and quick-capture logic already support multiple data
categories. That lost information exactly in cases where suppliers need to
signal more than one sensitivity level.

## Decision

- Keep the supplier flow compact
- Replace the singular supplier data select with a small multi-select block
- Store supplier data canonically in `dataCategories[]`
- Keep `dataCategory` as legacy-compatible mirror of `dataCategories[0]`
- Preserve old snapshots with only singular `dataCategory`

## Data Flow

1. Supplier UI now sends `dataCategories[]` and mirrors the first entry into
   legacy `dataCategory`
2. `/api/supplier-submit` accepts both fields
3. `parseSupplierRequestSubmission()` normalizes both paths into canonical
   `dataCategories[]`
4. `SPECIAL_PERSONAL` implies `PERSONAL_DATA`
5. Use-case creation and external-submission takeover persist both
   `dataCategories[]` and legacy `dataCategory`

## Differences To Internal Capture

- The supplier form stays intentionally slimmer than internal quick capture
- It uses the same main taxonomy values, but does not expose the full internal
  subcategory editor
- That keeps the external request flow understandable while staying semantically
  compatible with the internal model

## Risks

- Old external readers may still look only at singular `dataCategory`
- Because the supplier flow remains slimmer than the internal one, very fine
  subcategories still need internal enrichment later if required

## Rollback

- This sprint is additive and backward compatible
- Reverting it means switching the supplier UI back to singular selection and
  removing the new parser path for `dataCategories[]`
- Existing snapshots with `dataCategories[]` stay readable because the legacy
  fallback path remains in place
