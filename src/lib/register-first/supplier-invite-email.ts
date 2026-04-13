import '@/lib/server-only-guard';

import * as sgMail from '@sendgrid/mail';

import { logInfo } from '@/lib/observability/logger';

let configuredApiKey: string | null = null;

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

function ensureSendGridConfigured(): void {
  const apiKey = requireEnv('SENDGRID_API_KEY');
  if (configuredApiKey === apiKey) {
    return;
  }

  sgMail.setApiKey(apiKey);
  configuredApiKey = apiKey;
}

function resolveSenderEmail(): string {
  return requireEnv('SENDGRID_FROM_EMAIL');
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
  ensureSendGridConfigured();

  await sgMail.send({
    to: input.to,
    from: resolveSenderEmail(),
    replyTo: input.senderEmail ?? undefined,
    templateId: requireEnv('SENDGRID_SUPPLIER_INVITE_TEMPLATE_ID'),
    dynamicTemplateData: {
      organisationName: input.organisationName,
      requesterEmail: input.senderEmail ?? '',
      supplierOrganisationHint: input.supplierOrganisationHint ?? '',
      campaignLabel: input.campaignLabel ?? '',
      campaignContext: input.campaignContext ?? '',
      publicUrl: input.publicUrl,
      expiresAt: input.expiresAt,
      expiresAtFormatted: formatExpiry(input.expiresAt),
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
  ensureSendGridConfigured();

  await sgMail.send({
    to: input.to,
    from: resolveSenderEmail(),
    templateId: requireEnv('SENDGRID_SUPPLIER_OTP_TEMPLATE_ID'),
    dynamicTemplateData: {
      organisationName: input.organisationName,
      otpCode: input.otpCode,
      expiresInMinutes: input.expiresInMinutes,
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
  ensureSendGridConfigured();

  await sgMail.send({
    to: input.to,
    from: resolveSenderEmail(),
    templateId: requireEnv('SENDGRID_SUPPLIER_CONFIRMATION_TEMPLATE_ID'),
    dynamicTemplateData: {
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
  });

  logInfo('supplier_invite_confirmation_email_sent', {
    inviteId: input.inviteId,
    submissionId: input.submissionId,
    registerId: input.registerId,
  });
}
