import { NextRequest, NextResponse } from 'next/server';

import { normalizeLandingVideoEvent } from '@/lib/analytics/landing-video-events';
import { recordLandingVideoEvent } from '@/lib/admin/landing-video-analytics';

export async function POST(request: NextRequest) {
  const payload = normalizeLandingVideoEvent(
    await request.json().catch(() => null),
  );
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await recordLandingVideoEvent(payload);
  } catch (error) {
    console.error('Landing video event tracking failed', error);
  }

  return NextResponse.json({ ok: true });
}
