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
    if (!affiliate || !affiliate.active) {
      return NextResponse.json({ isAffiliate: false });
    }

    if (!affiliate.stripeConnectAccountId) {
      return NextResponse.json({
        isAffiliate: true,
        connected: false,
        onboardingComplete: false,
      });
    }

    // Check live status from Stripe
    const secretKey = resolveStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json({
        isAffiliate: true,
        connected: true,
        onboardingComplete: affiliate.stripeConnectOnboardingComplete,
      });
    }

    const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
    const account = await stripe.accounts.retrieve(affiliate.stripeConnectAccountId);

    const isComplete =
      account.charges_enabled === true &&
      account.details_submitted === true;

    // Sync status if needed
    if (isComplete && !affiliate.stripeConnectOnboardingComplete) {
      await updateAffiliate(email, { stripeConnectOnboardingComplete: true });
    }

    return NextResponse.json({
      isAffiliate: true,
      connected: true,
      onboardingComplete: isComplete,
      chargesEnabled: account.charges_enabled,
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 },
    );
  }
}
