import { createHash } from 'node:crypto';

export type NotificationKind = 'auth_user_created' | 'feedback_created';
export type ClaimState = 'claim' | 'busy' | 'complete';

export function hashNotificationSourceId(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function notificationDocumentId(
  kind: NotificationKind,
  sourceId: string,
): string {
  return `${kind}_${hashNotificationSourceId(sourceId).slice(0, 32)}`;
}

export function resolveClaimState(
  status: unknown,
  leaseUntilMs: number,
  nowMs: number,
): ClaimState {
  if (status === 'accepted' || status === 'failed_permanent') {
    return 'complete';
  }

  if (status === 'attempting' && leaseUntilMs > nowMs) {
    return 'busy';
  }

  return 'claim';
}
