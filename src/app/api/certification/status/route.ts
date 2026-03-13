import { NextResponse } from 'next/server';

import { requireCertificationActor } from '@/lib/certification/request-auth';
import { getUserCertificationSnapshot } from '@/lib/certification/server';

export async function GET(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const snapshot = await getUserCertificationSnapshot(actor.email);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Certification status route failed:', error);
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }
}
