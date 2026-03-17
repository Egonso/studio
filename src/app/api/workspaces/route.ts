import { NextRequest, NextResponse } from 'next/server';

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
    const workspacesResult = await Promise.resolve(listUserWorkspaces(user.uid))
      .then((workspaces) => ({ ok: true as const, workspaces }))
      .catch((error) => {
        console.error('Workspace list route workspace lookup failed:', error);
        return { ok: false as const, workspaces: [] };
      });

    const scopeOptions = [
      {
        orgId: user.uid,
        orgName: 'Mein Register',
        role: 'OWNER' as const,
      },
      ...workspacesResult.workspaces
        .filter((workspace) => workspace.orgId !== user.uid)
        .map((workspace) => ({
          orgId: workspace.orgId,
          orgName: workspace.name,
          role: workspace.role,
        })),
    ];

    return NextResponse.json({
      workspaces: scopeOptions,
    });
  } catch (error) {
    return handleError(error);
  }
}
