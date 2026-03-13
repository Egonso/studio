import { NextRequest, NextResponse } from 'next/server';

import {
  buildBillingCancelUrl,
  buildBillingReturnUrl,
  createStripeServerClient,
  getGovernanceStripePriceId,
  getStripePriceIdForPlan,
  resolveStripeBillingConfiguration,
  type StripeBillingPlan,
} from '@/lib/billing/stripe-server';
import {
  describeGovernanceVolumeTier,
  getGovernanceLookupKey,
  resolveGovernanceVolumeTier,
  type GovernanceBillingInterval,
  type GovernanceVolumeSnapshot,
} from '@/lib/billing/governance-volume-pricing';
import { readCustomerEntitlement } from '@/lib/billing/product-entitlement-sync';
import { logError, logInfo, logWarn } from '@/lib/observability/logger';
import { getEntitlementAccessPlan } from '@/lib/register-first/entitlement';
import {
  findRegisterLocationById,
  listWorkspaceRegisters,
} from '@/lib/register-first/register-admin';
import { db } from '@/lib/firebase-admin';
import {
  ServerAuthError,
  requireUser,
  requireWorkspaceMember,
} from '@/lib/server-auth';
import { listWorkspaceMembers } from '@/lib/workspace-admin';

interface CheckoutRequestBody {
  targetPlan?: string | null;
  registerId?: string | null;
  workspaceId?: string | null;
  billingInterval?: string | null;
}

function resolveTargetPlan(input: string | null | undefined): StripeBillingPlan {
  return input === 'enterprise' ? 'enterprise' : 'pro';
}

function resolveBillingInterval(
  input: string | null | undefined,
): GovernanceBillingInterval {
  return input === 'year' ? 'year' : 'month';
}

function toProductKey(plan: StripeBillingPlan): string {
  return plan === 'enterprise'
    ? 'enterprise_suite'
    : 'governance_control_center';
}

