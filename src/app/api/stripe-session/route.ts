import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * API Route to retrieve customer email from a Stripe Checkout Session.
 * Used after successful purchase to pre-fill registration form.
 * 
 * GET /api/stripe-session?session_id=cs_xxx
 */
export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing session_id parameter' },
            { status: 400 }
        );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        console.error('STRIPE_SECRET_KEY not configured');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-04-10',
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Get email from various possible sources
        const customerEmail =
            session.customer_details?.email ||
            session.customer_email ||
            null;

        if (!customerEmail) {
            // Try to get from customer object if available
            if (typeof session.customer === 'string') {
                const customer = await stripe.customers.retrieve(session.customer);
                if (customer && !customer.deleted && customer.email) {
                    return NextResponse.json({
                        customer_email: customer.email.toLowerCase()
                    });
                }
            }

            return NextResponse.json(
                { error: 'No email found in session' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            customer_email: customerEmail.toLowerCase()
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
