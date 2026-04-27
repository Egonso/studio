import { NextRequest, NextResponse } from 'next/server';

import { recordLandingPageView } from '@/lib/admin/landing-page-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    await recordLandingPageView({
      locale: typeof body?.locale === 'string' ? body.locale : undefined,
    });
  } catch (error) {
    console.error('Landing page view tracking failed', error);
  }

  return NextResponse.json({ ok: true });
}
