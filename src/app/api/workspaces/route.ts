import { NextRequest, NextResponse } from 'next/server';

import { buildAgentKitScopeOptions } from '@/lib/agent-kit/scope-options';
import { listUserWorkspaces } from '@/lib/workspace-admin';
import { requireUser, ServerAuthError } from '@/lib/server-auth';

function handleError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Workspace list route failed:', error);
  return NextResponse.json(
    { error: 'Workspaces konnten nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers.get('authorization'), {
      enforceSessionAge: false,
    });
    const workspaces = await Promise.resolve(listUserWorkspaces(user.uid))
      .catch((error) => {
        console.error('Workspace list route workspace lookup failed:', error);
        return [];
      });
    const scopeOptions = buildAgentKitScopeOptions({
      userId: user.uid,
      workspaces,
    });

    return NextResponse.json({
      workspaces: scopeOptions,
    });
  } catch (error) {
    return handleError(error);
  }
}
