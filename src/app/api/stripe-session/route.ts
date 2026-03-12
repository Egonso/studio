import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { inferCheckoutEntitlementPlan } from '@/lib/billing/stripe-entitlements';

const STRIPE_API_VERSION = '2025-02-24.acacia' as Stripe.LatestApiVersion;

/**
 * API Route to retrieve customer email from a Stripe Checkout Session.
 * Used after successful purchase to pre-fill registration form.
 * 
 * GET /api/stripe-session?session_id=cs_xxx
 */
function resolveStripeSecretKey(): string | null {
    return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || null;
}

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing session_id parameter' },
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

        if (!customerEmail) {
            // Try to get from customer object if available
            if (typeof session.customer === 'string') {
                const customer = await stripe.customers.retrieve(session.customer);
                if (customer && !customer.deleted && customer.email) {
                    return NextResponse.json({
                        customer_email: customer.email.toLowerCase(),
                        entitlement_plan: entitlementPlan,
                        checkout_claimable: entitlementPlan === 'pro' || entitlementPlan === 'enterprise',
                    });
                }
            }

            return NextResponse.json(
                { error: 'No email found in session' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            customer_email: customerEmail.toLowerCase(),
            entitlement_plan: entitlementPlan,
            checkout_claimable: entitlementPlan === 'pro' || entitlementPlan === 'enterprise',
        });

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
