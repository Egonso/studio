import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { captureException } from '@/lib/observability/error-tracking';
import { logInfo } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
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

    // Revoke any active V2 invites for this register
    await revokeActiveInvitesForRegister({
      ownerId: user.uid,
      registerId: body.registerId,
      revokedBy: user.uid,
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

    await persistSupplierInvite(issued.record);

    logInfo('supplier_invite_v2_issued', {
      ownerId: user.uid,
      registerId: body.registerId,
      inviteId: issued.inviteId,
      intendedDomain: issued.record.intendedDomain,
    });

    return NextResponse.json({
      inviteId: issued.inviteId,
      publicUrl: issued.publicUrl,
      expiresAt: issued.record.expiresAt,
      intendedEmail: issued.record.intendedEmail,
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
