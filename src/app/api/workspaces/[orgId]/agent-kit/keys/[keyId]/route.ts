import { NextRequest, NextResponse } from 'next/server';

import {
  getAgentKitApiKeyRecord,
  isPersonalAgentKitScope,
  revokeAgentKitApiKey,
} from '@/lib/agent-kit/api-keys';
import {
  ServerAuthError,
  requireUser,
  requireWorkspaceMember,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string; keyId: string }>;
}

function handleError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Agent Kit key revoke route failed:', error);
  return NextResponse.json(
    { error: 'Agent-Kit-API-Key konnte nicht widerrufen werden.' },
    { status: 500 },
  );
}

async function authorizeAgentKitScope(
  authorizationHeader: string | null,
  orgId: string,
) {
  const user = await requireUser(authorizationHeader);
  if (isPersonalAgentKitScope(orgId, user.uid)) {
    return {
      user,
      role: 'OWNER' as const,
    };
  }

  const authorization = await requireWorkspaceMember(authorizationHeader, orgId);
  return {
    user: authorization.user,
    role: authorization.role,
  };
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { orgId, keyId } = await context.params;

  try {
    const authorization = await authorizeAgentKitScope(
      req.headers.get('authorization'),
      orgId,
    );
    const record = await getAgentKitApiKeyRecord(orgId, keyId);
    if (!record) {
      return NextResponse.json(
        { error: 'Agent-Kit-API-Key nicht gefunden.' },
        { status: 404 },
      );
    }

    const canRevoke =
      record.createdByUserId === authorization.user.uid ||
      authorization.role === 'OWNER' ||
      authorization.role === 'ADMIN';

    if (!canRevoke) {
      return NextResponse.json(
        { error: 'Dieser Agent-Kit-API-Key kann von Ihnen nicht widerrufen werden.' },
        { status: 403 },
      );
    }

    const revoked = await revokeAgentKitApiKey({
      orgId,
      keyId,
      revokedByUserId: authorization.user.uid,
      revokedByEmail: authorization.user.email,
    });

    return NextResponse.json({
      success: true,
      key: revoked,
    });
  } catch (error) {
    return handleError(error);
  }
}
