import '@/lib/server-only-guard';

import { createHash, randomUUID } from 'node:crypto';

import { FieldValue } from 'firebase-admin/firestore';

import { getAdminDb } from '@/lib/firebase-admin';
import { logWarn } from '@/lib/observability/logger';
import { registerFirstFlags } from '@/lib/register-first/flags';

import {
  PRODUCT_FUNNEL_PRIVACY_VERSION,
  type ProductFunnelActionEventName,
  type ProductFunnelEventInput,
} from './product-funnel-contract';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTION_EVENT_NAMES = new Set<ProductFunnelActionEventName>([
  'review_completed',
  'supplier_submission_processed',
  'pass_generated',
  'pass_shared',
  'export_completed',
]);

interface ProductFunnelActorContext {
  authenticatedUserId?: string | null;
  externalReference?: string | null;
}

interface ProductFunnelMilestone {
  activatedAt?: string;
  returnedD7At?: string;
  returnedD30At?: string;
}

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isActionEventName(
  eventName: ProductFunnelEventInput['eventName'],
): eventName is ProductFunnelActionEventName {
  return ACTION_EVENT_NAMES.has(eventName as ProductFunnelActionEventName);
}

export function buildProductFunnelIdentityKey(input: {
  workspaceId?: string | null;
  authenticatedUserId?: string | null;
  anonymousSessionId: string;
}): string {
  const identity = input.workspaceId
    ? `workspace:${input.workspaceId}`
    : input.authenticatedUserId
      ? `user:${input.authenticatedUserId}`
      : `session:${input.anonymousSessionId}`;

  return hashIdentifier(identity);
}

function buildStoredEvent(
  event: ProductFunnelEventInput,
  actor: ProductFunnelActorContext,
  identityKey: string,
) {
  return {
    eventName: event.eventName,
    payload: event.payload,
    source: event.context.source,
    anonymousSessionIdHash: hashIdentifier(event.context.anonymousSessionId),
    authenticatedUserIdHash: actor.authenticatedUserId
      ? hashIdentifier(actor.authenticatedUserId)
      : null,
    workspaceIdHash: event.context.workspaceId
      ? hashIdentifier(event.context.workspaceId)
      : null,
    identityKey,
    occurredAt: event.context.occurredAt ?? new Date().toISOString(),
    recordedAt: FieldValue.serverTimestamp(),
    privacyVersion: PRODUCT_FUNNEL_PRIVACY_VERSION,
    externalReferenceHash: actor.externalReference
      ? hashIdentifier(actor.externalReference)
      : null,
  };
}

async function recordRetentionMilestones(
  event: ProductFunnelEventInput,
  actor: ProductFunnelActorContext,
  identityKey: string,
): Promise<void> {
  if (!isActionEventName(event.eventName)) {
    return;
  }
  const actionEventName = event.eventName;

  const db = getAdminDb();
  const milestoneRef = db.collection('productFunnelMilestones').doc(identityKey);
  const eventCollection = db.collection('productFunnelEvents');
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(milestoneRef);
    if (!snapshot.exists) return;

    const milestone = snapshot.data() as ProductFunnelMilestone;
    const activatedAt = milestone.activatedAt
      ? new Date(milestone.activatedAt)
      : null;
    if (!activatedAt || Number.isNaN(activatedAt.getTime())) return;

    const ageMs = now.getTime() - activatedAt.getTime();
    const updates: ProductFunnelMilestone = {};
    const derivedEvents: Array<'returned_d7_for_action' | 'returned_d30_for_action'> = [];

    if (ageMs >= 7 * DAY_MS && !milestone.returnedD7At) {
      updates.returnedD7At = now.toISOString();
      derivedEvents.push('returned_d7_for_action');
    }
    if (ageMs >= 30 * DAY_MS && !milestone.returnedD30At) {
      updates.returnedD30At = now.toISOString();
      derivedEvents.push('returned_d30_for_action');
    }

    if (derivedEvents.length === 0) return;

    transaction.set(milestoneRef, updates, { merge: true });
    for (const eventName of derivedEvents) {
      const derivedEvent: ProductFunnelEventInput = {
        eventName,
        payload: { action: actionEventName },
        context: event.context,
      };
      transaction.set(
        eventCollection.doc(randomUUID()),
        buildStoredEvent(derivedEvent, actor, identityKey),
      );
    }
  });
}

export async function recordProductFunnelEvent(
  event: ProductFunnelEventInput,
  actor: ProductFunnelActorContext = {},
): Promise<{ recorded: boolean; deduplicated: boolean }> {
  if (!registerFirstFlags.productFunnelAnalytics) {
    return { recorded: false, deduplicated: false };
  }

  try {
    const db = getAdminDb();
    const identityKey = buildProductFunnelIdentityKey({
      workspaceId: event.context.workspaceId,
      authenticatedUserId: actor.authenticatedUserId,
      anonymousSessionId: event.context.anonymousSessionId,
    });
    const eventRef = db.collection('productFunnelEvents').doc(randomUUID());

    if (event.eventName === 'first_real_use_case_completed') {
      const milestoneRef = db
        .collection('productFunnelMilestones')
        .doc(identityKey);
      let deduplicated = false;

      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(milestoneRef);
        if (snapshot.exists) {
          deduplicated = true;
          return;
        }

        const activatedAt =
          event.context.occurredAt ?? new Date().toISOString();
        transaction.set(milestoneRef, {
          identityKey,
          activatedAt,
          source: event.context.source,
          privacyVersion: PRODUCT_FUNNEL_PRIVACY_VERSION,
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.set(
          eventRef,
          buildStoredEvent(event, actor, identityKey),
        );
      });

      return { recorded: !deduplicated, deduplicated };
    }

    await eventRef.set(buildStoredEvent(event, actor, identityKey));
    await recordRetentionMilestones(event, actor, identityKey);
    return { recorded: true, deduplicated: false };
  } catch (error) {
    logWarn('product_funnel_event_record_failed', {
      eventName: event.eventName,
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    });
    return { recorded: false, deduplicated: false };
  }
}
