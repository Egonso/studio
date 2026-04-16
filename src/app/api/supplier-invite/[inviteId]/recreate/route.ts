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
import { registerFirstFlags } from '@/lib/register-first/flags';

const INVITE_COLLECTION = 'registerSupplierInvites';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;

  try {
    if (!registerFirstFlags.supplierInviteV2) {
      return NextResponse.json(
        { error: 'Kontaktgebundene Lieferantenanfragen sind noch nicht aktiviert.' },
        { status: 404 },
      );
    }

    const authorizationHeader = req.headers.get('authorization');

    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    }

    const oldInvite = parseSupplierInviteRecord(inviteDoc.data());

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      oldInvite.registerId,
    );

    // Revoke old invite if still active/verified
    if (
      !oldInvite.revokedAt &&
      oldInvite.status !== 'revoked'
    ) {
      await revokeSupplierInvite(inviteId, user.uid);
    }

    // Issue new invite for same email
    const issued = issueSupplierInvite({
      registerId: oldInvite.registerId,
      ownerId: user.uid,
      createdBy: user.uid,
      createdByEmail: user.email,
      intendedEmail: oldInvite.intendedEmail,
      supplierOrganisationHint: oldInvite.supplierOrganisationHint,
      campaignId: oldInvite.campaignId,
      campaignLabel: oldInvite.campaignLabel,
      campaignContext: oldInvite.campaignContext,
      campaignSource: oldInvite.campaignSource,
      maxSubmissions: oldInvite.maxSubmissions,
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
        registerId: oldInvite.registerId,
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
        registerId: oldInvite.registerId,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }

    logInfo('supplier_invite_recreated', {
      oldInviteId: inviteId,
      newInviteId: issued.inviteId,
      registerId: oldInvite.registerId,
      createdBy: user.uid,
      inviteEmailSent,
    });

    return NextResponse.json({
      recreated: true,
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
      component: 'supplier-invite-recreate',
      route: `/api/supplier-invite/${inviteId}/recreate`,
    });
    return NextResponse.json(
      { error: 'Anfrage konnte nicht neu erstellt werden.' },
      { status: 500 },
    );
  }
}