function toActionLabel(plan: StripeBillingPlan): string {
  return plan === 'enterprise'
    ? 'Enterprise'
    : 'Governance Control Center';
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

async function countUseCasesForRegister(
  ownerId: string,
  registerId: string,
): Promise<number> {
  const snapshot = await db
    .collection(`users/${ownerId}/registers/${registerId}/useCases`)
    .get();

  return snapshot.docs.filter((document) => {
    const data = document.data() as { isDeleted?: boolean } | undefined;
    return data?.isDeleted !== true;
  }).length;
}

async function resolveGovernanceVolumeSnapshot(input: {
  actorUserId: string;
  authorizationHeader: string | null;
  registerId?: string | null;
  workspaceId?: string | null;
}): Promise<
  GovernanceVolumeSnapshot & {
    registerId: string | null;
    workspaceId: string | null;
  }
> {
  const workspaceId = normalizeOptionalText(input.workspaceId);
  const registerId = normalizeOptionalText(input.registerId);

  if (workspaceId) {
    await requireWorkspaceMember(input.authorizationHeader, workspaceId);
    const [members, registerLocations] = await Promise.all([
      listWorkspaceMembers(workspaceId),
      listWorkspaceRegisters(workspaceId),
    ]);
    const useCaseCounts = await Promise.all(
      registerLocations.map((location) =>
        countUseCasesForRegister(location.ownerId, location.registerId),
      ),
    );

    return {
      registerId,
      workspaceId,
      userCount: Math.max(
        1,
        members.filter((member) => member.status === 'active').length,
      ),
      useCaseCount: useCaseCounts.reduce((sum, count) => sum + count, 0),
    };
  }

  if (registerId) {
    const location = await findRegisterLocationById(registerId, {
      ownerId: input.actorUserId,
    });
    if (!location || location.ownerId !== input.actorUserId) {
      throw new ServerAuthError(
        'Register wurde für den Checkout nicht gefunden.',
        404,
      );
    }

    return {
      registerId,
      workspaceId: location.register.workspaceId ?? null,
      userCount: 1,
      useCaseCount: await countUseCasesForRegister(location.ownerId, registerId),
    };
  }

  const registerSnapshot = await db
    .collection(`users/${input.actorUserId}/registers`)
    .limit(1)
    .get();
  const firstRegister = registerSnapshot.docs[0];

  if (!firstRegister) {
    return {
      registerId: null,
      workspaceId: null,
      userCount: 1,
      useCaseCount: 0,
    };
  }

  return {
    registerId: firstRegister.id,
    workspaceId:
      ((firstRegister.data() as { workspaceId?: string | null } | undefined)
        ?.workspaceId as string | null | undefined) ?? null,
    userCount: 1,
    useCaseCount: await countUseCasesForRegister(
      input.actorUserId,
      firstRegister.id,
    ),
  };
}

async function resolveGovernanceCheckoutPriceId(input: {
  actorUserId: string;
  authorizationHeader: string | null;
  stripe: ReturnType<typeof createStripeServerClient>;
  config: ReturnType<typeof resolveStripeBillingConfiguration>;
  registerId?: string | null;
  workspaceId?: string | null;
  billingInterval: GovernanceBillingInterval;
}) {
  const usage = await resolveGovernanceVolumeSnapshot({
    actorUserId: input.actorUserId,
    authorizationHeader: input.authorizationHeader,
    registerId: input.registerId,
    workspaceId: input.workspaceId,
  });

  const tier = resolveGovernanceVolumeTier(usage);
  if (!tier) {
    return {
      usage,
      tier: null,
      priceId: null,
      lookupKey: null,
      description: null,
    };
  }

  const lookupKey = getGovernanceLookupKey(tier, input.billingInterval);
  const explicitPriceId = getGovernanceStripePriceId(
    tier,
    input.billingInterval,
    input.config,
  );

  if (explicitPriceId) {
    return {
      usage,
      tier,
      priceId: explicitPriceId,
      lookupKey,
      description: describeGovernanceVolumeTier(tier, input.billingInterval),
    };
  }

  const prices = await input.stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  });
  const matchedPrice = prices.data[0] ?? null;

  return {
    usage,
    tier,
    priceId: matchedPrice?.id ?? null,
    lookupKey,
    description: describeGovernanceVolumeTier(tier, input.billingInterval),
  };
}

function handleBillingRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  logError('billing_checkout_failed', {
    errorMessage: error instanceof Error ? error.message : 'unknown',
  });

  return NextResponse.json(
    {
      error:
        'Checkout konnte gerade nicht gestartet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request.headers.get('authorization'));
    const authorizationHeader = request.headers.get('authorization');
    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
    const targetPlan = resolveTargetPlan(body.targetPlan);
    const billingInterval = resolveBillingInterval(body.billingInterval);
    const config = resolveStripeBillingConfiguration();

    if (!config.secretKey) {
      return NextResponse.json(
        {
          error:
            'Stripe ist noch nicht vollständig konfiguriert. Hinterlegen Sie STRIPE_SECRET_KEY auf dem Server.',
        },
        { status: 503 },
      );
    }

    const existingEntitlement = await readCustomerEntitlement(decoded.email);
    const existingAccessPlan = getEntitlementAccessPlan(existingEntitlement);

    if (
      (targetPlan === 'pro' &&
        (existingAccessPlan === 'pro' || existingAccessPlan === 'enterprise')) ||
      (targetPlan === 'enterprise' && existingAccessPlan === 'enterprise')
    ) {
      logInfo('billing_checkout_skipped_existing_entitlement', {
        email: decoded.email,
        requestedPlan: targetPlan,
        existingPlan: existingAccessPlan,
      });
      return NextResponse.json(
        {
          error:
            'Dieses Konto ist bereits für die gewünschte Freischaltungsstufe aktiviert.',
        },
        { status: 409 },
      );
    }

    const stripe = createStripeServerClient(config);
    const governanceCheckout =
      targetPlan === 'pro'
        ? await resolveGovernanceCheckoutPriceId({
            actorUserId: decoded.uid,
            authorizationHeader,
            stripe,
            config,
            registerId: normalizeOptionalText(body.registerId),
            workspaceId: normalizeOptionalText(body.workspaceId),
            billingInterval,
          })
        : null;
    const enterprisePriceId = getStripePriceIdForPlan(targetPlan, config);
    const priceId =
      targetPlan === 'pro' ? governanceCheckout?.priceId ?? null : enterprisePriceId;

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            targetPlan === 'enterprise'
              ? 'Enterprise-Checkout ist noch nicht konfiguriert. Hinterlegen Sie STRIPE_PRICE_ENTERPRISE oder nutzen Sie den Sales-Kontakt.'
              : governanceCheckout?.tier
                ? `Für die erkannte Stufe (${governanceCheckout.description}) wurde kein aktiver Stripe-Preis gefunden.`
                : 'Das aktuelle Volumen liegt oberhalb der Pro-Stufen. Nutzen Sie bitte den Enterprise-Kontakt.',
        },
        { status: governanceCheckout?.tier ? 503 : 422 },
      );
    }

    const metadata = {
      plan: targetPlan,
      billingProductKey: toProductKey(targetPlan),
      productId: toProductKey(targetPlan),
      sourceApp: 'kiregister',
      sourceFlow: 'governance_settings_upgrade',
      userId: decoded.uid,
      userEmail: decoded.email,
      billingInterval,
      registerId: normalizeOptionalText(body.registerId) ?? '',
      workspaceId: normalizeOptionalText(body.workspaceId) ?? '',
      governanceTierId:
        targetPlan === 'pro' ? governanceCheckout?.tier?.id ?? '' : '',
      governanceTierLookupKey:
        targetPlan === 'pro' ? governanceCheckout?.lookupKey ?? '' : '',
      governanceTierUsers:
        targetPlan === 'pro'
          ? String(governanceCheckout?.usage.userCount ?? 0)
          : '',
      governanceTierUseCases:
        targetPlan === 'pro'
          ? String(governanceCheckout?.usage.useCaseCount ?? 0)
          : '',
    };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: buildBillingReturnUrl('{CHECKOUT_SESSION_ID}'),
      cancel_url: buildBillingCancelUrl(),
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      payment_method_collection: 'if_required',
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
      client_reference_id: decoded.uid,
      customer: existingEntitlement?.stripeCustomerId ?? undefined,
      customer_email: existingEntitlement?.stripeCustomerId
        ? undefined
        : decoded.email,
      metadata,
      subscription_data: {
        metadata,
      },
    });

    if (!checkoutSession.url) {
      logWarn('billing_checkout_missing_url', {
        email: decoded.email,
        requestedPlan: targetPlan,
        checkoutSessionId: checkoutSession.id,
      });
      return NextResponse.json(
        {
          error:
            'Stripe hat keinen Checkout-Link zurückgegeben. Bitte versuchen Sie es erneut.',
        },
        { status: 502 },
      );
    }

    logInfo('billing_checkout_created', {
      email: decoded.email,
      requestedPlan: targetPlan,
      checkoutSessionId: checkoutSession.id,
      billingInterval,
      governanceTierId: governanceCheckout?.tier?.id ?? null,
      useCaseCount: governanceCheckout?.usage.useCaseCount ?? null,
      userCount: governanceCheckout?.usage.userCount ?? null,
    });

    return NextResponse.json({
      checkoutSessionId: checkoutSession.id,
      targetPlan,
      targetLabel: toActionLabel(targetPlan),
      billingInterval,
      governanceTierLabel:
        targetPlan === 'pro' ? governanceCheckout?.description ?? null : null,
      url: checkoutSession.url,
    });
  } catch (error) {
    return handleBillingRouteError(error);
  }
}
