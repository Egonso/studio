import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logWarn } from '@/lib/observability/logger';
import { hashIpForAudit } from '@/lib/register-first/request-token-admin';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

const INVITE_COLLECTION = 'registerSupplierInvites';
const SIGNAL_COLLECTION = 'supplierConversionSignals';
const SIGNAL_LIMIT = 10;
const SIGNAL_WINDOW_MS = 15 * 60 * 1000;

const SupplierConversionSignalSchema = z
  .object({
    inviteId: z.string().trim().min(1).max(200),
    action: z.enum(['cta_clicked']),
    source: z.enum(['success_page']).default('success_page'),
  })
  .strict();

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? 'unknown';
  return forwardedFor.split(',')[0]?.trim() || 'unknown';
}

export async function POST(req: Request) {
  try {
    const body = SupplierConversionSignalSchema.parse(await req.json());
    const ipHash = hashIpForAudit(resolveClientIp(req));

    const rateLimit = await checkPublicRateLimit({
      namespace: 'supplier-conversion-signal',
      key: `${ipHash}:${body.inviteId}`,
      limit: SIGNAL_LIMIT,
      windowMs: SIGNAL_WINDOW_MS,
    });

    if (!rateLimit.ok) {
      return NextResponse.json({ error: 'Zu viele Signale in kurzer Zeit.' }, { status: 429 });
    }

    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(body.inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    }

    await db.collection(SIGNAL_COLLECTION).add({
      inviteId: body.inviteId,
      action: body.action,
      source: body.source,
      createdAt: new Date().toISOString(),
      ipHash,
      userAgent: req.headers.get('user-agent') ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungueltiges Signal.' }, { status: 400 });
    }

    logWarn('supplier_conversion_signal_failed', {
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    captureException(error, {
      boundary: 'app',
      component: 'supplier-conversion-signal-route',
      route: '/api/supplier-conversion/signal',
    });
    return NextResponse.json({ error: 'Signal konnte nicht verarbeitet werden.' }, { status: 500 });
  }
}
