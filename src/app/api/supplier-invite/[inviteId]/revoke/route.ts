import { NextRequest, NextResponse } from 'next/server';

import { captureException } from '@/lib/observability/error-tracking';
import { logInfo } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { revokeSupplierInvite } from '@/lib/register-first/supplier-invites';

const INVITE_COLLECTION = 'registerSupplierInvites';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;

  try {
    const authorizationHeader = req.headers.get('authorization');

    // Load invite to find registerId
    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    }

    const invite = parseSupplierInviteRecord(inviteDoc.data());

    // Verify caller owns the register
    const { user } = await requireRegisterOwner(
      authorizationHeader,
      invite.registerId,
    );

    // Idempotent: if already revoked, return success
    if (invite.revokedAt || invite.status === 'revoked') {
      return NextResponse.json({ revoked: true, alreadyRevoked: true });
    }

    await revokeSupplierInvite(inviteId, user.uid);

    logInfo('supplier_invite_revoked', {
      inviteId,
      registerId: invite.registerId,
      revokedBy: user.uid,
    });

    return NextResponse.json({ revoked: true });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-revoke',
      route: `/api/supplier-invite/${inviteId}/revoke`,
    });
    return NextResponse.json(
      { error: 'Anfrage konnte nicht widerrufen werden.' },
      { status: 500 },
    );
  }
}
