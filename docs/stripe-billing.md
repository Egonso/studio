# Stripe Billing

## Canonical flow
- Free users start the paid upgrade from `/settings?section=governance#upgrade-panel`.
- The upgrade surface offers `Monatlich` and `Jährlich`.
- The app creates a hosted Stripe Checkout Session through `POST /api/billing/checkout`.
- Governance Pro resolves the correct monthly or yearly tier from the actual workspace/register volume:
  - `5 User / 50 Einsatzfälle`
  - `10 User / 100 Einsatzfälle`
  - `15 User / 150 Einsatzfälle`
  - `20 User / 200 Einsatzfälle`
  - counted users: only workspace members with status `active`
  - counted use cases: all non-deleted use cases in the active register or linked workspace scope
- Stripe returns to `/settings?section=governance&checkout_session_id=...#upgrade-panel`.
- The settings screen runs the existing entitlement sync and applies the paid plan to the workspace and linked registers.
- Paid users manage subscriptions through `POST /api/billing/portal`.

## Canonical entitlement mapping
- `governance_control_center` -> `pro`
- `enterprise_suite` -> `enterprise`
- `free_register` -> `free`

Checkout metadata writes the canonical billing hints:
- `plan`
- `billingProductKey`
- `productId`
- `sourceApp`
- `sourceFlow`
- `userId`
- `userEmail`
- `billingInterval`
- `governanceTierId`
- `governanceTierLookupKey`
- `governanceTierUsers`
- `governanceTierUseCases`

## Required server environment variables
- `STRIPE_SECRET_KEY`

## Optional server environment variables
- `STRIPE_API_KEY`
  Compatibility fallback for older deployments. Prefer `STRIPE_SECRET_KEY`.
- `STRIPE_PRODUCT_GOVERNANCE_CONTROL_CENTER`
  Optional existing Stripe Product ID. If omitted, the sync script can create or reuse the canonical product by name and metadata.
- `STRIPE_PRICE_GOVERNANCE_PRO_050_005_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_050_005_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_100_010_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_100_010_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_150_015_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_150_015_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_200_020_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_200_020_YEARLY`
  Optional explicit price IDs. The app can otherwise discover active prices by Stripe `lookup_key`.
- `STRIPE_PRICE_ENTERPRISE`
  Enables a direct enterprise checkout. Without it, enterprise stays sales-led.
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
  Uses a specific Stripe Customer Portal configuration when present.
- `STRIPE_WEBHOOK_SECRET`
  Required for production webhook verification in Firebase Functions.

## Public environment variables
- `NEXT_PUBLIC_APP_ORIGIN`
  Required so Checkout and Customer Portal return to the correct public app URL.

## Netlify names
Use these exact variable names in Netlify:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRODUCT_GOVERNANCE_CONTROL_CENTER`
- `STRIPE_PRICE_GOVERNANCE_PRO_050_005_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_050_005_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_100_010_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_100_010_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_150_015_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_150_015_YEARLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_200_020_MONTHLY`
- `STRIPE_PRICE_GOVERNANCE_PRO_200_020_YEARLY`
- `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `NEXT_PUBLIC_APP_ORIGIN`

Add `STRIPE_WEBHOOK_SECRET` in the Functions/runtime environment that receives Stripe webhooks.

## Canonical lookup keys
- `governance-control-5-users-50-usecases-monthly`
- `governance-control-5-users-50-usecases-yearly`
- `governance-control-10-users-100-usecases-monthly`
- `governance-control-10-users-100-usecases-yearly`
- `governance-control-15-users-150-usecases-monthly`
- `governance-control-15-users-150-usecases-yearly`
- `governance-control-20-users-200-usecases-monthly`
- `governance-control-20-users-200-usecases-yearly`

## Safe provisioning
- Use `node ./scripts/sync-stripe-governance-pricing.mjs` to create or verify the canonical Governance Control Center product and all recurring prices.
- The script is idempotent for matching prices.
- If an existing price with the same lookup key has a mismatched amount or interval, the script stops and asks for manual review instead of silently mutating live billing objects.
- Free product CTAs should route to `/settings?section=governance#upgrade-panel`, not directly to an external payment link.

## Security notes
- Never commit live Stripe keys into the repository.
- Prefer hosted Stripe Checkout and Customer Portal over custom billing forms.
- Billing access is server-authenticated through Firebase ID tokens.
- Entitlements are derived from canonical billing records, not from manual Firestore flags.

## Safe testing
- Use Stripe test mode for full end-to-end payment confirmation.
- If only live keys are available, limit testing to:
  - session creation
  - redirect handling
  - customer portal access
  - webhook signature/config validation
- Do not complete real charges just to validate application wiring.
