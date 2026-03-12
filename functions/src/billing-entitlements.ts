export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export type RegisterEntitlementStatus = 'active' | 'inactive';

export type BillingProductKey =
  | 'free_register'
  | 'governance_control_center'
  | 'enterprise_suite';

export type BillingEntitlementSource =
  | 'default_free'
  | 'legacy_plan_field'
  | 'customer_entitlement_sync'
  | 'stripe_checkout'
  | 'stripe_webhook'
  | 'billing_repair'
  | 'legacy_purchase_import'
  | 'manual';

export interface BillingLineItemHint {
  priceId?: string | null;
  lookupKey?: string | null;
  productId?: string | null;
  productName?: string | null;
  description?: string | null;
}

export interface BillingEntitlementRecord {
  plan: SubscriptionPlan;
  status: RegisterEntitlementStatus;
  source: BillingEntitlementSource;
  updatedAt: string;
  customerEmail?: string | null;
  productId?: string | null;
  billingProductKey?: BillingProductKey | null;
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
}

export interface CustomerEntitlementRecord extends BillingEntitlementRecord {
  email: string;
}

export interface BillingEntitlementResolution {
  plan: SubscriptionPlan;
  billingProductKey: BillingProductKey;
  matchedOn: string | null;
}

interface BillingCatalogEntry {
  billingProductKey: BillingProductKey;
  plan: SubscriptionPlan;
  exactPlans: string[];
  exactLookupKeys: string[];
  exactProductIds: string[];
  keywordHints: string[];
}

const BILLING_ENTITLEMENT_CATALOG: BillingCatalogEntry[] = [
  {
    billingProductKey: 'enterprise_suite',
    plan: 'enterprise',
    exactPlans: ['enterprise'],
    exactLookupKeys: ['enterprise', 'ki-register-enterprise'],
    exactProductIds: [],
    keywordHints: [
      'enterprise',
      'scim',
      'sso',
      'rbac',
      'multi-tenant',
      'multitenant',
      'multitenancy',
      'api access',
      'webhooks',
      'procurement',
    ],
  },
  {
    billingProductKey: 'governance_control_center',
    plan: 'pro',
    exactPlans: [
      'pro',
      'governance_control_center',
      'governance-control-center',
    ],
    exactLookupKeys: [
      'pro',
      'governance-control',
      'governance-control-center',
      'ki-register-pro',
    ],
    exactProductIds: [],
    keywordHints: [
      'governance',
      'control center',
      'control-centre',
      'control-center',
      'policy',
      'trust portal',
      'trust-portal',
      'audit export',
      'audit-export',
      'academy',
      'kurs',
      'review workflow',
      'action queue',
      'exports',
    ],
  },
  {
    billingProductKey: 'free_register',
    plan: 'free',
    exactPlans: ['free', 'free_register', 'free-register'],
    exactLookupKeys: ['free', 'free-register', 'ki-register-free'],
    exactProductIds: [],
    keywordHints: ['free register', 'register-free', 'free-register'],
  },
];

