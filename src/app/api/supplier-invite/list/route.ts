import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { captureException } from '@/lib/observability/error-tracking';
import { ServerAuthError, requireRegisterOwner } from '@/lib/server-auth';
import { db } from '@/lib/firebase-admin';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { safeIdentifierSchema } from '@/lib/security/request-security';
import type { SupplierInviteRecord } from '@/lib/register-first/supplier-invite-types';

const INVITE_COLLECTION = 'registerSupplierInvites';

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

    const snapshot = await db
      .collection(INVITE_COLLECTION)
      .where('registerId', '==', query.registerId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const invites: SupplierInviteRecord[] = snapshot.docs.map((doc) =>
      parseSupplierInviteRecord(doc.data())
    );

    // Strip secretHash before returning to client
    const sanitized = invites.map(({ secretHash: _secret, ...rest }) => rest);

    return NextResponse.json({ invites: sanitized });
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
