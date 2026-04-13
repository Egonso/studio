import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/server-auth';
import { getAffiliateByEmail, updateAffiliate } from '@/lib/affiliate/server';
import { resolveStripeSecretKey, STRIPE_API_VERSION } from '@/lib/billing/stripe-server';
import { buildPublicAppUrl } from '@/lib/app-url';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = await requireUser(authHeader);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 });
    }

    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate || !affiliate.active) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });
    }

    const secretKey = resolveStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 },
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });

    // Create Express account or reuse existing
    let accountId = affiliate.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          kiregister_affiliate: 'true',
          affiliateSlug: affiliate.slug,
        },
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await updateAffiliate(email, { stripeConnectAccountId: accountId });
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: buildPublicAppUrl('/settings?section=affiliate&connect=refresh'),
      return_url: buildPublicAppUrl('/settings?section=affiliate&connect=complete'),
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect create error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 },
    );
  }
}
