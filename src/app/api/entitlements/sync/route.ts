import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

import {
  getCheckoutEligibility,
  getCheckoutEligibilityErrorMessage,
} from '@/lib/billing/checkout-eligibility';
import {
  buildCustomerEntitlementRecord,
  inferCheckoutBillingProduct,
  type BillingLineItemHint,
  type CustomerEntitlementRecord,
} from '@/lib/billing/stripe-entitlements';
import {
  resolveStripeSecretKey,
  STRIPE_API_VERSION,
} from '@/lib/billing/stripe-server';
import { getEntitlementAccessPlan } from '@/lib/register-first/entitlement';
import { materializeWorkspaceAccessWriteModel } from '@/lib/server-access';
import { ServerAuthError, requireUser } from '@/lib/server-auth';
import { logWarn } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeIdentifierSchema,
} from '@/lib/security/request-security';

const EntitlementSyncSchema = z
  .object({
    registerId: safeIdentifierSchema.optional(),
    sessionId: z
      .string()
      .trim()
      .regex(
        /^cs_(test|live)_[A-Za-z0-9]+$/,
        'Checkout-Session ist ungültig.',
      )
      .optional(),
  })
  .strict();

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function customerEmailFromSession(
  session: Stripe.Checkout.Session,
): string | null {
  return normalizeEmail(
    session.customer_details?.email ?? session.customer_email ?? null,
  );
}

function toLineItemHints(
  lineItems: Stripe.ApiList<Stripe.LineItem>,
): BillingLineItemHint[] {
  return lineItems.data.map((item) => {
    const product = item.price?.product;
    return {
      priceId: item.price?.id ?? null,
      lookupKey: item.price?.lookup_key ?? null,
      productId: typeof product === 'string' ? product : (product?.id ?? null),
      productName:
        typeof product === 'object' && product && 'name' in product
          ? (product.name ?? null)
          : null,
      description: item.description ?? null,
    };
  });
}

async function getCheckoutEntitlementFromSession(
  sessionId: string,
  expectedEmail: string,
): Promise<CustomerEntitlementRecord | null> {
  const stripeSecretKey = resolveStripeSecretKey();
  if (!stripeSecretKey) {
    throw new Error('Stripe server configuration is missing.');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  let subscription: Stripe.Subscription | null = null;
  if (typeof session.subscription === 'string') {
    subscription = await stripe.subscriptions.retrieve(session.subscription);
  }

  const eligibility = getCheckoutEligibility({ session, subscription });
  if (!eligibility.ok && eligibility.reason) {
    throw new ServerAuthError(
      getCheckoutEligibilityErrorMessage(eligibility.reason),
      409,
    );
  }

  let customerEmail = customerEmailFromSession(session);

  if (!customerEmail && typeof session.customer === 'string') {
    const customer = await stripe.customers.retrieve(session.customer);
    if (customer && !customer.deleted && customer.email) {
      customerEmail = customer.email.toLowerCase();
    }
  }

  if (customerEmail && customerEmail !== expectedEmail) {
    throw new ServerAuthError(
      'Checkout session does not belong to this account.',
      403,
    );
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 20,
    expand: ['data.price.product'],
  });

  const resolvedBillingProduct = inferCheckoutBillingProduct({
    metadata: session.metadata,
    productId: session.metadata?.productId ?? null,
    lineItems: toLineItemHints(lineItems),
  });

  if (!resolvedBillingProduct || resolvedBillingProduct.plan === 'free') {
    return null;
  }

  return buildCustomerEntitlementRecord({
    email: expectedEmail,
    plan: resolvedBillingProduct.plan,
    source: 'stripe_checkout',
    productId: session.metadata?.productId ?? null,
    billingProductKey: resolvedBillingProduct.billingProductKey,
    checkoutSessionId: session.id,
    stripeCustomerId:
      typeof session.customer === 'string' ? session.customer : null,
    subscriptionId:
      typeof session.subscription === 'string' ? session.subscription : null,
  });
}

function sameStringArray(
  left: string[] | null | undefined,
  right: string[],
): boolean {
  const normalizedLeft = Array.isArray(left) ? [...left].sort() : [];
  const normalizedRight = [...right].sort();
  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

function sameStringRecord(
  left: Record<string, string> | null | undefined,
  right: Record<string, string>,
): boolean {
  const normalizedLeft = Object.fromEntries(
    Object.entries(left ?? {}).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    ),
  );
  const normalizedRight = Object.fromEntries(
    Object.entries(right).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    ),
  );
  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

function unwrapModuleExports<T>(module: T): T {
  if (
    module &&
    typeof module === 'object' &&
    'default' in module &&
    module.default
  ) {
    return module.default as T;
  }

  if (
    module &&
    typeof module === 'object' &&
    'module.exports' in module &&
    module['module.exports']
  ) {
    return module['module.exports'] as T;
  }

  return module;
}

