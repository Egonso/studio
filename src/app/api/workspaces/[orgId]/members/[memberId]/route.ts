import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '@/lib/workspace-admin';
import { ServerAuthError, requireWorkspaceAdmin } from '@/lib/server-auth';

const UpdateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'REVIEWER', 'MEMBER', 'EXTERNAL_OFFICER']),
});

interface RouteContext {
  params: Promise<{ orgId: string; memberId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Rollenangabe.' },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    switch (error.message) {
      case 'WORKSPACE_NOT_FOUND':
        return NextResponse.json(
          { error: 'Workspace nicht gefunden.' },
          { status: 404 },
        );
      case 'MEMBER_NOT_FOUND':
        return NextResponse.json(
          { error: 'Mitglied nicht gefunden.' },
          { status: 404 },
        );
      case 'OWNER_ROLE_IMMUTABLE':
      case 'OWNER_REMOVAL_FORBIDDEN':
        return NextResponse.json(
          { error: 'Die Workspace-Eigentuemerschaft kann hier nicht geaendert werden.' },
          { status: 409 },
        );
      default:
        break;
    }
  }

  console.error('Workspace member mutation failed:', error);
  return NextResponse.json(
    { error: 'Mitglied konnte nicht aktualisiert werden.' },
    { status: 500 },
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { orgId, memberId } = await context.params;

  try {
    await requireWorkspaceAdmin(req.headers.get('authorization'), orgId);
    const payload = UpdateMemberSchema.parse(await req.json());
    const member = await updateWorkspaceMemberRole({
      orgId,
      memberUserId: memberId,
      role: payload.role,
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { orgId, memberId } = await context.params;

  try {
    await requireWorkspaceAdmin(req.headers.get('authorization'), orgId);
    await removeWorkspaceMember({
      orgId,
      memberUserId: memberId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
