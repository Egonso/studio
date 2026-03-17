import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { issueSupplierRequestToken } from '@/lib/register-first/request-tokens';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeIdentifierSchema,
} from '@/lib/security/request-security';

const RequestTokenBodySchema = z
  .object({
    registerId: safeIdentifierSchema,
  })
  .strict();

const RequestTokenQuerySchema = z.object({
  registerId: safeIdentifierSchema,
});

async function revokeActiveTokensForRegister(input: {
  ownerId: string;
  ownerEmail: string;
  registerId: string;
  reason: 'manual' | 'replaced' | 'register_deleted';
}) {
  const snapshot = await db
    .collection('registerRequestTokens')
    .where('ownerId', '==', input.ownerId)
    .get();

  const activeDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return (
      data.registerId === input.registerId && (data.revokedAt ?? null) === null
    );
  });

  if (activeDocs.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const batch = db.batch();
  activeDocs.forEach((doc) => {
    batch.update(doc.ref, {
      revokedAt: now,
      revokedBy: input.ownerId,
      revokedByEmail: input.ownerEmail,
      revocationReason: input.reason,
    });
  });
  await batch.commit();
  return activeDocs.length;
}

export async function POST(req: NextRequest) {
  try {
    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json(
        {
          error:
            'Lieferanten-Link ist lokal nicht verfügbar. Firebase-Admin-Credentials fehlen in dieser Umgebung.',
        },
        { status: 503 },
      );
    }

    const authorizationHeader = req.headers.get('authorization');
    const body = RequestTokenBodySchema.parse(
      await req.json().catch(() => ({})),
    );
    const registerId = body.registerId;

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      registerId,
    );
    const rateLimit = await enforceRequestRateLimit({
      request: req,
      namespace: 'supplier-request-token:create',
      key: buildRateLimitKey(req, user.uid, registerId),
      limit: 6,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: user.uid,
        registerId,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Zu viele Link-Erstellungen in kurzer Zeit. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 },
      );
    }

    await revokeActiveTokensForRegister({
      ownerId: user.uid,
      ownerEmail: user.email,
      registerId,
      reason: 'replaced',
    });

    const issued = issueSupplierRequestToken({
      registerId,
      ownerId: user.uid,
      createdBy: user.uid,
      createdByEmail: user.email,
    });

    await db
      .collection('registerRequestTokens')
      .doc(issued.record.tokenId)
      .set(issued.record);

    logInfo('supplier_request_token_issued', {
      ownerId: user.uid,
      registerId,
      tokenId: issued.tokenId,
    });

    return NextResponse.json({
      tokenId: issued.tokenId,
      publicUrl: issued.publicUrl,
      expiresAt: issued.record.expiresAt,
      organisationName: register.organisationName ?? register.name ?? null,
    });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Eingabe.' },
        { status: 400 },
      );
    }

    captureException(error, {
      boundary: 'app',
      component: 'request-token-post-route',
      route: '/api/request-tokens',
    });
    return NextResponse.json(
      { error: 'Lieferanten-Link konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json(
        {
          error:
            'Lieferanten-Link kann lokal nicht widerrufen werden. Firebase-Admin-Credentials fehlen in dieser Umgebung.',
        },
        { status: 503 },
      );
    }

    const authorizationHeader = req.headers.get('authorization');
    const { registerId } = RequestTokenQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
    });

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      registerId,
    );
    const rateLimit = await enforceRequestRateLimit({
      request: req,
      namespace: 'supplier-request-token:revoke',
      key: buildRateLimitKey(req, user.uid, registerId),
      limit: 6,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: user.uid,
        registerId,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Zu viele Widerrufe in kurzer Zeit. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 },
      );
    }

    const revokedCount = await revokeActiveTokensForRegister({
      ownerId: user.uid,
      ownerEmail: user.email,
      registerId,
      reason: 'manual',
    });

    logInfo('supplier_request_token_revoked', {
      ownerId: user.uid,
      registerId,
      revokedCount,
    });

    return NextResponse.json({
      success: true,
      revokedCount,
      organisationName: register.organisationName ?? register.name ?? null,
    });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Eingabe.' },
        { status: 400 },
      );
    }

    captureException(error, {
      boundary: 'app',
      component: 'request-token-delete-route',
      route: '/api/request-tokens',
    });
    return NextResponse.json(
      { error: 'Lieferanten-Link konnte nicht widerrufen werden.' },
      { status: 500 },
    );
  }
}
