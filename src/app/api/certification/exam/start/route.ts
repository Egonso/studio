import { NextResponse } from 'next/server';

import { requireCertificationActor } from '@/lib/certification/request-auth';
import { startExamAttempt } from '@/lib/certification/server';

export async function POST(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const attempt = await startExamAttempt(actor);
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Exam start route failed:', error);
    return NextResponse.json(
      { error: 'Exam attempt could not be started.' },
      { status: 400 },
    );
  }
}
