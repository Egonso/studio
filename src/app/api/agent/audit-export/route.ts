import { NextResponse } from 'next/server';

import { getAgentDistributionAuditExport } from '@/lib/agent-ready-distribution';

export function GET() {
  return NextResponse.json(getAgentDistributionAuditExport(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
