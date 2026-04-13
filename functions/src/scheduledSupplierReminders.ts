import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import * as sgMail from '@sendgrid/mail';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import {
  createSupplierReminderOptOutUrl,
  decryptSupplierInviteAccessUrl,
} from './supplierInviteDelivery';

const INVITE_COLLECTION = 'registerSupplierInvites';
const DEFAULT_MAX_REMINDERS = 2;

interface SupplierInviteRecord {
  inviteId: string;
  registerId: string;
  ownerId: string;
  status: 'active' | 'verified' | 'submitted' | 'revoked' | 'expired';
  intendedEmail: string;
  supplierOrganisationHint?: string | null;
  campaignLabel?: string | null;
  campaignContext?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  inviteAccessUrlCiphertext?: string | null;
  inviteEmailSentAt?: string | null;
  deliveryFailed?: boolean;
  remindersSent?: number;
  lastReminderAt?: string | null;
  reminderOptOut?: boolean;
  maxReminders?: number;
}

function getFunctionsConfig() {
  return functions.config?.() as {
    sendgrid?: {
      api_key?: string;
      reminder_template_id?: string;
      from_email?: string;
    };
  };
}

function resolveSendGridApiKey(): string | null {
  return process.env.SENDGRID_API_KEY || getFunctionsConfig().sendgrid?.api_key || null;
}

function resolveReminderTemplateId(): string | null {
  return (
    process.env.SENDGRID_SUPPLIER_REMINDER_TEMPLATE_ID ||
    getFunctionsConfig().sendgrid?.reminder_template_id ||
    null
  );
}

function resolveSenderEmail(): string | null {
  return (
    process.env.SENDGRID_FROM_EMAIL ||
    getFunctionsConfig().sendgrid?.from_email ||
    null
  );
}

function formatExpiry(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getReminderNumber(record: SupplierInviteRecord, now: Date): number | null {
  if (record.status !== 'active' && record.status !== 'verified') {
    return null;
  }

  if (record.revokedAt || new Date(record.expiresAt) <= now) {
    return null;
  }

  if (!record.inviteEmailSentAt || record.reminderOptOut || record.deliveryFailed) {
    return null;
  }

  const remindersSent = record.remindersSent ?? 0;
  const maxReminders = record.maxReminders ?? DEFAULT_MAX_REMINDERS;
  if (remindersSent >= maxReminders) {
    return null;
  }

  const msSinceInvite = now.getTime() - new Date(record.inviteEmailSentAt).getTime();
  const daysSinceInvite = Math.floor(msSinceInvite / (24 * 60 * 60 * 1000));

  if (remindersSent === 0 && daysSinceInvite >= 3) {
    return 1;
  }

  if (remindersSent === 1 && daysSinceInvite >= 7) {
    return 2;
  }

  return null;
}

async function resolveOrganisationName(
  db: admin.firestore.Firestore,
  cache: Map<string, Promise<string>>,
  record: SupplierInviteRecord,
): Promise<string> {
  const cacheKey = `${record.ownerId}:${record.registerId}`;
  const existing = cache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = db
    .doc(`users/${record.ownerId}/registers/${record.registerId}`)
    .get()
    .then((doc) => {
      const data = doc.data() as { organisationName?: string | null; name?: string | null } | undefined;
      return data?.organisationName ?? data?.name ?? 'Ihre Organisation';
    });

  cache.set(cacheKey, promise);
  return promise;
}

export const scheduledSupplierReminders = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'Europe/Berlin',
    region: 'europe-west1',
    retryCount: 1,
  },
  async () => {
    const sendGridApiKey = resolveSendGridApiKey();
    const templateId = resolveReminderTemplateId();
    const fromEmail = resolveSenderEmail();

    if (!sendGridApiKey || !templateId || !fromEmail) {
      console.warn('supplier_invite_reminder_scheduler_skipped', {
        reason: 'missing_sendgrid_configuration',
      });
      return;
    }

    sgMail.setApiKey(sendGridApiKey);

    const db = admin.firestore();
    const now = new Date();
    const snapshot = await db.collection(INVITE_COLLECTION).get();
    const registerNameCache = new Map<string, Promise<string>>();

    let sentCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    for (const doc of snapshot.docs) {
      const record = doc.data() as SupplierInviteRecord;
      const reminderNumber = getReminderNumber(record, now);
      if (!reminderNumber) {
        continue;
      }

      const publicUrl = decryptSupplierInviteAccessUrl(
        record.inviteAccessUrlCiphertext,
      );
      if (!publicUrl) {
        skippedCount += 1;
        console.warn('supplier_invite_reminder_skipped', {
          inviteId: record.inviteId,
          reason: 'missing_access_link',
        });
        continue;
      }

      try {
        const organisationName = await resolveOrganisationName(
          db,
          registerNameCache,
          record,
        );
        const optOutUrl = createSupplierReminderOptOutUrl(record.inviteId);

        await sgMail.send({
          to: record.intendedEmail,
          from: fromEmail,
          templateId,
          dynamicTemplateData: {
            organisationName,
            supplierOrganisationHint: record.supplierOrganisationHint ?? '',
            campaignLabel: record.campaignLabel ?? '',
            campaignContext: record.campaignContext ?? '',
            publicUrl,
            expiresAt: record.expiresAt,
            expiresAtFormatted: formatExpiry(record.expiresAt),
            reminderNumber,
            optOutUrl,
          },
        });

        await doc.ref.update({
          remindersSent: (record.remindersSent ?? 0) + 1,
          lastReminderAt: now.toISOString(),
        });
        sentCount += 1;
        console.info('supplier_invite_reminder_sent', {
          inviteId: record.inviteId,
          reminderNumber,
        });
      } catch (error) {
        failureCount += 1;
        console.error('supplier_invite_reminder_failed', {
          inviteId: record.inviteId,
          reminderNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.info('supplier_invite_reminder_scheduler_finished', {
      scanned: snapshot.size,
      sentCount,
      skippedCount,
      failureCount,
    });
  },
);
