import { NextRequest, NextResponse } from 'next/server';

import { getAgentOpenApiSpec } from '@/lib/agent-ready-distribution';

export function GET(req: NextRequest) {
  return NextResponse.json(getAgentOpenApiSpec(req.nextUrl.origin), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
