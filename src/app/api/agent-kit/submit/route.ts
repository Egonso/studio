import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  authenticateAgentKitApiKey,
  isPersonalAgentKitScope,
  touchAgentKitApiKeyUsage,
} from '@/lib/agent-kit/api-keys';
import {
  buildRegisterUseCaseFromManifest,
  buildSubmittedUseCaseUrls,
  parseStudioUseCaseManifest,
} from '@/lib/agent-kit/manifest';
import { db } from '@/lib/firebase-admin';
import { sanitizeFirestorePayload } from '@/lib/register-first/firestore-sanitize';
import { findRegisterLocationById } from '@/lib/register-first/register-admin';

const submissionSchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  manifest: z.unknown(),
});

function resolveApiKey(request: NextRequest): string | null {
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey?.trim()) {
    return xApiKey.trim();
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.trim()) {
    return null;
  }

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return authorization.trim();
}

function mapAuthenticationError(reason: string) {
  switch (reason) {
    case 'revoked':
      return NextResponse.json(
        { error: 'Agent-Kit-API-Key wurde widerrufen.' },
        { status: 403 },
      );
    case 'workspace_access_revoked':
      return NextResponse.json(
        {
          error:
            'Der User hinter diesem Agent-Kit-API-Key hat keinen aktiven Workspace-Zugang mehr.',
        },
        { status: 403 },
      );
    case 'not_found':
    case 'token_mismatch':
    case 'hash_mismatch':
      return NextResponse.json(
        { error: 'Agent-Kit-API-Key ist ungueltig.' },
        { status: 401 },
      );
    default:
      return NextResponse.json(
        { error: 'Agent-Kit-API-Key fehlt oder ist ungueltig formatiert.' },
        { status: 401 },
      );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authentication = await authenticateAgentKitApiKey(resolveApiKey(req));
    if (!authentication.ok) {
      return mapAuthenticationError(authentication.reason);
    }

    const payload = submissionSchema.parse(await req.json());
    const manifest = parseStudioUseCaseManifest(payload.manifest);
    const personalScope = isPersonalAgentKitScope(
      authentication.record.orgId,
      authentication.record.createdByUserId,
    );
    const location = await findRegisterLocationById(payload.registerId, {
      ownerId: personalScope ? authentication.record.createdByUserId : undefined,
      workspaceId: personalScope ? undefined : authentication.record.orgId,
    });

    if (
      !location ||
      (personalScope
        ? location.ownerId !== authentication.record.createdByUserId
        : location.register.workspaceId !== authentication.record.orgId)
    ) {
      return NextResponse.json(
        {
          error: personalScope
            ? 'Register fuer diesen persoenlichen Bereich nicht gefunden.'
            : 'Register fuer diesen Workspace nicht gefunden.',
        },
        { status: 404 },
      );
    }

    const useCase = buildRegisterUseCaseFromManifest({
      manifest,
      createdByUserId: authentication.record.createdByUserId,
      createdByEmail: authentication.record.createdByEmail ?? null,
    });

    const useCaseRef = db.doc(
      `users/${location.ownerId}/registers/${location.registerId}/useCases/${useCase.useCaseId}`,
    );
    await useCaseRef.set(sanitizeFirestorePayload(useCase), { merge: false });

    await touchAgentKitApiKeyUsage({
      orgId: authentication.record.orgId,
      keyId: authentication.record.keyId,
      lastSubmittedUseCaseId: useCase.useCaseId,
    });

    const urls = buildSubmittedUseCaseUrls({
      useCaseId: useCase.useCaseId,
      workspaceId: personalScope ? null : authentication.record.orgId,
    });

    return NextResponse.json(
      {
        success: true,
        registerId: location.registerId,
        workspaceId: authentication.record.orgId,
        useCaseId: useCase.useCaseId,
        title: useCase.purpose,
        status: useCase.status,
        detailPath: urls.detailPath,
        detailUrl: urls.detailUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltige Agent-Kit-Einreichung.' },
        { status: 400 },
      );
    }

    console.error('Agent Kit submit failed:', error);
    return NextResponse.json(
      { error: 'Agent-Kit-Einreichung konnte nicht verarbeitet werden.' },
      { status: 500 },
    );
  }
}
