import { db } from '@/lib/firebase-admin';
import type {
  NotificationEventType,
  WorkspaceRecord,
} from './workspace';

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function buildWorkspaceWebhookPayload(input: {
  workspace: Pick<WorkspaceRecord, 'orgId' | 'name'>;
  eventType: NotificationEventType;
  eventId: string;
  occurredAt?: string;
  data: Record<string, unknown>;
}) {
  return {
    eventId: input.eventId,
    eventType: input.eventType,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    workspace: {
      orgId: input.workspace.orgId,
      name: input.workspace.name,
    },
    data: input.data,
  };
}

export async function deliverWorkspaceNotificationHooks(input: {
  workspaceId: string;
  eventType: NotificationEventType;
  eventId: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const workspaceSnapshot = await db
    .collection('workspaces')
    .doc(input.workspaceId)
    .get();
  if (!workspaceSnapshot.exists) {
    return;
  }

  const workspace = workspaceSnapshot.data() as WorkspaceRecord;
  const matchingHooks = (workspace.enterpriseSettings?.notifications?.hooks ?? []).filter(
    (hook) => hook.enabled && hook.eventType === input.eventType,
  );
  if (matchingHooks.length === 0) {
    return;
  }

  const payload = buildWorkspaceWebhookPayload({
    workspace,
    eventType: input.eventType,
    eventId: input.eventId,
    data: input.data,
  });
  const occurredAt = String(payload.occurredAt);

  await Promise.allSettled(
    matchingHooks.map(async (hook) => {
      const response = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ki-register-event': input.eventType,
          'x-ki-register-hook-id': hook.webhookId,
          ...(normalizeOptionalText(hook.secretLabel)
            ? { 'x-ki-register-hook-secret-label': hook.secretLabel! }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook ${hook.webhookId} failed with ${response.status}`);
      }

      await db
        .collection('workspaces')
        .doc(input.workspaceId)
        .set(
          {
            enterpriseSettings: {
              notifications: {
                hooks: (workspace.enterpriseSettings.notifications.hooks ?? []).map(
                  (entry) =>
                    entry.webhookId === hook.webhookId
                      ? {
                          ...entry,
                          lastTriggeredAt: occurredAt,
                        }
                      : entry,
                ),
              },
            },
          },
          { merge: true },
        );
    }),
  );
}
