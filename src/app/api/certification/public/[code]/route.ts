import { NextResponse } from 'next/server';

import { getPublicCertificateRecord } from '@/lib/certification/server';
import { buildRateLimitKey, enforceRequestRateLimit } from '@/lib/security/request-security';

interface PublicCertificateRouteContext {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(
  request: Request,
  context: PublicCertificateRouteContext,
) {
  const params = await context.params;
  const code = params.code?.trim();

  if (!code) {
    return NextResponse.json(
      { error: 'Certificate code is required.' },
      { status: 400 },
    );
  }

  const rateLimit = await enforceRequestRateLimit({
    request,
    namespace: 'certification-public-record',
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

  const certificate = await getPublicCertificateRecord(code);
  if (!certificate) {
    return NextResponse.json(
      { error: 'Certificate not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json(certificate);
}
