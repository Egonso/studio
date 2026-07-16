import { createHash, randomUUID } from 'node:crypto';

import * as admin from 'firebase-admin';

export interface FunctionsProductFunnelEvent {
  eventName: 'training_purchase_completed';
  anonymousSessionId: string;
  source: 'stripe_webhook';
  plan: 'solo' | 'team' | 'enterprise';
  externalReference: string;
  occurredAt: string;
}

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function recordFunctionsProductFunnelEvent(
  db: admin.firestore.Firestore,
  event: FunctionsProductFunnelEvent,
): Promise<void> {
  const identityKey = hashIdentifier(`session:${event.anonymousSessionId}`);
  await db.collection('productFunnelEvents').doc(randomUUID()).set({
    eventName: event.eventName,
    payload: { plan: event.plan },
    source: event.source,
    anonymousSessionIdHash: hashIdentifier(event.anonymousSessionId),
    authenticatedUserIdHash: null,
    workspaceIdHash: null,
    identityKey,
    occurredAt: event.occurredAt,
    recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    privacyVersion: '2026-07-16',
    externalReferenceHash: hashIdentifier(event.externalReference),
  });
}
