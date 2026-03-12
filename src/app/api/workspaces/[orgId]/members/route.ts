import { NextRequest, NextResponse } from 'next/server';

import {
  getWorkspaceRecord,
  listPendingWorkspaceInvites,
  listWorkspaceMembers,
} from '@/lib/workspace-admin';
import { ServerAuthError, requireWorkspaceMember } from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Workspace members route failed:', error);
  return NextResponse.json(
    { error: 'Workspace-Mitglieder konnten nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceMember(
      req.headers.get('authorization'),
      orgId,
    );

    const [workspace, members, pendingInvites] = await Promise.all([
      getWorkspaceRecord(orgId),
      listWorkspaceMembers(orgId),
      listPendingWorkspaceInvites(orgId),
    ]);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace nicht gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      workspace: {
        orgId: workspace.orgId,
        name: workspace.name,
        ownerUserId: workspace.ownerUserId,
        plan: workspace.plan,
      },
      actorRole: authorization.role,
      members,
      pendingInvites,
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
