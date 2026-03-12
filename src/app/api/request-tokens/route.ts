import { NextRequest, NextResponse } from 'next/server';

import { db, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { issueSupplierRequestToken } from '@/lib/register-first/request-tokens';

function normalizeRegisterId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('/')) return null;
  return trimmed;
}

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
    const body = await req.json().catch(() => ({}));
    const registerId = normalizeRegisterId(body?.registerId);

    if (!registerId) {
      return NextResponse.json(
        { error: 'registerId is required.' },
        { status: 400 },
      );
    }

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      registerId,
    );

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
    const registerId = normalizeRegisterId(
      req.nextUrl.searchParams.get('registerId'),
    );

    if (!registerId) {
      return NextResponse.json(
        { error: 'registerId is required.' },
        { status: 400 },
      );
    }

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      registerId,
    );

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
