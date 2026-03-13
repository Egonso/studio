import { NextResponse } from 'next/server';

import { getPublicCertificateRecord } from '@/lib/certification/server';

interface PublicCertificateRouteContext {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(
  _request: Request,
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

  const certificate = await getPublicCertificateRecord(code);
  if (!certificate) {
    return NextResponse.json(
      { error: 'Certificate not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json(certificate);
}
