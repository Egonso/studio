import { NextRequest, NextResponse } from 'next/server';

import { listPersonalRegisters } from '@/lib/register-first/register-admin';
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
    const user = await requireUser(req.headers.get('authorization'));
    const [workspaces, personalRegisters] = await Promise.all([
      listUserWorkspaces(user.uid),
      listPersonalRegisters(user.uid),
    ]);

    const scopeOptions =
      personalRegisters.length > 0
        ? [
            {
              orgId: user.uid,
              orgName: 'Mein Register',
              role: 'OWNER' as const,
            },
            ...workspaces.map((workspace) => ({
              orgId: workspace.orgId,
              orgName: workspace.name,
              role: workspace.role,
            })),
          ]
        : workspaces.map((workspace) => ({
            orgId: workspace.orgId,
            orgName: workspace.name,
            role: workspace.role,
          }));

    return NextResponse.json({
      workspaces: scopeOptions,
    });
  } catch (error) {
    return handleError(error);
  }
}
