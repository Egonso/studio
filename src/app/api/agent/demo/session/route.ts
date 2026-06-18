import { NextRequest, NextResponse } from 'next/server';

import { getAgentDemoSession } from '@/lib/agent-ready-distribution';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

function getRateLimitKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous-agent-demo'
  );
}

export async function GET(req: NextRequest) {
  const rateLimit = await checkPublicRateLimit({
    namespace: 'agent-demo-session',
    key: getRateLimitKey(req),
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error:
          'Demo-Session vorübergehend begrenzt. Bitte versuchen Sie es später erneut.',
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

  return NextResponse.json(getAgentDemoSession(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
