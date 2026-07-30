import { randomUUID } from 'node:crypto';

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import {
  buildFeedbackNotification,
  buildRegistrationNotification,
  parseAdminNotificationRecipients,
  type AdminNotificationContent,
} from './admin-notification-content';
import {
  hashNotificationSourceId,
  notificationDocumentId,
  resolveClaimState,
  type NotificationKind,
} from './admin-notification-state';
import {
  EmailitApiError,
  EmailitNetworkError,
  isRetryableEmailitError,
  resolveFunctionsEmailitApiKey,
  resolveFunctionsEmailitFromEmail,
  sendEmailitRawEmail,
} from './emailit';
import {
  adminNotificationEmailsParam,
  emailitApiKeySecret,
} from './runtimeParams';

const NOTIFICATION_COLLECTION = '_adminNotificationEvents';
const LEASE_DURATION_MS = 2 * 60 * 1000;

type DeliveryInput = {
  kind: NotificationKind;
  sourceId: string;
  content: AdminNotificationContent;
};

type ClaimResult =
  | { state: 'claimed'; leaseId: string }
  | { state: 'busy' }
  | { state: 'complete' };

class NotificationConfigurationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'NotificationConfigurationError';
  }
}

function resolveRecipients(): string[] {
  try {
    return parseAdminNotificationRecipients(
      adminNotificationEmailsParam.value(),
    );
  } catch {
    throw new NotificationConfigurationError(
      'invalid_admin_notification_emails',
    );
  }
}

function resolveSender(): string {
  return (
    resolveFunctionsEmailitFromEmail() ||
    'ki-eu-akt@momofeichtinger.com'
  );
}

function errorCode(error: unknown): string {
  if (error instanceof EmailitApiError) {
    return `emailit_http_${error.status}`;
  }
  if (error instanceof EmailitNetworkError) {
    return 'emailit_network_error';
  }
  if (error instanceof NotificationConfigurationError) {
    return error.code;
  }
  return 'unexpected_runtime_error';
}

async function claimDelivery(
  input: DeliveryInput,
): Promise<ClaimResult> {
  const db = admin.firestore();
  const ref = db
    .collection(NOTIFICATION_COLLECTION)
    .doc(notificationDocumentId(input.kind, input.sourceId));
  const now = Date.now();
  const leaseId = randomUUID();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();

    const leaseUntil =
      current?.leaseUntil instanceof admin.firestore.Timestamp
        ? current.leaseUntil.toMillis()
        : 0;
    const claimState = resolveClaimState(current?.status, leaseUntil, now);

    if (claimState === 'complete') {
      return { state: 'complete' };
    }
    if (claimState === 'busy') {
      return { state: 'busy' };
    }

    transaction.set(
      ref,
      {
        kind: input.kind,
        sourceIdHash: hashNotificationSourceId(input.sourceId),
        status: 'attempting',
        attemptCount: admin.firestore.FieldValue.increment(1),
        leaseId,
        leaseUntil: admin.firestore.Timestamp.fromMillis(
          now + LEASE_DURATION_MS,
        ),
        createdAt:
          current?.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { state: 'claimed', leaseId };
  });
}

async function finishDelivery(
  input: DeliveryInput,
  leaseId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const db = admin.firestore();
  const ref = db
    .collection(NOTIFICATION_COLLECTION)
    .doc(notificationDocumentId(input.kind, input.sourceId));

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.leaseId !== leaseId) {
      throw new Error('Notification lease changed before completion.');
    }

    transaction.set(
      ref,
      {
        ...fields,
        leaseId: admin.firestore.FieldValue.delete(),
        leaseUntil: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

async function deliverNotification(input: DeliveryInput): Promise<void> {
  const claim = await claimDelivery(input);

  if (claim.state === 'complete') {
    return;
  }
  if (claim.state === 'busy') {
    throw new Error('Notification delivery is already in progress.');
  }

  let emailitApiKey: string;
  let recipients: string[];
  let result: Awaited<ReturnType<typeof sendEmailitRawEmail>>;

  try {
    const resolvedApiKey = resolveFunctionsEmailitApiKey();
    if (!resolvedApiKey) {
      throw new NotificationConfigurationError('missing_emailit_api_key');
    }
    emailitApiKey = resolvedApiKey;
    recipients = resolveRecipients();

    result = await sendEmailitRawEmail({
      apiKey: emailitApiKey,
      from: resolveSender(),
      to: recipients,
      subject: input.content.subject,
      html: input.content.html,
      text: input.content.text,
      idempotencyKey: notificationDocumentId(input.kind, input.sourceId),
      meta: {
        notificationKind: input.kind,
        sourceIdHash: hashNotificationSourceId(input.sourceId),
      },
      tracking: false,
    });
  } catch (error) {
    const retryable = isRetryableEmailitError(error);
    await finishDelivery(input, claim.leaseId, {
      status: retryable ? 'failed_retryable' : 'failed_permanent',
      lastErrorCode: errorCode(error),
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (retryable) {
      throw error;
    }
    return;
  }

  await finishDelivery(input, claim.leaseId, {
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    recipientCount: recipients.length,
    emailitEmailId: result.id,
    emailitStatus: result.status,
    lastErrorCode: admin.firestore.FieldValue.delete(),
  });
}

export const notifyAdminsOnUserCreate = functions
  .runWith({
    secrets: [emailitApiKeySecret],
    failurePolicy: true,
  })
  .auth.user()
  .onCreate(async (user) => {
    await deliverNotification({
      kind: 'auth_user_created',
      sourceId: user.uid,
      content: buildRegistrationNotification({
        email: user.email,
        displayName: user.displayName,
        createdAt: user.metadata.creationTime,
        emailVerified: user.emailVerified,
        providers: user.providerData.map((provider) => provider.providerId),
      }),
    });
  });

export const notifyAdminsOnFeedbackCreate = onDocumentCreated(
  {
    document: 'feedback/{feedbackId}',
    region: 'europe-west1',
    retry: true,
    secrets: [emailitApiKeySecret],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const data = snapshot.data();
    await deliverNotification({
      kind: 'feedback_created',
      sourceId: snapshot.id,
      content: buildFeedbackNotification({
        type: typeof data.type === 'string' ? data.type : null,
        message: typeof data.message === 'string' ? data.message : null,
        path: typeof data.path === 'string' ? data.path : null,
        userEmail: typeof data.userEmail === 'string' ? data.userEmail : null,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : null,
      }),
    });
  },
);
