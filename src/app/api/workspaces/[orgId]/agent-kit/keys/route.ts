import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAgentKitApiKey,
  listAgentKitApiKeys,
  listAgentKitApiKeysForUser,
} from '@/lib/agent-kit/api-keys';
import { listWorkspaceRegisters } from '@/lib/register-first/register-admin';
import {
  ServerAuthError,
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

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceMember(
      req.headers.get('authorization'),
      orgId,
    );
    const [keys, registers] = await Promise.all([
      authorization.role === 'OWNER' || authorization.role === 'ADMIN'
        ? listAgentKitApiKeys(orgId)
        : listAgentKitApiKeysForUser(orgId, authorization.user.uid),
      listWorkspaceRegisters(orgId),
    ]);

    return NextResponse.json({
      keys,
      actorRole: authorization.role,
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
    const authorization = await requireWorkspaceMember(
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
