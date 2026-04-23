import { NextResponse } from 'next/server';

import { getBadgePreviewData } from '@/lib/certification/server';
import type { BadgeAlignment } from '@/lib/certification/types';
import { buildRateLimitKey, enforceRequestRateLimit } from '@/lib/security/request-security';

function parseAlignment(value: string | null): BadgeAlignment {
  if (value === 'left' || value === 'right') {
    return value;
  }

  return 'center';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.trim();
  const alignment = parseAlignment(url.searchParams.get('alignment'));

  if (!code) {
    return NextResponse.json(
      { error: 'Certificate code is required.' },
      { status: 400 },
    );
  }

  const rateLimit = await enforceRequestRateLimit({
    request,
    namespace: 'certification-badge',
    key: buildRateLimitKey(request, code),
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Zu viele Abfragen in kurzer Zeit.' },
      { status: 429 },
    );
  }

  const result = await getBadgePreviewData(code, alignment);
  if (!result.html) {
    return NextResponse.json(
      { error: 'Badge is only available for active certificates.' },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
