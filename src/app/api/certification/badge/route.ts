import { NextResponse } from 'next/server';

import { getBadgePreviewData } from '@/lib/certification/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.trim();

  if (!code) {
    return NextResponse.json(
      { error: 'Certificate code is required.' },
      { status: 400 },
    );
  }

  const result = await getBadgePreviewData(code);
  if (!result.html) {
    return NextResponse.json(
      { error: 'Badge is only available for active certificates.' },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
