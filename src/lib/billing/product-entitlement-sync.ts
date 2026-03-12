import { auth, db } from '@/lib/firebase-admin';
import {
  buildCustomerEntitlementRecord,
  getEntitlementAccessPlan,
  inferCheckoutBillingProduct,
  inferEntitlementPlanFromHints,
  mergeCustomerEntitlements,
  parseCustomerEntitlementRecord,
  type BillingProductKey,
  type CustomerEntitlementRecord,
} from '@/lib/billing/stripe-entitlements';
import type { Register, RegisterEntitlement } from '@/lib/register-first/types';

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function createSyncedEntitlement(
  entitlement: CustomerEntitlementRecord,
  source: RegisterEntitlement['source'],
): CustomerEntitlementRecord {
  return {
    ...entitlement,
    source,
    updatedAt: new Date().toISOString(),
  };
}

function getDefaultBillingProductKey(
  plan: CustomerEntitlementRecord['plan'],
): BillingProductKey | null {
  switch (plan) {
    case 'pro':
      return 'governance_control_center';
    case 'enterprise':
      return 'enterprise_suite';
    case 'free':
      return 'free_register';
    default:
      return null;
  }
}

async function readLegacyCustomerEntitlement(
  email: string,
): Promise<CustomerEntitlementRecord | null> {
  const snapshot = await db.collection('customers').doc(email).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data) {
    return null;
  }

  const plan =
    inferEntitlementPlanFromHints([
      typeof data.entitlementPlan === 'string' ? data.entitlementPlan : null,
      typeof data.productId === 'string' ? data.productId : null,
    ]) ?? null;

  if (!plan || plan === 'free') {
    return null;
  }

  const resolvedProduct = inferCheckoutBillingProduct({
    productId: typeof data.productId === 'string' ? data.productId : null,
    productName: typeof data.name === 'string' ? data.name : null,
  });

  return buildCustomerEntitlementRecord({
    email,
    plan,
    status: data.status === 'inactive' ? 'inactive' : 'active',
    source: 'legacy_purchase_import',
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : typeof data.created?.toDate === 'function'
          ? data.created.toDate().toISOString()
          : new Date().toISOString(),
    productId: typeof data.productId === 'string' ? data.productId : null,
    billingProductKey:
      resolvedProduct?.billingProductKey ?? getDefaultBillingProductKey(plan),
    stripeCustomerId: typeof data.stripeId === 'string' ? data.stripeId : null,
  });
}

export async function readCustomerEntitlement(
  email: string,
): Promise<CustomerEntitlementRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const snapshot = await db
    .collection('customerEntitlements')
    .doc(normalizedEmail)
    .get();
  return parseCustomerEntitlementRecord(
    normalizedEmail,
    snapshot.data() as Record<string, unknown> | undefined,
  );
}

export async function upsertCustomerEntitlement(
  entitlement: CustomerEntitlementRecord,
): Promise<CustomerEntitlementRecord> {
  const existing = await readCustomerEntitlement(entitlement.email);
  const next = mergeCustomerEntitlements(existing, entitlement);

  await db
    .collection('customerEntitlements')
    .doc(next.email)
    .set(next, { merge: true });

  return next;
}

export async function repairCustomerEntitlementFromLegacyPurchase(
  email: string,
): Promise<CustomerEntitlementRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const existing = await readCustomerEntitlement(normalizedEmail);
  if (existing) {
    return existing;
  }

  const repaired = await readLegacyCustomerEntitlement(normalizedEmail);
  if (!repaired) {
    return null;
  }

  await db
    .collection('customerEntitlements')
    .doc(normalizedEmail)
    .set(repaired, { merge: true });

  return repaired;
}

async function resolveUserIdsForEmail(
  email: string,
  preferredUserId?: string | null,
): Promise<string[]> {
  const userIds = new Set<string>();
  if (preferredUserId) {
    userIds.add(preferredUserId);
  }

  try {
    const authUser = await auth.getUserByEmail(email);
    userIds.add(authUser.uid);
  } catch {
    // Ignore missing auth user. Billing can arrive before signup.
  }

  const usersSnapshot = await db
    .collection('users')
    .where('email', '==', email)
    .get();

  for (const doc of usersSnapshot.docs) {
    userIds.add(doc.id);
  }

  return Array.from(userIds);
}

export interface WorkspaceEntitlementApplyResult {
  userId: string;
  registerIds: string[];
  workspacePlan: Register['plan'];
}

export async function applyCustomerEntitlementToWorkspace(
  userId: string,
  email: string,
  entitlement: CustomerEntitlementRecord,
  options: {
    source?: RegisterEntitlement['source'];
  } = {},
): Promise<WorkspaceEntitlementApplyResult> {
  const nextEntitlement = createSyncedEntitlement(
    entitlement,
    options.source ?? entitlement.source,
  );
  const nextPlan = getEntitlementAccessPlan(nextEntitlement);
  const userRef = db.collection('users').doc(userId);

  await userRef.set(
    {
      email,
      workspaceEntitlement: nextEntitlement,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  const registersSnapshot = await userRef.collection('registers').get();
  if (registersSnapshot.empty) {
    return {
      userId,
      registerIds: [],
      workspacePlan: nextPlan,
    };
  }

  const batch = db.batch();
  const registerIds: string[] = [];

  for (const registerSnapshot of registersSnapshot.docs) {
    registerIds.push(registerSnapshot.id);
    batch.set(
      registerSnapshot.ref,
      {
        plan: nextPlan,
        entitlement: nextEntitlement,
      },
      { merge: true },
    );
  }

  await batch.commit();

  return {
    userId,
    registerIds,
    workspacePlan: nextPlan,
  };
}

export interface BillingRepairResult {
  email: string;
  entitlement: CustomerEntitlementRecord | null;
  appliedUserIds: string[];
  appliedRegisterIds: string[];
  needsUserSignup: boolean;
}

export async function repairAndSyncBillingEntitlement(input: {
  email: string;
  userId?: string | null;
  source?: RegisterEntitlement['source'];
}): Promise<BillingRepairResult> {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    return {
      email: input.email,
      entitlement: null,
      appliedUserIds: [],
      appliedRegisterIds: [],
      needsUserSignup: false,
    };
  }

  const entitlement =
    (await readCustomerEntitlement(normalizedEmail)) ??
    (await repairCustomerEntitlementFromLegacyPurchase(normalizedEmail));

  if (!entitlement) {
    return {
      email: normalizedEmail,
      entitlement: null,
      appliedUserIds: [],
      appliedRegisterIds: [],
      needsUserSignup: false,
    };
  }

  const userIds = await resolveUserIdsForEmail(normalizedEmail, input.userId);
  const appliedRegisterIds = new Set<string>();

  for (const userId of userIds) {
    const applied = await applyCustomerEntitlementToWorkspace(
      userId,
      normalizedEmail,
      entitlement,
      { source: input.source },
    );
    for (const registerId of applied.registerIds) {
      appliedRegisterIds.add(registerId);
    }
  }

  return {
    email: normalizedEmail,
    entitlement,
    appliedUserIds: userIds,
    appliedRegisterIds: Array.from(appliedRegisterIds),
    needsUserSignup: userIds.length === 0,
  };
}
