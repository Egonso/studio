import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AGENT_KIT_API_KEY_SCOPE_VALUES,
  createAgentKitApiKey,
  normalizeAgentKitApiKeyScopes,
  type AgentKitApiKeyScope,
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
  scopes: z
    .array(z.enum(AGENT_KIT_API_KEY_SCOPE_VALUES))
    .min(1)
    .max(AGENT_KIT_API_KEY_SCOPE_VALUES.length)
    .optional(),
});

function isSubmitOnlyScopeSet(scopes: readonly AgentKitApiKeyScope[]): boolean {
  return scopes.length === 1 && scopes[0] === 'submit:usecase';
}

function canCreateAgentKitScopeSet(
  role: 'OWNER' | 'ADMIN' | 'REVIEWER' | 'MEMBER' | 'EXTERNAL_OFFICER',
  scopes: readonly AgentKitApiKeyScope[],
): boolean {
  return isSubmitOnlyScopeSet(scopes) || role === 'OWNER' || role === 'ADMIN';
}

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
      operatorEndpoint: '/api/agent/operator',
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
    const scopes = normalizeAgentKitApiKeyScopes(payload.scopes);
    if (!canCreateAgentKitScopeSet(authorization.role, scopes)) {
      return NextResponse.json(
        {
          error:
            'Nur Owner und Admins koennen Agent-Kit-Keys mit Operator- oder Schreib-Scopes erstellen.',
        },
        { status: 403 },
      );
    }

    const created = await createAgentKitApiKey({
      orgId,
      label: payload.label,
      scopes,
      createdByUserId: authorization.user.uid,
      createdByEmail: authorization.user.email,
    });

    return NextResponse.json(
      {
        key: created.summary,
        apiKey: created.apiKey,
        submitEndpoint: '/api/agent-kit/submit',
        operatorEndpoint: '/api/agent/operator',
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
