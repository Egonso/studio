import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAgentKitApiKey,
  isPersonalAgentKitScope,
  listAgentKitApiKeys,
  listAgentKitApiKeysForUser,
} from '@/lib/agent-kit/api-keys';
import {
  listPersonalRegisters,
  listWorkspaceRegisters,
} from '@/lib/register-first/register-admin';
import { getWorkspaceRecord } from '@/lib/workspace-admin';
import {
  ServerAuthError,
  requireUser,
  requireWorkspaceMember,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

const createAgentKitKeySchema = z.object({
  label: z.string().trim().min(3).max(120),
});

function handleError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Agent-Kit-Daten.' },
      { status: 400 },
    );
  }

  console.error('Agent Kit key route failed:', error);
  return NextResponse.json(
    { error: 'Agent-Kit-API-Key konnte nicht verarbeitet werden.' },
    { status: 500 },
  );
}

async function authorizeAgentKitScope(
  authorizationHeader: string | null,
  orgId: string,
) {
  const authOptions = {
    enforceSessionAge: false,
  } as const;
  const user = await requireUser(authorizationHeader, authOptions);
  if (isPersonalAgentKitScope(orgId, user.uid)) {
    return {
      user,
      role: 'OWNER' as const,
      isPersonalScope: true,
    };
  }

  const authorization = await requireWorkspaceMember(
    authorizationHeader,
    orgId,
    undefined,
    authOptions,
  );
  return {
    user: authorization.user,
    role: authorization.role,
    isPersonalScope: false,
  };
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await authorizeAgentKitScope(
      req.headers.get('authorization'),
      orgId,
    );
    const { isPersonalScope } = authorization;
    const [keys, registers, workspace] = await Promise.all([
      authorization.role === 'OWNER' || authorization.role === 'ADMIN'
        ? listAgentKitApiKeys(orgId)
        : listAgentKitApiKeysForUser(orgId, authorization.user.uid),
      isPersonalScope
        ? listPersonalRegisters(authorization.user.uid)
        : listWorkspaceRegisters(orgId),
      getWorkspaceRecord(orgId),
    ]);

    return NextResponse.json({
      keys,
      actorRole: authorization.role,
      workspace: isPersonalScope
        ? {
            orgId,
            name: 'Mein Register',
          }
        : workspace
        ? {
            orgId: workspace.orgId,
            name: workspace.name,
          }
        : {
            orgId,
            name: orgId,
          },
      registers: registers.map((location) => ({
        registerId: location.registerId,
        name:
          location.register.organisationName ??
          location.register.name ??
          location.registerId,
        ownerId: location.ownerId,
      })),
      submitEndpoint: '/api/agent-kit/submit',
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await authorizeAgentKitScope(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = createAgentKitKeySchema.parse(await req.json());
    const created = await createAgentKitApiKey({
      orgId,
      label: payload.label,
      createdByUserId: authorization.user.uid,
      createdByEmail: authorization.user.email,
    });

    return NextResponse.json(
      {
        key: created.summary,
        apiKey: created.apiKey,
        submitEndpoint: '/api/agent-kit/submit',
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