function normalizeHint(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function uniqueHints(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeHint(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function matchesExact(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value === candidate);
}

function matchesKeyword(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

export function buildBillingHintList(input: {
  metadata?: Record<string, string | null | undefined> | null;
  productId?: string | null;
  productName?: string | null;
  lineItems?: BillingLineItemHint[];
}): string[] {
  const metadataHints = Object.values(input.metadata ?? {});
  const lineItemHints = (input.lineItems ?? []).flatMap((lineItem) => [
    lineItem.lookupKey,
    lineItem.priceId,
    lineItem.productId,
    lineItem.productName,
    lineItem.description,
  ]);

  return uniqueHints([
    input.productId,
    input.productName,
    ...metadataHints,
    ...lineItemHints,
  ]);
}

export function resolveBillingEntitlement(input: {
  metadata?: Record<string, string | null | undefined> | null;
  productId?: string | null;
  productName?: string | null;
  lineItems?: BillingLineItemHint[];
}): BillingEntitlementResolution | null {
  const hints = buildBillingHintList(input);

  for (const hint of hints) {
    for (const entry of BILLING_ENTITLEMENT_CATALOG) {
      if (
        matchesExact(hint, entry.exactPlans) ||
        matchesExact(hint, entry.exactLookupKeys) ||
        matchesExact(hint, entry.exactProductIds)
      ) {
        return {
          plan: entry.plan,
          billingProductKey: entry.billingProductKey,
          matchedOn: hint,
        };
      }
    }
  }

  for (const hint of hints) {
    for (const entry of BILLING_ENTITLEMENT_CATALOG) {
      if (matchesKeyword(hint, entry.keywordHints)) {
        return {
          plan: entry.plan,
          billingProductKey: entry.billingProductKey,
          matchedOn: hint,
        };
      }
    }
  }

  return null;
}

export function inferEntitlementPlanFromHints(
  hints: Array<string | null | undefined>,
): SubscriptionPlan | null {
  const resolution = resolveBillingEntitlement({
    lineItems: hints.map((hint) => ({
      description: hint,
    })),
  });
  return resolution?.plan ?? null;
}

export function inferCheckoutEntitlement(input: {
  metadata?: Record<string, string | null | undefined> | null;
  productId?: string | null;
  productName?: string | null;
  lineItems?: BillingLineItemHint[];
}): BillingEntitlementResolution | null {
  return resolveBillingEntitlement(input);
}

export function getEntitlementAccessPlan(
  entitlement:
    | Pick<BillingEntitlementRecord, 'plan' | 'status'>
    | null
    | undefined,
): SubscriptionPlan {
  if (!entitlement) {
    return 'free';
  }

  return entitlement.status === 'active' ? entitlement.plan : 'free';
}

function planPriority(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'enterprise':
      return 2;
    case 'pro':
      return 1;
    default:
      return 0;
  }
}

export function getHigherPlan(
  left: SubscriptionPlan,
  right: SubscriptionPlan,
): SubscriptionPlan {
  return planPriority(left) >= planPriority(right) ? left : right;
}

export function buildCustomerEntitlementRecord(input: {
  email: string;
  plan: SubscriptionPlan;
  status?: RegisterEntitlementStatus;
  source: BillingEntitlementSource;
  updatedAt?: string;
  productId?: string | null;
  billingProductKey?: BillingProductKey | null;
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
}): CustomerEntitlementRecord {
  return {
    email: input.email.toLowerCase(),
    plan: input.plan,
    status: input.status ?? 'active',
    source: input.source,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    productId: input.productId ?? null,
    billingProductKey: input.billingProductKey ?? null,
    checkoutSessionId: input.checkoutSessionId ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    customerEmail: input.email.toLowerCase(),
  };
}

export function mergeCustomerEntitlements(
  existing: CustomerEntitlementRecord | null | undefined,
  incoming: CustomerEntitlementRecord,
): CustomerEntitlementRecord {
  if (!existing) {
    return incoming;
  }

  if (incoming.status === 'inactive') {
    return {
      ...existing,
      ...incoming,
      plan: getHigherPlan(existing.plan, incoming.plan),
      status: 'inactive',
      updatedAt: incoming.updatedAt,
    };
  }

  const existingAccessPlan = getEntitlementAccessPlan(existing);
  const mergedPlan = getHigherPlan(existingAccessPlan, incoming.plan);

  return {
    ...existing,
    ...incoming,
    plan: mergedPlan,
    status: 'active',
    updatedAt: incoming.updatedAt,
  };
}

export function parseCustomerEntitlementRecord(
  email: string,
  value: Record<string, unknown> | null | undefined,
): CustomerEntitlementRecord | null {
  const normalizedEmail = normalizeHint(email);
  const plan = normalizeHint(
    typeof value?.plan === 'string' ? value.plan : null,
  );
  if (
    !normalizedEmail ||
    (plan !== 'free' && plan !== 'pro' && plan !== 'enterprise')
  ) {
    return null;
  }

  const status =
    value?.status === 'inactive' || value?.status === 'active'
      ? value.status
      : 'active';

  return {
    email: normalizedEmail,
    plan,
    status,
    source:
      typeof value?.source === 'string'
        ? (value.source as BillingEntitlementSource)
        : 'manual',
    updatedAt:
      typeof value?.updatedAt === 'string'
        ? value.updatedAt
        : new Date(0).toISOString(),
    customerEmail:
      typeof value?.customerEmail === 'string'
        ? value.customerEmail
        : normalizedEmail,
    productId: typeof value?.productId === 'string' ? value.productId : null,
    billingProductKey:
      typeof value?.billingProductKey === 'string'
        ? (value.billingProductKey as BillingProductKey)
        : null,
    checkoutSessionId:
      typeof value?.checkoutSessionId === 'string'
        ? value.checkoutSessionId
        : null,
    stripeCustomerId:
      typeof value?.stripeCustomerId === 'string'
        ? value.stripeCustomerId
        : null,
    subscriptionId:
      typeof value?.subscriptionId === 'string' ? value.subscriptionId : null,
  };
}
