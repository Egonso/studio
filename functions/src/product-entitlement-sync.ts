import * as admin from 'firebase-admin';

import {
  buildCustomerEntitlementRecord,
  getEntitlementAccessPlan,
  inferCheckoutEntitlement,
  inferEntitlementPlanFromHints,
  mergeCustomerEntitlements,
  parseCustomerEntitlementRecord,
  type CustomerEntitlementRecord,
  type RegisterEntitlementStatus,
} from './billing-entitlements';

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function defaultBillingProductKey(
  plan: CustomerEntitlementRecord['plan'],
): CustomerEntitlementRecord['billingProductKey'] {
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

export async function readCustomerEntitlement(
  db: FirebaseFirestore.Firestore,
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
  db: FirebaseFirestore.Firestore,
  entitlement: CustomerEntitlementRecord,
): Promise<CustomerEntitlementRecord> {
  const existing = await readCustomerEntitlement(db, entitlement.email);
  const next = mergeCustomerEntitlements(existing, entitlement);

  await db
    .collection('customerEntitlements')
    .doc(next.email)
    .set(next, { merge: true });

  return next;
}

export async function repairCustomerEntitlementFromLegacyCustomer(
  db: FirebaseFirestore.Firestore,
  email: string,
): Promise<CustomerEntitlementRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const existing = await readCustomerEntitlement(db, normalizedEmail);
  if (existing) {
    return existing;
  }

  const snapshot = await db.collection('customers').doc(normalizedEmail).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data) {
    return null;
  }

  const plan = inferEntitlementPlanFromHints([
    typeof data.entitlementPlan === 'string' ? data.entitlementPlan : null,
    typeof data.productId === 'string' ? data.productId : null,
  ]);
  if (!plan || plan === 'free') {
    return null;
  }

  const resolvedProduct = inferCheckoutEntitlement({
    productId: typeof data.productId === 'string' ? data.productId : null,
    productName: typeof data.name === 'string' ? data.name : null,
  });

  const repaired = buildCustomerEntitlementRecord({
    email: normalizedEmail,
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
      resolvedProduct?.billingProductKey ?? defaultBillingProductKey(plan),
    stripeCustomerId: typeof data.stripeId === 'string' ? data.stripeId : null,
  });

  await db
    .collection('customerEntitlements')
    .doc(normalizedEmail)
    .set(repaired, { merge: true });

  return repaired;
}

async function resolveUserIdsForEmail(
  db: FirebaseFirestore.Firestore,
  email: string,
): Promise<string[]> {
  const userIds = new Set<string>();

  try {
    const authUser = await admin.auth().getUserByEmail(email);
    userIds.add(authUser.uid);
  } catch {
    // Billing can arrive before signup.
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

export async function applyCustomerEntitlementToProductModels(
  db: FirebaseFirestore.Firestore,
  email: string,
  entitlement: CustomerEntitlementRecord,
  source: CustomerEntitlementRecord['source'] = entitlement.source,
): Promise<{ userIds: string[]; registerIds: string[] }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { userIds: [], registerIds: [] };
  }

  const nextEntitlement: CustomerEntitlementRecord = {
    ...entitlement,
    source,
    updatedAt: new Date().toISOString(),
  };
  const workspacePlan = getEntitlementAccessPlan(nextEntitlement);
  const userIds = await resolveUserIdsForEmail(db, normalizedEmail);
  const registerIds = new Set<string>();

  for (const userId of userIds) {
    const userRef = db.collection('users').doc(userId);
    await userRef.set(
      {
        email: normalizedEmail,
        workspaceEntitlement: nextEntitlement,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    const registersSnapshot = await userRef.collection('registers').get();
    if (registersSnapshot.empty) {
      continue;
    }

    const batch = db.batch();
    for (const registerSnapshot of registersSnapshot.docs) {
      registerIds.add(registerSnapshot.id);
      batch.set(
        registerSnapshot.ref,
        {
          plan: workspacePlan,
          entitlement: nextEntitlement,
        },
        { merge: true },
      );
    }
    await batch.commit();
  }

  return {
    userIds,
    registerIds: Array.from(registerIds),
  };
}

export async function setCustomerEntitlementStatus(
  db: FirebaseFirestore.Firestore,
  input: {
    email: string;
    status: RegisterEntitlementStatus;
    source: CustomerEntitlementRecord['source'];
    updatedAt?: string;
    productId?: string | null;
    stripeCustomerId?: string | null;
    subscriptionId?: string | null;
    checkoutSessionId?: string | null;
    fallbackPlanHints?: Array<string | null | undefined>;
  },
): Promise<CustomerEntitlementRecord | null> {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    return null;
  }

  const existing =
    (await readCustomerEntitlement(db, normalizedEmail)) ??
    (await repairCustomerEntitlementFromLegacyCustomer(db, normalizedEmail));

  const plan =
    existing?.plan ??
    inferEntitlementPlanFromHints(input.fallbackPlanHints ?? []) ??
    null;

  if (!plan) {
    return null;
  }

  const next = buildCustomerEntitlementRecord({
    email: normalizedEmail,
    plan,
    status: input.status,
    source: input.source,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    productId: input.productId ?? existing?.productId ?? null,
    billingProductKey:
      existing?.billingProductKey ?? defaultBillingProductKey(plan),
    stripeCustomerId:
      input.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    subscriptionId: input.subscriptionId ?? existing?.subscriptionId ?? null,
    checkoutSessionId:
      input.checkoutSessionId ?? existing?.checkoutSessionId ?? null,
  });

  const merged = await upsertCustomerEntitlement(db, next);
  await applyCustomerEntitlementToProductModels(
    db,
    normalizedEmail,
    merged,
    input.source,
  );
  return merged;
}
