import { NextRequest, NextResponse } from 'next/server';

import {
  buildBillingCancelUrl,
  createStripeServerClient,
  resolveStripeBillingConfiguration,
} from '@/lib/billing/stripe-server';
import {
  readCustomerEntitlement,
  upsertCustomerEntitlement,
} from '@/lib/billing/product-entitlement-sync';
import { buildCustomerEntitlementRecord } from '@/lib/billing/stripe-entitlements';
import { logError, logInfo } from '@/lib/observability/logger';
import { ServerAuthError, requireUser } from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

function handlePortalRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  logError('billing_portal_failed', {
    errorMessage: error instanceof Error ? error.message : 'unknown',
  });

  return NextResponse.json(
    {
      error:
        'Billing konnte gerade nicht geöffnet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
    },
    { status: 500 },
  );
}

async function resolveStripeCustomerId(email: string): Promise<string | null> {
  const existingEntitlement = await readCustomerEntitlement(email);
  if (existingEntitlement?.stripeCustomerId) {
    return existingEntitlement.stripeCustomerId;
  }

  const config = resolveStripeBillingConfiguration();
  const stripe = createStripeServerClient(config);
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });
  const customer = customers.data[0] ?? null;

  if (!customer) {
    return null;
  }

  if (existingEntitlement) {
    await upsertCustomerEntitlement(
      buildCustomerEntitlementRecord({
        email,
        plan: existingEntitlement.plan,
        status: existingEntitlement.status,
        source: existingEntitlement.source,
        updatedAt: existingEntitlement.updatedAt,
        productId: existingEntitlement.productId,
        billingProductKey: existingEntitlement.billingProductKey,
        checkoutSessionId: existingEntitlement.checkoutSessionId,
        stripeCustomerId: customer.id,
        subscriptionId: existingEntitlement.subscriptionId,
      }),
    );
  }

  return customer.id;
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request.headers.get('authorization'));
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'billing-portal',
      key: buildRateLimitKey(request, decoded.uid, decoded.email),
      limit: 10,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: decoded.uid,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Zu viele Billing-Portal-Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 },
      );
    }

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

    const stripeCustomerId = await resolveStripeCustomerId(decoded.email);
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            'Für dieses Konto wurde noch kein Stripe-Kunde gefunden. Öffnen Sie zuerst den Checkout oder kontaktieren Sie den Support.',
        },
        { status: 404 },
      );
    }

    const stripe = createStripeServerClient(config);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: buildBillingCancelUrl(),
      configuration: config.billingPortalConfigurationId ?? undefined,
    });

    logInfo('billing_portal_created', {
      email: decoded.email,
      stripeCustomerId,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    return handlePortalRouteError(error);
  }
}
