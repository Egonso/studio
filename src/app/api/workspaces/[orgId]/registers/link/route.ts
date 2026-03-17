import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { findRegisterLocationById } from '@/lib/register-first/register-admin';
import { ServerAuthError, requireWorkspaceAdmin } from '@/lib/server-auth';
import { safeIdentifierSchema } from '@/lib/security/request-security';
import { ensureRegisterLinkedToWorkspace } from '@/lib/workspace-admin';

const LinkWorkspaceRegisterSchema = z.object({
  registerId: safeIdentifierSchema,
});

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungültige Register-Verknüpfung.' },
      { status: 400 },
    );
  }

  console.error('Workspace register link failed:', error);
  return NextResponse.json(
    { error: 'Register konnte nicht mit dem Workspace verknüpft werden.' },
    { status: 500 },
  );
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceAdmin(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = LinkWorkspaceRegisterSchema.parse(await req.json());
    const location = await findRegisterLocationById(payload.registerId, {
      ownerId: authorization.user.uid,
      workspaceId: orgId,
    });

    if (!location || location.register.workspaceId !== orgId) {
      return NextResponse.json(
        { error: 'Register gehört nicht zum angefragten Workspace.' },
        { status: 404 },
      );
    }

    await ensureRegisterLinkedToWorkspace({
      orgId,
      registerId: payload.registerId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
