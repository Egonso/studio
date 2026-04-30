import type {
  Register,
  RegisterEntitlement,
  RegisterEntitlementSource,
  SubscriptionPlan,
} from './types';

const PLAN_PRIORITY: Record<SubscriptionPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function createFreeRegisterEntitlement(
  updatedAt: string = new Date().toISOString(),
): RegisterEntitlement {
  return {
    plan: 'free',
    status: 'active',
    source: 'default_free',
    updatedAt,
    accessExpiresAt: null,
    billingProductKey: null,
  };
}

export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return value === 'free' || value === 'pro' || value === 'enterprise';
}

export function getHigherPlan(
  left: SubscriptionPlan,
  right: SubscriptionPlan,
): SubscriptionPlan {
  return PLAN_PRIORITY[left] >= PLAN_PRIORITY[right] ? left : right;
}

function normalizeEntitlementSource(
  source: unknown,
): RegisterEntitlementSource {
  switch (source) {
    case 'default_free':
    case 'legacy_plan_field':
    case 'customer_entitlement_sync':
    case 'stripe_checkout':
    case 'stripe_webhook':
    case 'billing_repair':
    case 'legacy_purchase_import':
    case 'manual':
      return source;
    default:
      return 'manual';
  }
}

export function normalizeRegisterEntitlement(
  entitlement: Partial<RegisterEntitlement> | null | undefined,
  fallbackUpdatedAt?: string,
): RegisterEntitlement | null {
  if (!entitlement || !isSubscriptionPlan(entitlement.plan)) {
    return null;
  }

  return {
    plan: entitlement.plan,
    status: entitlement.status === 'inactive' ? 'inactive' : 'active',
    source: normalizeEntitlementSource(entitlement.source),
    updatedAt:
      entitlement.updatedAt ?? fallbackUpdatedAt ?? new Date(0).toISOString(),
    accessExpiresAt: entitlement.accessExpiresAt ?? null,
    customerEmail: entitlement.customerEmail ?? null,
    productId: entitlement.productId ?? null,
    billingProductKey: entitlement.billingProductKey ?? null,
    checkoutSessionId: entitlement.checkoutSessionId ?? null,
    stripeCustomerId: entitlement.stripeCustomerId ?? null,
    subscriptionId: entitlement.subscriptionId ?? null,
  };
}

export function getEntitlementAccessPlan(
  entitlement:
    | Pick<RegisterEntitlement, 'plan' | 'status' | 'accessExpiresAt'>
    | null
    | undefined,
): SubscriptionPlan {
  if (!entitlement) {
    return 'free';
  }

  if (entitlement.status !== 'active') {
    return 'free';
  }

  if (
    entitlement.accessExpiresAt &&
    Date.parse(entitlement.accessExpiresAt) <= Date.now()
  ) {
    return 'free';
  }

  return entitlement.plan;
}

export function resolveRegisterEntitlement(
  register:
    | Pick<Register, 'createdAt' | 'plan' | 'entitlement'>
    | null
    | undefined,
): RegisterEntitlement {
  const explicitEntitlement = normalizeRegisterEntitlement(
    register?.entitlement,
    register?.createdAt,
  );
  if (explicitEntitlement) {
    return explicitEntitlement;
  }

  if (isSubscriptionPlan(register?.plan)) {
    return {
      plan: register.plan,
      status: 'active',
      source: 'legacy_plan_field',
      updatedAt: register?.createdAt ?? new Date(0).toISOString(),
      accessExpiresAt: null,
      customerEmail: null,
      productId: null,
      billingProductKey: null,
      checkoutSessionId: null,
      stripeCustomerId: null,
      subscriptionId: null,
    };
  }

  return createFreeRegisterEntitlement(register?.createdAt);
}

export function resolveRegisterPlan(
  register:
    | Pick<Register, 'createdAt' | 'plan' | 'entitlement'>
    | null
    | undefined,
): SubscriptionPlan {
  return getEntitlementAccessPlan(resolveRegisterEntitlement(register));
}

export function isPaidPlan(plan: SubscriptionPlan | null | undefined): boolean {
  return plan === 'pro' || plan === 'enterprise';
}
