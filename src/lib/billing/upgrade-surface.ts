import type { SubscriptionPlan } from '@/lib/register-first/types';

const DEFAULT_SALES_EMAIL = 'sales@airegist.com';

export interface GovernanceUpgradeDestination {
  href: string;
  label: string;
  description: string;
  external: boolean;
  checkoutConfigured: boolean;
  targetPlan: SubscriptionPlan;
}

function normalizeUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildMailtoHref(subject: string): string {
  const params = new URLSearchParams({ subject });
  return `mailto:${DEFAULT_SALES_EMAIL}?${params.toString()}`;
}

function resolveConfiguredHref(keys: string[]): string | null {
  for (const key of keys) {
    const value = normalizeUrl(process.env[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

export function getGovernanceUpgradeDestination(
  currentPlan: SubscriptionPlan,
): GovernanceUpgradeDestination | null {
  if (currentPlan === 'enterprise') {
    return null;
  }

  if (currentPlan === 'pro') {
    const href = resolveConfiguredHref([
      'NEXT_PUBLIC_ENTERPRISE_CONTACT_URL',
      'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ENTERPRISE',
    ]);

    return href
      ? {
          href,
          label: 'Request Enterprise',
          description:
            'Enterprise builds on the Governance tier and adds organisation management, provisioning and procurement.',
          external: true,
          checkoutConfigured: true,
          targetPlan: 'enterprise',
        }
      : {
          href: buildMailtoHref('Enterprise Upgrade Request'),
          label: 'Request Enterprise',
          description:
            'Enterprise activation currently goes through our sales team rather than a direct checkout.',
          external: true,
          checkoutConfigured: false,
          targetPlan: 'enterprise',
        };
  }

  return {
    href: '/settings?section=governance#upgrade-panel',
    label: 'Unlock Governance',
    description:
      'The paid Governance tier is activated via Governance Settings and a server-side secured Stripe checkout.',
    external: false,
    checkoutConfigured: true,
    targetPlan: 'pro',
  };
}
