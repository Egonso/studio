import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { tryEncryptSupplierInviteAccessUrl } from '@/lib/register-first/supplier-invite-delivery';
import { sendSupplierInviteEmail } from '@/lib/register-first/supplier-invite-email';
import { parseSupplierInviteCampaignRecord } from '@/lib/register-first/supplier-invite-campaign-schema';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  createSupplierInviteCampaignId,
  issueSupplierInvite,
  revokeActiveInvitesForRegister,
} from '@/lib/register-first/supplier-invites';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeEmailSchema,
  safeIdentifierSchema,
  safeOptionalPlainTextSchema,
} from '@/lib/security/request-security';

const CAMPAIGN_COLLECTION = 'registerSupplierInviteCampaigns';
const INVITE_COLLECTION = 'registerSupplierInvites';
const MAX_CONTACTS_PER_BATCH = 20;

const BatchContactSchema = z.object({
  intendedEmail: safeEmailSchema,
  supplierOrganisationHint: safeOptionalPlainTextSchema('Lieferantenorganisation', {
    max: 200,
  }),
});

const CreateBatchInviteBodySchema = z
  .object({
    registerId: safeIdentifierSchema,
    campaignLabel: safeOptionalPlainTextSchema('Bezeichnung', { max: 200 }),
    campaignContext: safeOptionalPlainTextSchema('Kontext', { max: 500 }),
    source: z.enum(['manual', 'csv']).default('manual'),
    contacts: z.array(BatchContactSchema).min(1).max(MAX_CONTACTS_PER_BATCH),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    if (!registerFirstFlags.supplierInviteV2) {
      return NextResponse.json(
        { error: 'Kontaktgebundene Lieferantenanfragen sind noch nicht aktiviert.' },
        { status: 404 },
      );
    }

    const authorizationHeader = req.headers.get('authorization');
    const body = CreateBatchInviteBodySchema.parse(
      await req.json().catch(() => ({})),
    );

    const { user, register } = await requireRegisterOwner(
      authorizationHeader,
      body.registerId,
    );

    const rateLimit = await enforceRequestRateLimit({
      request: req,
      namespace: 'supplier-invite:batch',
      key: buildRateLimitKey(req, user.uid, body.registerId),
      limit: 2,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: user.uid,
        registerId: body.registerId,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Sammelanfragen in kurzer Zeit. Bitte versuchen Sie es spaeter erneut.' },
        { status: 429 },
      );
    }

    const seenEmails = new Set<string>();
    const uniqueContacts = body.contacts.filter((contact) => {
      const email = contact.intendedEmail.trim().toLowerCase();
      if (seenEmails.has(email)) {
        return false;
      }

      seenEmails.add(email);
      return true;
    });

    if (uniqueContacts.length === 0) {
      return NextResponse.json(
        { error: 'Keine gueltigen Empfaenger fuer die Sammelanfrage vorhanden.' },
        { status: 400 },
      );
    }

    const campaignId = createSupplierInviteCampaignId();
    const now = new Date();
    const campaign = parseSupplierInviteCampaignRecord({
      campaignId,
      registerId: body.registerId,
      ownerId: user.uid,
      createdAt: now.toISOString(),
      createdBy: user.uid,
      createdByEmail: user.email,
      label: body.campaignLabel ?? null,
      context: body.campaignContext ?? null,
      source: body.source,
      recipientCount: uniqueContacts.length,
    });

    const issuedInvites = [];
    for (const contact of uniqueContacts) {
      await revokeActiveInvitesForRegister({
        ownerId: user.uid,
        registerId: body.registerId,
        revokedBy: user.uid,
        intendedEmail: contact.intendedEmail,
      });

      const issued = issueSupplierInvite({
        registerId: body.registerId,
        ownerId: user.uid,
        createdBy: user.uid,
        createdByEmail: user.email,
        intendedEmail: contact.intendedEmail,
        supplierOrganisationHint: contact.supplierOrganisationHint,
        campaignId,
        campaignLabel: campaign.label,
        campaignContext: campaign.context,
        campaignSource: campaign.source,
        now,
      });
      issued.record.inviteAccessUrlCiphertext = tryEncryptSupplierInviteAccessUrl(
        issued.publicUrl,
      );
      issuedInvites.push(issued);
    }

    const writeBatch = db.batch();
    writeBatch.set(
      db.collection(CAMPAIGN_COLLECTION).doc(campaign.campaignId),
      campaign,
    );
    for (const invite of issuedInvites) {
      writeBatch.set(
        db.collection(INVITE_COLLECTION).doc(invite.inviteId),
        invite.record,
      );
    }
    await writeBatch.commit();

    const organisationName =
      register.organisationName ?? register.name ?? 'Ihre Organisation';
    let inviteEmailSentCount = 0;
    let inviteEmailFailedCount = 0;

    for (const invite of issuedInvites) {
      try {
        await sendSupplierInviteEmail({
          inviteId: invite.inviteId,
          registerId: body.registerId,
          to: invite.record.intendedEmail,
          publicUrl: invite.publicUrl,
          organisationName,
          senderEmail: user.email,
          supplierOrganisationHint: invite.record.supplierOrganisationHint,
          campaignLabel: invite.record.campaignLabel,
          campaignContext: invite.record.campaignContext,
          expiresAt: invite.record.expiresAt,
        });
        inviteEmailSentCount += 1;
        await db.collection(INVITE_COLLECTION).doc(invite.inviteId).update({
          deliveryFailed: false,
          inviteEmailSentAt: new Date().toISOString(),
        });
      } catch (error) {
        inviteEmailFailedCount += 1;
        await db.collection(INVITE_COLLECTION).doc(invite.inviteId).update({
          deliveryFailed: true,
          inviteEmailSentAt: null,
        });

        logWarn('supplier_invite_email_failed', {
          inviteId: invite.inviteId,
          registerId: body.registerId,
          campaignId,
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    logInfo('supplier_invite_campaign_created', {
      registerId: body.registerId,
      ownerId: user.uid,
      campaignId,
      recipientCount: uniqueContacts.length,
      sourceRecipientCount: body.contacts.length,
      inviteEmailSentCount,
      inviteEmailFailedCount,
    });

    return NextResponse.json({
      campaignId,
      recipientCount: uniqueContacts.length,
      duplicateCount: body.contacts.length - uniqueContacts.length,
      inviteEmailSentCount,
      inviteEmailFailedCount,
      invites: issuedInvites.map((invite) => ({
        inviteId: invite.inviteId,
        intendedEmail: invite.record.intendedEmail,
        publicUrl: invite.publicUrl,
      })),
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
      component: 'supplier-invite-batch-post-route',
      route: '/api/supplier-invite/batch',
    });
    return NextResponse.json(
      { error: 'Sammelanfrage konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }
}
