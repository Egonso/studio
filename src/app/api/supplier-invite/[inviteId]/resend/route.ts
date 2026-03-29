import { NextRequest, NextResponse } from 'next/server';

import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { updateSupplierInviteStatus } from '@/lib/register-first/supplier-invites';

const INVITE_COLLECTION = 'registerSupplierInvites';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;

  try {
    const authorizationHeader = req.headers.get('authorization');

    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    }

    const invite = parseSupplierInviteRecord(inviteDoc.data());

    const { user } = await requireRegisterOwner(
      authorizationHeader,
      invite.registerId,
    );

    // Cannot resend a submitted or revoked invite
    if (invite.status === 'submitted') {
      logWarn('supplier_invite_resend_rejected', {
        inviteId,
        reason: 'already_submitted',
      });
      return NextResponse.json(
        { error: 'Diese Anfrage wurde bereits beantwortet und kann nicht erneut gesendet werden.' },
        { status: 409 },
      );
    }

    if (invite.status === 'revoked' || invite.revokedAt) {
      return NextResponse.json(
        { error: 'Diese Anfrage wurde widerrufen und kann nicht erneut gesendet werden.' },
        { status: 409 },
      );
    }

    if (new Date(invite.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Diese Anfrage ist abgelaufen. Bitte erstellen Sie eine neue Anfrage.' },
        { status: 410 },
      );
    }

    // Reset to active (re-enables OTP flow)
    await updateSupplierInviteStatus(inviteId, 'active', {
      lastUsedAt: null,
    });

    logInfo('supplier_invite_resend', {
      inviteId,
      registerId: invite.registerId,
      resendBy: user.uid,
    });

    return NextResponse.json({ resent: true });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-resend',
      route: `/api/supplier-invite/${inviteId}/resend`,
    });
    return NextResponse.json(
      { error: 'Anfrage konnte nicht erneut gesendet werden.' },
      { status: 500 },
    );
  }
}
