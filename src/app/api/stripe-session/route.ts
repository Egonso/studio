import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { inferCheckoutEntitlementPlan } from '@/lib/billing/stripe-entitlements';
import { buildCheckoutReturnPayload } from '@/lib/billing/checkout-return';
import {
  resolveStripeSecretKey,
  STRIPE_API_VERSION,
} from '@/lib/billing/stripe-server';

/**
 * API Route to retrieve customer email from a Stripe Checkout Session.
 * Used after successful purchase to pre-fill registration form.
 * 
 * GET /api/stripe-session?session_id=cs_xxx
 */

function isValidStripeCheckoutSessionId(value: string): boolean {
    return /^cs_(test|live)_[A-Za-z0-9]+$/.test(value);
}

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing session_id parameter' },
            { status: 400 }
        );
    }

    if (!isValidStripeCheckoutSessionId(sessionId)) {
        return NextResponse.json(
            { error: 'Invalid session_id parameter' },
            { status: 400 }
        );
    }

    const stripeSecretKey = resolveStripeSecretKey();

    if (!stripeSecretKey) {
        console.error('Stripe key not configured (expected STRIPE_SECRET_KEY or STRIPE_API_KEY)');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: STRIPE_API_VERSION,
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.status !== 'complete') {
            return NextResponse.json(
                { error: 'Checkout session not completed' },
                { status: 409 }
            );
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
            limit: 20,
            expand: ['data.price.product'],
        });

        // Get email from various possible sources
        const customerEmail =
            session.customer_details?.email ||
            session.customer_email ||
            null;

        const entitlementPlan = inferCheckoutEntitlementPlan({
            metadata: session.metadata,
            productId: session.metadata?.productId ?? null,
            lineItems: lineItems.data.map((item) => {
                const product = item.price?.product;
                return {
                    priceId: item.price?.id ?? null,
                    lookupKey: item.price?.lookup_key ?? null,
                    productId: typeof product === 'string' ? product : product?.id ?? null,
                    productName:
                        typeof product === 'object' && product && 'name' in product
                            ? product.name ?? null
                            : null,
                    description: item.description ?? null,
                };
            }),
        });

        let customerObjectEmail: string | null = null;
        if (!customerEmail && typeof session.customer === 'string') {
            const customer = await stripe.customers.retrieve(session.customer);
            if (customer && !customer.deleted) {
                customerObjectEmail = customer.email ?? null;
            }
        }

        const payload = buildCheckoutReturnPayload({
            sessionCustomerEmail: customerEmail,
            customerEmail: customerObjectEmail,
            entitlementPlan,
        });

        if (!payload) {
            return NextResponse.json(
                { error: 'No email found in session' },
                { status: 404 }
            );
        }

        return NextResponse.json(payload);

    } catch (error: any) {
        console.error('Error retrieving Stripe session:', error.message);

        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json(
                { error: 'Invalid session ID' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to retrieve session' },
            { status: 500 }
        );
    }
}
