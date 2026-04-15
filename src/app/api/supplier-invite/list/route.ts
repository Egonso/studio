import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { captureException } from '@/lib/observability/error-tracking';
import { logWarn } from '@/lib/observability/logger';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { parseSupplierInviteCampaignRecord } from '@/lib/register-first/supplier-invite-campaign-schema';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { safeIdentifierSchema } from '@/lib/security/request-security';
import type {
  SupplierInviteCampaignRecord,
  SupplierInviteRecord,
} from '@/lib/register-first/supplier-invite-types';

const INVITE_COLLECTION = 'registerSupplierInvites';
const CAMPAIGN_COLLECTION = 'registerSupplierInviteCampaigns';

const ListQuerySchema = z.object({
  registerId: safeIdentifierSchema,
});

function isRecoverableOverviewError(error: unknown): boolean {
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code.toLowerCase()
      : '';
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
        ? error.toLowerCase()
        : '';

  return (
    code.includes('permission-denied') ||
    code.includes('insufficient-permission') ||
    code.includes('failed-precondition') ||
    message.includes('missing or insufficient permissions') ||
    message.includes('the caller does not have permission') ||
    message.includes('insufficient authentication scopes') ||
    message.includes('query requires an index') ||
    message.includes('failed precondition') ||
    message.includes('could not load the default credentials') ||
    message.includes('default credentials') ||
    message.includes('7 permission_denied')
  );
}

function safeParseInviteRecord(
  rawRecord: unknown,
  id: string,
): SupplierInviteRecord | null {
  try {
    return parseSupplierInviteRecord(rawRecord);
  } catch (error) {
    console.warn('Skipping invalid supplier invite record', { id, error });
    return null;
  }
}

function safeParseCampaignRecord(
  rawRecord: unknown,
  id: string,
): SupplierInviteCampaignRecord | null {
  try {
    return parseSupplierInviteCampaignRecord(rawRecord);
  } catch (error) {
    console.warn('Skipping invalid supplier invite campaign', { id, error });
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = ListQuerySchema.parse({
      registerId: searchParams.get('registerId'),
    });

    const authorizationHeader = req.headers.get('authorization');
    await requireRegisterOwner(authorizationHeader, query.registerId);

    if (!hasFirebaseAdminCredentials()) {
      logWarn('supplier_invite_list_degraded_no_admin_credentials', {
        registerId: query.registerId,
      });
      return NextResponse.json({
        invites: [],
        campaigns: [],
        degraded: true,
      });
    }

    const [inviteSnapshot, campaignSnapshot] = await Promise.all([
      db
        .collection(INVITE_COLLECTION)
        .where('registerId', '==', query.registerId)
        .orderBy('createdAt', 'desc')
        .limit(250)
        .get(),
      db
        .collection(CAMPAIGN_COLLECTION)
        .where('registerId', '==', query.registerId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get(),
    ]);

    const invites: SupplierInviteRecord[] = inviteSnapshot.docs
      .map((doc) => safeParseInviteRecord(doc.data(), doc.id))
      .filter((record): record is SupplierInviteRecord => record !== null);
    const campaigns: SupplierInviteCampaignRecord[] = campaignSnapshot.docs
      .map((doc) => safeParseCampaignRecord(doc.data(), doc.id))
      .filter((record): record is SupplierInviteCampaignRecord => record !== null);

    // Strip internal security and delivery fields before returning to client.
    const sanitized = invites.map(
      ({
        secretHash: _secret,
        inviteAccessUrlCiphertext: _inviteAccessUrlCiphertext,
        lastUsedIpHash: _lastUsedIpHash,
        ...rest
      }) => rest,
    );

    return NextResponse.json({ invites: sanitized, campaigns });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage.' },
        { status: 400 },
      );
    }

    if (isRecoverableOverviewError(error)) {
      logWarn('supplier_invite_list_degraded', {
        registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
        errorMessage: error instanceof Error ? error.message : 'unknown',
      });
      return NextResponse.json({
        invites: [],
        campaigns: [],
        degraded: true,
      });
    }

    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-list',
      route: '/api/supplier-invite/list',
    });
    return NextResponse.json(
      { error: 'Lieferantenanfragen konnten nicht geladen werden.' },
      { status: 500 },
    );
  }
}
