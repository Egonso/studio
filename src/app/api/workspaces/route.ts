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
    const workspaces = await listUserWorkspaces(user.uid);

    return NextResponse.json({
      workspaces: workspaces.map((workspace) => ({
        orgId: workspace.orgId,
        orgName: workspace.name,
        role: workspace.role,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
