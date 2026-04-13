import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateBySlug, recordClick } from '@/lib/affiliate/server';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = (body.slug as string | undefined) ?? '';

    if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const affiliate = await getAffiliateBySlug(slug);
    if (!affiliate) {
      return NextResponse.json({ ok: true }); // silent – don't reveal slug existence
    }

    // Build a simple visitor fingerprint from IP + user-agent for dedup
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const ua = request.headers.get('user-agent') ?? '';
    const fingerprint = createHash('sha256')
      .update(`${ip}:${ua}`)
      .digest('hex')
      .slice(0, 16);

    await recordClick({
      affiliateSlug: affiliate.slug,
      affiliateEmail: affiliate.email,
      visitorFingerprint: fingerprint,
      referrer: request.headers.get('referer'),
      userAgent: ua.slice(0, 256),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Affiliate track error:', error);
    return NextResponse.json({ ok: true }); // never leak errors on tracking
  }
}
