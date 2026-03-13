import type { SubscriptionPlan } from '@/lib/register-first/types';

export interface CheckoutReturnPayload {
  customer_email: string;
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
    customer_email: email,
    entitlement_plan: input.entitlementPlan ?? null,
    checkout_claimable: isClaimableCheckoutPlan(input.entitlementPlan),
  };
}
