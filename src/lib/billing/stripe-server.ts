import Stripe from 'stripe';

import { buildPublicAppUrl } from '@/lib/app-url';
import {
  getGovernanceLookupKey,
  type GovernanceBillingInterval,
  type GovernanceVolumeTier,
} from '@/lib/billing/governance-volume-pricing';

export const STRIPE_API_VERSION =
  '2026-02-25.clover' as Stripe.LatestApiVersion;

export type StripeBillingPlan = 'pro' | 'enterprise';

export interface StripeBillingConfiguration {
  secretKey: string | null;
  enterprisePriceId: string | null;
  billingPortalConfigurationId: string | null;
  governancePriceIdsByLookupKey: Record<string, string>;
}

function normalizeEnvValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function resolveStripeSecretKey(): string | null {
  return (
    normalizeEnvValue(process.env.STRIPE_SECRET_KEY) ??
    normalizeEnvValue(process.env.STRIPE_API_KEY)
  );
}

export function resolveStripeBillingConfiguration(): StripeBillingConfiguration {
  const governancePriceIdsByLookupKey = Object.fromEntries(
    [
      [
        'governance-control-5-users-50-usecases-monthly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_050_005_MONTHLY),
      ],
      [
        'governance-control-5-users-50-usecases-yearly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_050_005_YEARLY),
      ],
      [
        'governance-control-10-users-100-usecases-monthly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_100_010_MONTHLY),
      ],
      [
        'governance-control-10-users-100-usecases-yearly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_100_010_YEARLY),
      ],
      [
        'governance-control-15-users-150-usecases-monthly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_150_015_MONTHLY),
      ],
      [
        'governance-control-15-users-150-usecases-yearly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_150_015_YEARLY),
      ],
      [
        'governance-control-20-users-200-usecases-monthly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_200_020_MONTHLY),
      ],
      [
        'governance-control-20-users-200-usecases-yearly',
        normalizeEnvValue(process.env.STRIPE_PRICE_GOVERNANCE_PRO_200_020_YEARLY),
      ],
    ].filter(([, value]) => Boolean(value)),
  ) as Record<string, string>;

  return {
    secretKey: resolveStripeSecretKey(),
    enterprisePriceId: normalizeEnvValue(process.env.STRIPE_PRICE_ENTERPRISE),
    billingPortalConfigurationId: normalizeEnvValue(
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID,
    ),
    governancePriceIdsByLookupKey,
  };
}

export function getStripePriceIdForPlan(
  plan: StripeBillingPlan,
  config: StripeBillingConfiguration = resolveStripeBillingConfiguration(),
): string | null {
  return plan === 'enterprise' ? config.enterprisePriceId : null;
}

export function getGovernanceStripePriceId(
  tier: GovernanceVolumeTier,
  interval: GovernanceBillingInterval,
  config: StripeBillingConfiguration = resolveStripeBillingConfiguration(),
): string | null {
  return config.governancePriceIdsByLookupKey[getGovernanceLookupKey(tier, interval)] ?? null;
}

export function createStripeServerClient(
  config: StripeBillingConfiguration = resolveStripeBillingConfiguration(),
): Stripe {
  if (!config.secretKey) {
    throw new Error(
      'Stripe server configuration is missing. Expected STRIPE_SECRET_KEY or STRIPE_API_KEY.',
    );
  }

  return new Stripe(config.secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

export function buildBillingReturnUrl(
  checkoutSessionIdPlaceholder?: string,
): string {
  const base = '/settings?section=governance';
  const withSession = checkoutSessionIdPlaceholder
    ? `${base}&checkout_session_id=${encodeURIComponent(
        checkoutSessionIdPlaceholder,
      )}`
    : base;
  return `${buildPublicAppUrl(withSession)}#upgrade-panel`;
}

export function buildBillingCancelUrl(): string {
  return `${buildPublicAppUrl('/settings?section=governance')}#upgrade-panel`;
}