async function syncWorkspaceAccessState(
  db: Awaited<typeof import('@/lib/firebase-admin')>['db'],
  userId: string,
  email: string,
): Promise<boolean> {
  const userRef = db.collection('users').doc(userId);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) {
    return false;
  }

  const userData = userSnapshot.data() ?? {};
  const nextAccess = materializeWorkspaceAccessWriteModel(userId, userData);

  const hasLegacyWorkspaceData =
    Array.isArray((userData as { workspaces?: unknown }).workspaces) &&
    (userData as { workspaces?: unknown[] }).workspaces!.length > 0;
  if (!hasLegacyWorkspaceData) {
    return false;
  }

  const hasSyncedAccess =
    sameStringArray(
      (userData as { workspaceOrgIds?: string[] | null }).workspaceOrgIds,
      nextAccess.workspaceOrgIds,
    ) &&
    sameStringRecord(
      (userData as { workspaceRolesByOrg?: Record<string, string> | null })
        .workspaceRolesByOrg,
      nextAccess.workspaceRolesByOrg,
    );

  if (hasSyncedAccess) {
    return false;
  }

  await userRef.set(
    {
      email,
      workspaces: nextAccess.workspaces,
      workspaceOrgIds: nextAccess.workspaceOrgIds,
      workspaceRolesByOrg: nextAccess.workspaceRolesByOrg,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return true;
}

export async function POST(request: NextRequest) {
  try {
    let db: Awaited<typeof import('@/lib/firebase-admin')>['db'] | null = null;
    let applyCustomerEntitlementToWorkspace:
      | (typeof import('@/lib/billing/product-entitlement-sync'))['applyCustomerEntitlementToWorkspace']
      | null = null;
    let readCustomerEntitlement:
      | (typeof import('@/lib/billing/product-entitlement-sync'))['readCustomerEntitlement']
      | null = null;
    let repairCustomerEntitlementFromLegacyPurchase:
      | (typeof import('@/lib/billing/product-entitlement-sync'))['repairCustomerEntitlementFromLegacyPurchase']
      | null = null;
    let upsertCustomerEntitlement:
      | (typeof import('@/lib/billing/product-entitlement-sync'))['upsertCustomerEntitlement']
      | null = null;

    try {
      const [firebaseAdminModuleRaw, entitlementSyncModuleRaw] = await Promise.all([
        import('@/lib/firebase-admin'),
        import('@/lib/billing/product-entitlement-sync'),
      ]);
      const firebaseAdminModule = unwrapModuleExports(firebaseAdminModuleRaw);
      const entitlementSyncModule = unwrapModuleExports(
        entitlementSyncModuleRaw,
      );
      db = firebaseAdminModule.db;
      applyCustomerEntitlementToWorkspace =
        entitlementSyncModule.applyCustomerEntitlementToWorkspace;
      readCustomerEntitlement = entitlementSyncModule.readCustomerEntitlement;
      repairCustomerEntitlementFromLegacyPurchase =
        entitlementSyncModule.repairCustomerEntitlementFromLegacyPurchase;
      upsertCustomerEntitlement = entitlementSyncModule.upsertCustomerEntitlement;
    } catch (error) {
      logWarn('entitlement_sync_admin_unavailable', {
        errorMessage: error instanceof Error ? error.message : 'unknown',
      });
    }

    const decoded = await requireUser(request.headers.get('authorization'));
    const body = EntitlementSyncSchema.parse(
      await request.json().catch(() => ({})),
    );
    const registerId = body.registerId ?? null;
    const sessionId = body.sessionId ?? null;
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'entitlement-sync',
      key: buildRateLimitKey(
        request,
        decoded.uid,
        registerId ?? sessionId ?? 'sync',
      ),
      limit: 20,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: decoded.uid,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Zu viele Entitlement-Synchronisierungen in kurzer Zeit. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 },
      );
    }

    const freeFallback = (workspaceAccessSynced = false) =>
      NextResponse.json({
        applied: false,
        needsRegister: false,
        plan: 'free',
        registerId,
        source: null,
        workspaceAccessSynced,
      });

    const firebaseAdminModule = unwrapModuleExports(
      await import('@/lib/firebase-admin'),
    );
    if (
      'hasFirebaseAdminCredentials' in firebaseAdminModule &&
      typeof firebaseAdminModule.hasFirebaseAdminCredentials === 'function' &&
      !firebaseAdminModule.hasFirebaseAdminCredentials()
    ) {
      return freeFallback();
    }

    if (
      !db ||
      !applyCustomerEntitlementToWorkspace ||
      !readCustomerEntitlement ||
      !repairCustomerEntitlementFromLegacyPurchase ||
      !upsertCustomerEntitlement
    ) {
      return freeFallback();
    }

    let workspaceAccessSynced = false;
    try {
      workspaceAccessSynced = await syncWorkspaceAccessState(
        db,
        decoded.uid,
        decoded.email,
      );
    } catch (error) {
      logWarn('entitlement_sync_workspace_access_failed', {
        errorMessage: error instanceof Error ? error.message : 'unknown',
        userId: decoded.uid,
      });
    }

    if (sessionId) {
      const claimedFromSession = await getCheckoutEntitlementFromSession(
        sessionId,
        decoded.email,
      );
      if (claimedFromSession) {
        await upsertCustomerEntitlement(claimedFromSession);
      }
    }

    const customerEntitlement =
      (await readCustomerEntitlement(decoded.email)) ??
      (await repairCustomerEntitlementFromLegacyPurchase(decoded.email));
    if (!customerEntitlement) {
      return freeFallback(workspaceAccessSynced);
    }

    const applied = await applyCustomerEntitlementToWorkspace(
      decoded.uid,
      decoded.email,
      customerEntitlement,
      {
        source: sessionId ? 'stripe_checkout' : 'customer_entitlement_sync',
      },
    );

    const responseRegisterId =
      registerId && applied.registerIds.includes(registerId)
        ? registerId
        : (applied.registerIds[0] ?? null);

    return NextResponse.json({
      applied: true,
      needsRegister: applied.registerIds.length === 0,
      plan: getEntitlementAccessPlan(customerEntitlement),
      registerId: responseRegisterId,
      source: sessionId ? 'stripe_checkout' : 'customer_entitlement_sync',
      workspaceAccessSynced,
    });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Eingabe.' },
        { status: 400 },
      );
    }

    logWarn('entitlement_sync_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    });
    return NextResponse.json(
      { error: 'Entitlement sync failed.' },
      { status: 500 },
    );
  }
}
