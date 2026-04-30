import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { z } from 'zod';

import { buildPublicAppUrl } from '@/lib/app-url';
import {
  createStripeServerClient,
  resolveStripeBillingConfiguration,
} from '@/lib/billing/stripe-server';
import { logError, logWarn } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

const FORTBILDUNG_PRICE_CENTS = 49_500;
const FORTBILDUNG_LOOKUP_KEY =
  'ki-register-fortbildung-neulaunch-2026-one-year';
const FORTBILDUNG_PRODUCT_ID = 'fortbildung_neulaunch_package';
const FORTBILDUNG_SOURCE_FLOW = 'fortbildung_neulaunch_checkout';

const FortbildungCheckoutSchema = z
  .object({
    locale: z.enum(['de', 'en']).optional(),
  })
  .strict();

function normalizeEnvValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function resolveFortbildungPriceId(): string | null {
  return (
    normalizeEnvValue(process.env.STRIPE_PRICE_FORTBILDUNG_NEULAUNCH) ??
    normalizeEnvValue(process.env.STRIPE_PRICE_FORTBILDUNG_PACKAGE)
  );
}

function buildFortbildungSuccessUrl(locale: 'de' | 'en'): string {
  const returnTo = encodeURIComponent(`/${locale}/kurs`);
  const path =
    `/${locale}/control/welcome?checkout_session_id={CHECKOUT_SESSION_ID}` +
    `&source=checkout&first_run=true&returnTo=${returnTo}`;

  return buildPublicAppUrl(path).replace(
    '%7BCHECKOUT_SESSION_ID%7D',
    '{CHECKOUT_SESSION_ID}',
  );
}

function buildFortbildungCancelUrl(locale: 'de' | 'en'): string {
  return buildPublicAppUrl(`/${locale}/fortbildung?checkout=cancelled`);
}

function buildAccessExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);
  return expiresAt.toISOString();
}

async function resolveLineItem(
  stripe: ReturnType<typeof createStripeServerClient>,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const explicitPriceId = resolveFortbildungPriceId();
  if (explicitPriceId) {
    const price = await stripe.prices.retrieve(explicitPriceId);
    if (price.recurring) {
      throw new Error(
        `Configured Fortbildung price ${price.id} is recurring. Use a one-time price for the 495€ one-year package.`,
      );
    }

    return { price: explicitPriceId, quantity: 1 };
  }

  const lookupMatch = await stripe.prices.list({
    active: true,
    lookup_keys: [FORTBILDUNG_LOOKUP_KEY],
    limit: 1,
  });
  const existingPrice = lookupMatch.data[0];
  if (existingPrice) {
    return { price: existingPrice.id, quantity: 1 };
  }

  return {
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: FORTBILDUNG_PRICE_CENTS,
      product_data: {
        name: 'KI Register Fortbildungspaket – 1 Jahr Zugang',
        description:
          'EU-AI-Act-Hauptkurs, zwei Neulaunch-Bonuskurse, 1 Jahr Zugang, 1 Person, 1 Projekt.',
        metadata: {
          plan: 'pro',
          productId: FORTBILDUNG_PRODUCT_ID,
          billingProductKey: 'governance_control_center',
          sourceFlow: FORTBILDUNG_SOURCE_FLOW,
        },
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = FortbildungCheckoutSchema.parse(
      await request.json().catch(() => ({})),
    );
    const locale = body.locale ?? 'de';
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'fortbildung-checkout',
      key: buildRateLimitKey(request, FORTBILDUNG_SOURCE_FLOW),
      limit: 20,
      windowMs: 15 * 60 * 1000,
      logContext: {
        sourceFlow: FORTBILDUNG_SOURCE_FLOW,
      },
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Zu viele Checkout-Starts in kurzer Zeit. Bitte versuchen Sie es in wenigen Minuten erneut.',
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

    const stripe = createStripeServerClient(config);
    const lineItem = await resolveLineItem(stripe);
    const accessExpiresAt = buildAccessExpiresAt();
    const metadata = {
      plan: 'pro',
      billingProductKey: 'governance_control_center',
      productId: FORTBILDUNG_PRODUCT_ID,
      sourceApp: 'kiregister',
      sourceFlow: FORTBILDUNG_SOURCE_FLOW,
      accessDurationMonths: '12',
      accessExpiresAt,
      includedPersons: '1',
      includedProjects: '1',
      includedMainCourse: 'eu_ai_act_main_course',
      includedBonusCourses: 'governance_foundation,legal_readability',
    };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: buildFortbildungSuccessUrl(locale),
      cancel_url: buildFortbildungCancelUrl(locale),
      line_items: [lineItem],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      client_reference_id: FORTBILDUNG_PRODUCT_ID,
      metadata,
      custom_fields: [
        {
          key: 'organisation',
          label: {
            type: 'custom',
            custom: locale === 'de' ? 'Organisation' : 'Organisation',
          },
          type: 'text',
          optional: true,
        },
        {
          key: 'projektkontext',
          label: {
            type: 'custom',
            custom:
              locale === 'de'
                ? 'Projektkontext / erster KI-Einsatzfall'
                : 'Project context / first AI use case',
          },
          type: 'text',
          optional: true,
        },
      ],
    });

    if (!checkoutSession.url) {
      logWarn('fortbildung_checkout_missing_url', {
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

    return NextResponse.json({
      checkoutSessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Checkout-Anfrage.' },
        { status: 400 },
      );
    }

    logError('fortbildung_checkout_failed', {
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
}
