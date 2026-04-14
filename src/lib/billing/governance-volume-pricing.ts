import { APP_LOCALE } from '@/lib/locale';

export type GovernanceBillingInterval = 'month' | 'year';

export interface GovernanceVolumeSnapshot {
  userCount: number;
  useCaseCount: number;
}

export interface GovernanceVolumeTier {
  id:
    | 'pro_5_users_50_use_cases'
    | 'pro_10_users_100_use_cases'
    | 'pro_15_users_150_use_cases'
    | 'pro_20_users_200_use_cases';
  label: string;
  maxUsers: number;
  maxUseCases: number;
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  monthlyLookupKey: string;
  yearlyLookupKey: string;
}

export const GOVERNANCE_VOLUME_TIERS: GovernanceVolumeTier[] = [
  {
    id: 'pro_5_users_50_use_cases',
    label: 'Bis 5 User / 50 Einsatzfälle',
    maxUsers: 5,
    maxUseCases: 50,
    monthlyAmountCents: 4900,
    yearlyAmountCents: 49900,
    monthlyLookupKey: 'governance-control-5-users-50-usecases-monthly',
    yearlyLookupKey: 'governance-control-5-users-50-usecases-yearly',
  },
  {
    id: 'pro_10_users_100_use_cases',
    label: 'Bis 10 User / 100 Einsatzfälle',
    maxUsers: 10,
    maxUseCases: 100,
    monthlyAmountCents: 9900,
    yearlyAmountCents: 99900,
    monthlyLookupKey: 'governance-control-10-users-100-usecases-monthly',
    yearlyLookupKey: 'governance-control-10-users-100-usecases-yearly',
  },
  {
    id: 'pro_15_users_150_use_cases',
    label: 'Bis 15 User / 150 Einsatzfälle',
    maxUsers: 15,
    maxUseCases: 150,
    monthlyAmountCents: 14900,
    yearlyAmountCents: 149900,
    monthlyLookupKey: 'governance-control-15-users-150-usecases-monthly',
    yearlyLookupKey: 'governance-control-15-users-150-usecases-yearly',
  },
  {
    id: 'pro_20_users_200_use_cases',
    label: 'Bis 20 User / 200 Einsatzfälle',
    maxUsers: 20,
    maxUseCases: 200,
    monthlyAmountCents: 19900,
    yearlyAmountCents: 199900,
    monthlyLookupKey: 'governance-control-20-users-200-usecases-monthly',
    yearlyLookupKey: 'governance-control-20-users-200-usecases-yearly',
  },
];

function normalizeCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function resolveGovernanceVolumeTier(
  snapshot: GovernanceVolumeSnapshot,
): GovernanceVolumeTier | null {
  const normalizedSnapshot = {
    userCount: normalizeCount(snapshot.userCount),
    useCaseCount: normalizeCount(snapshot.useCaseCount),
  };

  return (
    GOVERNANCE_VOLUME_TIERS.find(
      (tier) =>
        normalizedSnapshot.userCount <= tier.maxUsers &&
        normalizedSnapshot.useCaseCount <= tier.maxUseCases,
    ) ?? null
  );
}

export function getGovernanceLookupKey(
  tier: GovernanceVolumeTier,
  interval: GovernanceBillingInterval,
): string {
  return interval === 'year' ? tier.yearlyLookupKey : tier.monthlyLookupKey;
}

export function formatGovernanceTierPrice(
  tier: GovernanceVolumeTier,
  interval: GovernanceBillingInterval,
): string {
  const amount =
    interval === 'year' ? tier.yearlyAmountCents : tier.monthlyAmountCents;
  const formatter = new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  return formatter.format(amount / 100);
}

export function describeGovernanceVolumeTier(
  tier: GovernanceVolumeTier,
  interval: GovernanceBillingInterval,
): string {
  const intervalLabel = interval === 'year' ? 'Jahr' : 'Monat';
  return `${tier.label} · ${formatGovernanceTierPrice(
    tier,
    interval,
  )} pro ${intervalLabel}`;
}
