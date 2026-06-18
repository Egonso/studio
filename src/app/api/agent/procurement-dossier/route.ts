import { NextRequest, NextResponse } from 'next/server';

import {
  getProcurementDossier,
  renderProcurementDossierMarkdown,
} from '@/lib/agent-ready-distribution';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

function getRateLimitKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous-agent-dossier'
  );
}

export async function GET(req: NextRequest) {
  const rateLimit = await checkPublicRateLimit({
    namespace: 'agent-procurement-dossier',
    key: getRateLimitKey(req),
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error:
          'Dossier-Erstellung vorübergehend begrenzt. Bitte versuchen Sie es später erneut.',
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

  const dossier = getProcurementDossier();
  if (req.nextUrl.searchParams.get('format') === 'markdown') {
    return new NextResponse(renderProcurementDossierMarkdown(dossier), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(dossier, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
