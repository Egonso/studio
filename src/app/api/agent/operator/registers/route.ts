import { NextRequest, NextResponse } from 'next/server';

import {
  findMissingAgentKitScopes,
  authenticateAgentKitHeaders,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import {
  listAgentOperatorRegisters,
  touchAgentOperatorReadUsage,
} from '@/lib/agent-kit/operator';

export async function GET(req: NextRequest) {
  try {
    const authentication = await authenticateAgentKitHeaders(req.headers);
    if (!authentication.ok) {
      const mapped = mapAgentKitAuthenticationError(authentication.reason);
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    const missingScopes = findMissingAgentKitScopes(authentication.record, [
      'read:register',
    ]);
    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Register lesen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const registers = await listAgentOperatorRegisters(authentication.record);
    await touchAgentOperatorReadUsage(authentication.record);

    return NextResponse.json({
      mode: 'read_only',
      scopes: authentication.record.scopes,
      registers,
    });
  } catch (error) {
    console.error('Agent operator registers route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Register konnten nicht geladen werden.' },
      { status: 500 },
    );
  }
}
