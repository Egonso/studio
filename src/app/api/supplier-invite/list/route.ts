import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { captureException } from '@/lib/observability/error-tracking';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = ListQuerySchema.parse({
      registerId: searchParams.get('registerId'),
    });

    const authorizationHeader = req.headers.get('authorization');
    await requireRegisterOwner(authorizationHeader, query.registerId);

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

    const invites: SupplierInviteRecord[] = inviteSnapshot.docs.map((doc) =>
      parseSupplierInviteRecord(doc.data())
    );
    const campaigns: SupplierInviteCampaignRecord[] = campaignSnapshot.docs.map((doc) =>
      parseSupplierInviteCampaignRecord(doc.data())
    );

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
