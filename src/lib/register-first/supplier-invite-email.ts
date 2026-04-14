import '@/lib/server-only-guard';

import { logInfo } from '@/lib/observability/logger';

const EMAILIT_API_BASE_URL = 'https://api.emailit.com/v2';

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

function resolveEmailitApiKey(): string {
  return requireEnv('EMAILIT_API_KEY');
}

function resolveSenderEmail(): string {
  return requireEnv('EMAILIT_FROM_EMAIL');
}

function formatExpiry(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as
      | { error?: string; message?: string }
      | { errors?: Array<{ message?: string }> };

    if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (
      'errors' in data &&
      Array.isArray(data.errors) &&
      typeof data.errors[0]?.message === 'string' &&
      data.errors[0].message.trim()
    ) {
      return data.errors[0].message;
    }
  } catch {
    // Fall back to status text below.
  }

  return response.statusText || `HTTP ${response.status}`;
}

async function sendEmailitTemplateEmail(input: {
  to: string | string[];
  template: string;
  variables: Record<string, unknown>;
  replyTo?: string | string[];
  meta?: Record<string, string>;
  idempotencyKey: string;
}): Promise<void> {
  const response = await fetch(`${EMAILIT_API_BASE_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resolveEmailitApiKey()}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      from: resolveSenderEmail(),
      to: input.to,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      template: input.template,
      variables: input.variables,
      meta: input.meta,
      tracking: false,
    }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(`Emailit send failed (${response.status}): ${message}`);
  }
}

export interface SendSupplierInviteEmailInput {
  inviteId: string;
  registerId: string;
  to: string;
  publicUrl: string;
  organisationName: string;
  senderEmail?: string | null;
  supplierOrganisationHint?: string | null;
  campaignLabel?: string | null;
  campaignContext?: string | null;
  expiresAt: string;
}

export async function sendSupplierInviteEmail(
  input: SendSupplierInviteEmailInput,
): Promise<void> {
  await sendEmailitTemplateEmail({
    to: input.to,
    replyTo: input.senderEmail ?? undefined,
    template: requireEnv('EMAILIT_SUPPLIER_INVITE_TEMPLATE'),
    idempotencyKey: `supplier-invite-${input.inviteId}`,
    variables: {
      organisationName: input.organisationName,
      requesterEmail: input.senderEmail ?? '',
      supplierOrganisationHint: input.supplierOrganisationHint ?? '',
      campaignLabel: input.campaignLabel ?? '',
      campaignContext: input.campaignContext ?? '',
      publicUrl: input.publicUrl,
      expiresAt: input.expiresAt,
      expiresAtFormatted: formatExpiry(input.expiresAt),
    },
    meta: {
      inviteId: input.inviteId,
      registerId: input.registerId,
    },
  });

  logInfo('supplier_invite_email_sent', {
    inviteId: input.inviteId,
    registerId: input.registerId,
  });
}

export interface SendSupplierOtpEmailInput {
  inviteId: string;
  challengeId: string;
  to: string;
  organisationName: string;
  otpCode: string;
  expiresInMinutes: number;
}

export async function sendSupplierOtpEmail(
  input: SendSupplierOtpEmailInput,
): Promise<void> {
  await sendEmailitTemplateEmail({
    to: input.to,
    template: requireEnv('EMAILIT_SUPPLIER_OTP_TEMPLATE'),
    idempotencyKey: `supplier-otp-${input.challengeId}`,
    variables: {
      organisationName: input.organisationName,
      otpCode: input.otpCode,
      expiresInMinutes: input.expiresInMinutes,
    },
    meta: {
      inviteId: input.inviteId,
      challengeId: input.challengeId,
    },
  });

  logInfo('supplier_invite_otp_email_sent', {
    inviteId: input.inviteId,
    challengeId: input.challengeId,
  });
}

export interface SendSupplierSubmissionConfirmationEmailInput {
  inviteId: string;
  submissionId: string;
  registerId: string;
  to: string;
  organisationName: string;
  supplierOrganisation?: string | null;
  verifiedEmail: string;
  submittedAt: string;
  systemNames: string[];
  purpose: string;
  aiActCategory?: string | null;
  nextStepTitle: string;
  nextStepDescription: string;
  setupUrl?: string | null;
}

export async function sendSupplierSubmissionConfirmationEmail(
  input: SendSupplierSubmissionConfirmationEmailInput,
): Promise<void> {
  await sendEmailitTemplateEmail({
    to: input.to,
    template: requireEnv('EMAILIT_SUPPLIER_CONFIRMATION_TEMPLATE'),
    idempotencyKey: `supplier-confirmation-${input.submissionId}`,
    variables: {
      organisationName: input.organisationName,
      supplierOrganisation: input.supplierOrganisation ?? '',
      verifiedEmail: input.verifiedEmail,
      submissionId: input.submissionId,
      inviteId: input.inviteId,
      submittedAt: input.submittedAt,
      submittedAtFormatted: formatExpiry(input.submittedAt),
      systemsSummary: input.systemNames.join(', '),
      purpose: input.purpose,
      aiActCategory: input.aiActCategory ?? '',
      nextStepTitle: input.nextStepTitle,
      nextStepDescription: input.nextStepDescription,
      setupUrl: input.setupUrl ?? '',
    },
    meta: {
      inviteId: input.inviteId,
      submissionId: input.submissionId,
      registerId: input.registerId,
    },
  });

  logInfo('supplier_invite_confirmation_email_sent', {
    inviteId: input.inviteId,
    submissionId: input.submissionId,
    registerId: input.registerId,
  });
}
