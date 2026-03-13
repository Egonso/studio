import { NextResponse } from 'next/server';

import { requireDevAdminActor } from '@/lib/certification/dev-admin';
import { regenerateCertificateDocument } from '@/lib/certification/server';

export async function POST(request: Request) {
  try {
    const actor = requireDevAdminActor(request);
    const body = (await request.json()) as {
      certificateId?: string;
    };

    if (!body.certificateId?.trim()) {
      return NextResponse.json(
        { error: 'Certificate ID is required.' },
        { status: 400 },
      );
    }

    const certificate = await regenerateCertificateDocument(actor, body.certificateId.trim());
    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Dev admin regenerate route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Regeneration failed.' },
      { status: 400 },
    );
  }
}
