import type { SubscriptionPlan } from '@/lib/register-first/types';

export interface CheckoutReturnPayload {
  customer_email_hint: string;
  entitlement_plan: SubscriptionPlan | null;
  checkout_claimable: boolean;
}

interface BuildCheckoutReturnPayloadInput {
  sessionCustomerEmail?: string | null;
  customerEmail?: string | null;
  entitlementPlan?: SubscriptionPlan | null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return email;
  }

  const visibleLocal =
    localPart.length <= 2 ? localPart[0] ?? '*' : localPart.slice(0, 2);
  return `${visibleLocal}${'*'.repeat(Math.max(2, localPart.length - visibleLocal.length))}@${domain}`;
}

export function isClaimableCheckoutPlan(
  plan: SubscriptionPlan | null | undefined,
): boolean {
  return plan === 'pro' || plan === 'enterprise';
}

export function buildCheckoutReturnPayload(
  input: BuildCheckoutReturnPayloadInput,
): CheckoutReturnPayload | null {
  const email =
    normalizeEmail(input.sessionCustomerEmail) ??
    normalizeEmail(input.customerEmail);

  if (!email) {
    return null;
  }

  return {
    customer_email_hint: maskEmail(email),
    entitlement_plan: input.entitlementPlan ?? null,
    checkout_claimable: isClaimableCheckoutPlan(input.entitlementPlan),
  };
}
