import { NextResponse } from 'next/server';

import { getAgentDiscoveryResponse } from '@/lib/agent-ready-distribution';

export function GET() {
  return NextResponse.json(getAgentDiscoveryResponse(), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
