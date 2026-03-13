import { NextResponse } from 'next/server';

import { requireDevAdminActor } from '@/lib/certification/dev-admin';
import { updateCertificateByAdmin } from '@/lib/certification/server';

export async function POST(request: Request) {
  try {
    const actor = requireDevAdminActor(request);
    const body = (await request.json()) as {
      certificateId?: string;
      status?: 'active' | 'expired' | 'revoked';
      validUntil?: string | null;
      note?: string;
    };

    if (!body.certificateId?.trim()) {
      return NextResponse.json(
        { error: 'Certificate ID is required.' },
        { status: 400 },
      );
    }

    const certificate = await updateCertificateByAdmin(actor, {
      certificateId: body.certificateId.trim(),
      status: body.status,
      validUntil: typeof body.validUntil === 'undefined' ? undefined : body.validUntil,
      note: body.note,
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Dev admin update route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Certificate update failed.' },
      { status: 400 },
    );
  }
}
