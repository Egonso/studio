import { NextRequest, NextResponse } from 'next/server';

import { prepareAgenticCommerceSandboxIntent } from '@/lib/agent-ready-distribution';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

function getRateLimitKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous-commerce-sandbox'
  );
}

export async function POST(req: NextRequest) {
  const rateLimit = await checkPublicRateLimit({
    namespace: 'agent-commerce-sandbox',
    key: getRateLimitKey(req),
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error:
          'Checkout-Vorbereitung vorübergehend begrenzt. Bitte versuchen Sie es später erneut.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000),
          ),
        },
      },
    );
  }

  await req.json().catch(() => null);

  return NextResponse.json(prepareAgenticCommerceSandboxIntent(), {
    status: 202,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
