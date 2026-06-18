import { NextResponse } from 'next/server';

import { getA2AAgentCard } from '@/lib/agent-ready-distribution';

export function GET() {
  return NextResponse.json(getA2AAgentCard(), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
