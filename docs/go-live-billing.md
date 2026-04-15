# Billing Go-Live Checklist

## Scope
- Hosted Stripe Checkout for `Governance Control Center`
- Stripe Customer Portal for paid customers
- Canonical entitlement sync into workspace/register model
- Netlify deployment for the Next.js app
- Webhook handling in the runtime that processes Stripe events

## Live Stripe status
- Canonical product exists: `KI-Register Governance Control Center`
- Canonical recurring lookup keys exist:
  - `governance-control-5-users-50-usecases-monthly`
  - `governance-control-5-users-50-usecases-yearly`
  - `governance-control-10-users-100-usecases-monthly`
  - `governance-control-10-users-100-usecases-yearly`
  - `governance-control-15-users-150-usecases-monthly`
  - `governance-control-15-users-150-usecases-yearly`
  - `governance-control-20-users-200-usecases-monthly`
  - `governance-control-20-users-200-usecases-yearly`
- The app can discover these prices by `lookup_key`, so explicit price IDs are optional.

## Netlify environment variables
Set these in the Netlify site that serves the Next.js app:

### Required
- `NEXT_PUBLIC_APP_ORIGIN`
- `STRIPE_SECRET_KEY`

### Recommended
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `NEXT_PUBLIC_ENTERPRISE_CONTACT_URL`

### Optional explicit overrides
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
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ENTERPRISE`

## Firebase Admin runtime variables
Set one of the supported Firebase Admin credential variants in the server runtime:

### Preferred JSON bundle
- `FIREBASE_SERVICE_ACCOUNT_KEY`
or
- `FIREBASE_SERVICE_ACCOUNT_JSON`
or
- `FIREBASE_ADMIN_SERVICE_ACCOUNT`

This is the preferred Netlify setup. A single JSON service-account payload is less fragile than splitting the private key across separate variables.

### Split credential fallback
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Only use the split fallback when you cannot store the JSON bundle. The private key must remain a valid PEM, typically with literal `\n` escapes, or Firebase Admin will fall back and log a warning.

## Webhook runtime variables
Set these where Stripe webhooks are processed:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Stripe webhook events
Subscribe the endpoint to:
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

## Publish sequence
1. Deploy the Next.js app with the Netlify variables above.
2. Confirm `NEXT_PUBLIC_APP_ORIGIN` matches the real public domain.
3. Configure the Stripe webhook endpoint against the runtime that handles Stripe events.
4. Set `STRIPE_WEBHOOK_SECRET` in that runtime.
5. Open `/settings?section=governance#upgrade-panel` with a free account.
6. Verify monthly and yearly checkout creation.
7. Verify Stripe Customer Portal opens for a paid account.
8. Complete one real payment only if you explicitly want a live charge test.
9. After the first real payment, confirm entitlement sync updated:
   - workspace entitlement
   - linked register entitlement
   - premium navigation unlock

## Smoke test checklist
- Free signup works.
- Free register can create and edit a use case.
- Free register can open Governance settings.
- Free upgrade CTA opens hosted Stripe Checkout.
- Paid account can open Customer Portal.
- Paid account can open:
  - `/control`
  - `/control/reviews`
  - `/control/policies`
  - `/control/exports`
  - `/control/trust`
  - `/academy`
- External inbox remains visible after plan changes.

## Important behavior
- Free upgrade CTAs route to `/settings?section=governance#upgrade-panel`.
- Tier selection is determined server-side from actual active volume.
- Checkout metadata carries canonical entitlement hints.
- Manual Firestore edits are not required for premium unlocks.

## Not a product blocker
- Local builds can warn about `ENOSPC` when the development machine is nearly full. That is a local disk issue, not a deployment issue.
- If production logs a Firebase Admin fallback warning, first verify that `FIREBASE_SERVICE_ACCOUNT_JSON` is present and parseable. If you are using split vars instead, re-save `FIREBASE_ADMIN_PRIVATE_KEY` as a valid PEM or replace the split setup with the JSON bundle.
