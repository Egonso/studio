import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
import { tryEncryptSupplierInviteAccessUrl } from '@/lib/register-first/supplier-invite-delivery';
import { sendSupplierInviteEmail } from '@/lib/register-first/supplier-invite-email';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  issueSupplierInvite,
  persistSupplierInvite,
  revokeActiveInvitesForRegister,
} from '@/lib/register-first/supplier-invites';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeIdentifierSchema,
} from '@/lib/security/request-security';

const CreateInviteBodySchema = z
  .object({
    registerId: safeIdentifierSchema,
    intendedEmail: z.string().trim().email().max(320),
    supplierOrganisationHint: z.string().trim().min(1).max(200).optional(),
    maxSubmissions: z.number().int().min(1).max(100).optional(),
  })
  .strict();

const INVITE_COLLECTION = 'registerSupplierInvites';

type InviteEmailFailureStage =
  | 'email_send'
  | 'invite_record_update'
  | 'invite_record_mark_failed';

export async function POST(req: NextRequest) {
  try {
    if (!registerFirstFlags.supplierInviteV2) {
      return NextResponse.json(
        { error: 'Kontaktgebundene Lieferantenanfragen sind noch nicht aktiviert.' },
        { status: 404 },
      );
    }

    const authorizationHeader = req.headers.get('authorization');
    const body = CreateInviteBodySchema.parse(
      await req.json().catch(() => ({})),
    );

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      body.registerId,
    );

    const rateLimit = await enforceRequestRateLimit({
      request: req,
      namespace: 'supplier-invite:create',
      key: buildRateLimitKey(req, user.uid, body.registerId),
      limit: 6,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: user.uid,
        registerId: body.registerId,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es spaeter erneut.' },
        { status: 429 },
      );
    }

    // Replace only an existing open invite for the same recipient.
    await revokeActiveInvitesForRegister({
      ownerId: user.uid,
      registerId: body.registerId,
      revokedBy: user.uid,
      intendedEmail: body.intendedEmail,
    });

    const issued = issueSupplierInvite({
      registerId: body.registerId,
      ownerId: user.uid,
      createdBy: user.uid,
      createdByEmail: user.email,
      intendedEmail: body.intendedEmail,
      supplierOrganisationHint: body.supplierOrganisationHint,
      maxSubmissions: body.maxSubmissions,
    });
    issued.record.inviteAccessUrlCiphertext = tryEncryptSupplierInviteAccessUrl(
      issued.publicUrl,
    );

    await persistSupplierInvite(issued.record);

    const organisationName =
      register.organisationName ?? register.name ?? 'Ihre Organisation';
    let inviteEmailSent = false;
    let inviteEmailFailureReason: string | null = null;
    let inviteEmailFailureStage: InviteEmailFailureStage | null = null;

    try {
      await sendSupplierInviteEmail({
        inviteId: issued.inviteId,
        registerId: body.registerId,
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
    } catch (error) {
      inviteEmailFailureReason =
        error instanceof Error ? error.message : 'unknown';
      inviteEmailFailureStage = 'email_send';
    }

    if (inviteEmailSent) {
      try {
        await db.collection(INVITE_COLLECTION).doc(issued.inviteId).update({
          deliveryFailed: false,
          inviteEmailSentAt: new Date().toISOString(),
        });
      } catch (error) {
        inviteEmailFailureReason =
          error instanceof Error ? error.message : 'unknown';
        inviteEmailFailureStage = 'invite_record_update';

        logWarn('supplier_invite_email_record_update_failed', {
          inviteId: issued.inviteId,
          registerId: body.registerId,
          reason: inviteEmailFailureReason,
        });
      }
    } else {
      try {
        await db.collection(INVITE_COLLECTION).doc(issued.inviteId).update({
          deliveryFailed: true,
          inviteEmailSentAt: null,
        });
      } catch (error) {
        const updateReason =
          error instanceof Error ? error.message : 'unknown';

        inviteEmailFailureReason = inviteEmailFailureReason
          ? `${inviteEmailFailureReason}; failed to mark invite delivery state: ${updateReason}`
          : updateReason;
        inviteEmailFailureStage = 'invite_record_mark_failed';

        logWarn('supplier_invite_email_failure_state_update_failed', {
          inviteId: issued.inviteId,
          registerId: body.registerId,
          reason: updateReason,
        });
      }
    }

    if (!inviteEmailSent) {
      logWarn('supplier_invite_email_failed', {
        inviteId: issued.inviteId,
        registerId: body.registerId,
        reason: inviteEmailFailureReason ?? 'unknown',
        stage: inviteEmailFailureStage ?? 'email_send',
      });
    }

    logInfo('supplier_invite_v2_issued', {
      ownerId: user.uid,
      registerId: body.registerId,
      inviteId: issued.inviteId,
      intendedDomain: issued.record.intendedDomain,
      inviteEmailSent,
      inviteEmailFailureStage,
    });

    return NextResponse.json({
      inviteId: issued.inviteId,
      publicUrl: issued.publicUrl,
      expiresAt: issued.record.expiresAt,
      intendedEmail: issued.record.intendedEmail,
      organisationName: register.organisationName ?? register.name ?? null,
      inviteEmailSent,
      inviteEmailFailureReason,
      inviteEmailFailureStage,
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
        { error: error.issues[0]?.message ?? 'Ungueltige Eingabe.' },
        { status: 400 },
      );
    }

    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-post-route',
      route: '/api/supplier-invite',
    });
    return NextResponse.json(
      { error: 'Kontaktgebundene Lieferantenanfrage konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }
}
