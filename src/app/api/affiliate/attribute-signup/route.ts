import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import {
  createReferral,
  findReferralByReferredEmail,
  getAffiliateBySlug,
  getGlobalSettings,
  incrementAffiliateSignups,
  markReferralSignedUp,
  resolveEffectiveRates,
} from '@/lib/affiliate/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = await requireUser(authHeader);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const slug = (body.slug as string | undefined) ?? '';

    if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
      return NextResponse.json({ ok: false, reason: 'invalid_slug' });
    }

    // Don't create duplicate referrals
    const existing = await findReferralByReferredEmail(email);
    if (existing) {
      if (existing.status === 'clicked') {
        await markReferralSignedUp(existing.referralId, decoded.uid);
        await incrementAffiliateSignups(existing.affiliateEmail);
      }
      return NextResponse.json({ ok: true, already: true });
    }

    const affiliate = await getAffiliateBySlug(slug);
    if (!affiliate) {
      return NextResponse.json({ ok: false, reason: 'unknown_slug' });
    }

    // Prevent self-referral
    if (affiliate.email === email) {
      return NextResponse.json({ ok: false, reason: 'self_referral' });
    }

    const globalSettings = await getGlobalSettings();
    const { attributionWindowMonths } = resolveEffectiveRates(
      affiliate,
      globalSettings,
    );

    const referral = await createReferral({
      affiliateEmail: affiliate.email,
      affiliateSlug: affiliate.slug,
      referredEmail: email,
      attributionWindowMonths,
    });

    await markReferralSignedUp(referral.referralId, decoded.uid);
    await incrementAffiliateSignups(affiliate.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Affiliate attribute-signup error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
