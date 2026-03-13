import { NextResponse } from 'next/server';

import { requireDevAdminActor } from '@/lib/certification/dev-admin';
import { issueManualCertificate } from '@/lib/certification/server';

export async function POST(request: Request) {
  try {
    const actor = requireDevAdminActor(request);
    const body = (await request.json()) as {
      email?: string;
      holderName?: string;
      company?: string | null;
      validityMonths?: number | null;
      userId?: string | null;
    };

    if (!body.email?.trim() || !body.holderName?.trim()) {
      return NextResponse.json(
        { error: 'Email and holder name are required.' },
        { status: 400 },
      );
    }

    const certificate = await issueManualCertificate(actor, {
      email: body.email.trim(),
      holderName: body.holderName.trim(),
      company: body.company?.trim() || null,
      validityMonths: body.validityMonths ?? null,
      userId: body.userId ?? null,
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Dev admin issue route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Manual issue failed.' },
      { status: 400 },
    );
  }
}
