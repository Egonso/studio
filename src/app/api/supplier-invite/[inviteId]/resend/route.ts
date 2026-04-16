import { NextRequest, NextResponse } from 'next/server';

import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
import { tryEncryptSupplierInviteAccessUrl } from '@/lib/register-first/supplier-invite-delivery';
import { sendSupplierInviteEmail } from '@/lib/register-first/supplier-invite-email';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import {
  issueSupplierInvite,
  persistSupplierInvite,
  revokeSupplierInvite,
} from '@/lib/register-first/supplier-invites';

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

    const { user, register } = await requireRegisterOwner(
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

    await revokeSupplierInvite(inviteId, user.uid);

    const issued = issueSupplierInvite({
      registerId: invite.registerId,
      ownerId: user.uid,
      createdBy: user.uid,
      createdByEmail: user.email,
      intendedEmail: invite.intendedEmail,
      supplierOrganisationHint: invite.supplierOrganisationHint,
      campaignId: invite.campaignId,
      campaignLabel: invite.campaignLabel,
      campaignContext: invite.campaignContext,
      campaignSource: invite.campaignSource,
      maxSubmissions: invite.maxSubmissions,
    });
    issued.record.inviteAccessUrlCiphertext = tryEncryptSupplierInviteAccessUrl(
      issued.publicUrl,
    );

    await persistSupplierInvite(issued.record);

    const organisationName =
      register.organisationName ?? register.name ?? 'Ihre Organisation';
    let inviteEmailSent = false;

    try {
      await sendSupplierInviteEmail({
        inviteId: issued.inviteId,
        registerId: invite.registerId,
        to: issued.record.intendedEmail,
        publicUrl: issued.publicUrl,
        organisationName,
        senderEmail: user.email,
        supplierOrganisationHint: issued.record.supplierOrganisationHint,
        campaignLabel: issued.record.campaignLabel,
        campaignContext: issued.record.campaignContext,
        expiresAt: issued.record.expiresAt,
      });
      inviteEmailSent = true;
      await db.collection(INVITE_COLLECTION).doc(issued.inviteId).update({
        deliveryFailed: false,
        inviteEmailSentAt: new Date().toISOString(),
      });
    } catch (error) {
      await db.collection(INVITE_COLLECTION).doc(issued.inviteId).update({
        deliveryFailed: true,
        inviteEmailSentAt: null,
      });

      logWarn('supplier_invite_email_failed', {
        inviteId: issued.inviteId,
        registerId: invite.registerId,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }

    logInfo('supplier_invite_resend', {
      oldInviteId: inviteId,
      newInviteId: issued.inviteId,
      registerId: invite.registerId,
      resendBy: user.uid,
      inviteEmailSent,
    });

    return NextResponse.json({
      resent: true,
      newInviteId: issued.inviteId,
      publicUrl: issued.publicUrl,
      expiresAt: issued.record.expiresAt,
      intendedEmail: issued.record.intendedEmail,
      organisationName: register.organisationName ?? register.name ?? null,
      inviteEmailSent,
    });
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
