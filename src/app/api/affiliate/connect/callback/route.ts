import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/server-auth';
import { getAffiliateByEmail, updateAffiliate } from '@/lib/affiliate/server';
import { resolveStripeSecretKey, STRIPE_API_VERSION } from '@/lib/billing/stripe-server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = await requireUser(authHeader);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 });
    }

    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate?.stripeConnectAccountId) {
      return NextResponse.json({ error: 'No connect account' }, { status: 404 });
    }

    const secretKey = resolveStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
    const account = await stripe.accounts.retrieve(affiliate.stripeConnectAccountId);

    const isComplete =
      account.charges_enabled === true &&
      account.details_submitted === true;

    if (isComplete && !affiliate.stripeConnectOnboardingComplete) {
      await updateAffiliate(email, { stripeConnectOnboardingComplete: true });
    }

    return NextResponse.json({
      complete: isComplete,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.json(
      { error: 'Failed to check Connect status' },
      { status: 500 },
    );
  }
}
