import type { SubscriptionPlan } from '@/lib/register-first/types';

const DEFAULT_SALES_EMAIL = 'zoltangal@web.de';

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
          label: 'Enterprise anfragen',
          description:
            'Enterprise baut auf Governance auf und ergänzt Organisationsverwaltung, Provisioning und Procurement.',
          external: true,
          checkoutConfigured: true,
          targetPlan: 'enterprise',
        }
      : {
          href: buildMailtoHref('Enterprise Upgrade Request'),
          label: 'Enterprise anfragen',
          description:
            'Enterprise wird aktuell über direkten Kontakt statt über einen Checkout freigeschaltet.',
          external: true,
          checkoutConfigured: false,
          targetPlan: 'enterprise',
        };
  }

  return {
    href: '/settings?section=governance#upgrade-panel',
    label: 'Governance freischalten',
    description:
      'Die bezahlte Governance-Stufe wird über Governance Settings und einen serverseitig abgesicherten Stripe-Checkout aktiviert.',
    external: false,
    checkoutConfigured: true,
    targetPlan: 'pro',
  };
}
