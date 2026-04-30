import type {
  RegisterEntitlement,
  SubscriptionPlan,
} from '@/lib/register-first/types';
import {
  buildCustomerEntitlementRecord as buildSharedCustomerEntitlementRecord,
  getEntitlementAccessPlan,
  inferCheckoutEntitlement as inferSharedCheckoutEntitlement,
  inferEntitlementPlanFromHints as inferSharedEntitlementPlanFromHints,
  mergeCustomerEntitlements as mergeSharedCustomerEntitlements,
  parseCustomerEntitlementRecord as parseSharedCustomerEntitlementRecord,
  type BillingLineItemHint,
  type BillingProductKey,
  type CustomerEntitlementRecord as SharedCustomerEntitlementRecord,
} from '../../../functions/src/billing-entitlements';

export type { BillingLineItemHint, BillingProductKey };

export interface CustomerEntitlementRecord
  extends
    RegisterEntitlement,
    Omit<SharedCustomerEntitlementRecord, keyof RegisterEntitlement> {
  email: string;
}

export function inferEntitlementPlanFromHints(
  hints: Array<string | null | undefined>,
): SubscriptionPlan | null {
  return inferSharedEntitlementPlanFromHints(hints) as SubscriptionPlan | null;
}

export function inferCheckoutEntitlementPlan(input: {
  metadata?: Record<string, string | null | undefined> | null;
  productId?: string | null;
  productName?: string | null;
  lineItems?: BillingLineItemHint[];
}): SubscriptionPlan | null {
  return (
    (inferSharedCheckoutEntitlement(input)?.plan as
      | SubscriptionPlan
      | null
      | undefined) ?? null
  );
}

export function inferCheckoutBillingProduct(input: {
  metadata?: Record<string, string | null | undefined> | null;
  productId?: string | null;
  productName?: string | null;
  lineItems?: BillingLineItemHint[];
}): { plan: SubscriptionPlan; billingProductKey: BillingProductKey } | null {
  const resolved = inferSharedCheckoutEntitlement(input);
  if (!resolved) {
    return null;
  }

  return {
    plan: resolved.plan as SubscriptionPlan,
    billingProductKey: resolved.billingProductKey,
  };
}

export function buildCustomerEntitlementRecord(input: {
  email: string;
  plan: SubscriptionPlan;
  status?: RegisterEntitlement['status'];
  source: RegisterEntitlement['source'];
  updatedAt?: string;
  accessExpiresAt?: string | null;
  productId?: string | null;
  billingProductKey?: BillingProductKey | null;
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
}): CustomerEntitlementRecord {
  return buildSharedCustomerEntitlementRecord(
    input,
  ) as CustomerEntitlementRecord;
}

export function parseCustomerEntitlementRecord(
  email: string,
  value: Record<string, unknown> | null | undefined,
): CustomerEntitlementRecord | null {
  return parseSharedCustomerEntitlementRecord(
    email,
    value,
  ) as CustomerEntitlementRecord | null;
}

export function mergeCustomerEntitlements(
  existing: CustomerEntitlementRecord | null | undefined,
  incoming: CustomerEntitlementRecord,
): CustomerEntitlementRecord {
  return mergeSharedCustomerEntitlements(
    existing,
    incoming,
  ) as CustomerEntitlementRecord;
}

export { getEntitlementAccessPlan };
