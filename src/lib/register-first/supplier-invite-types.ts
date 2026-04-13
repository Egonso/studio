// ── Supplier Invite V2: Contact-Bound Verified Requests ────────────────────

export type SupplierInviteStatus =
  | 'active'
  | 'verified'
  | 'submitted'
  | 'revoked'
  | 'expired';

export type SupplierInviteSenderPolicy = 'exact_email';

export type SupplierInviteVerificationMode = 'email_otp';

export type SupplierInviteCampaignSource = 'manual' | 'csv';

export interface SupplierInviteCampaignRecord {
  campaignId: string;
  registerId: string;
  ownerId: string;
  createdAt: string;
  createdBy: string;
  createdByEmail?: string | null;
  label?: string | null;
  context?: string | null;
  source: SupplierInviteCampaignSource;
  recipientCount: number;
}

export interface SupplierInviteRecord {
  inviteId: string;
  registerId: string;
  ownerId: string;
  secretHash: string;

  status: SupplierInviteStatus;

  intendedEmail: string;
  intendedDomain: string;
  supplierOrganisationHint?: string | null;

  senderPolicy: SupplierInviteSenderPolicy;
  verificationMode: SupplierInviteVerificationMode;

  maxSubmissions: number;
  submissionCount: number;

  createdAt: string;
  createdBy: string;
  createdByEmail?: string | null;

  campaignId?: string | null;
  campaignLabel?: string | null;
  campaignContext?: string | null;
  campaignSource?: SupplierInviteCampaignSource | null;

  expiresAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;

  firstUsedAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIpHash?: string | null;

  inviteAccessUrlCiphertext?: string | null;
  inviteEmailSentAt?: string | null;
  deliveryFailed: boolean;
  otpDeliveryFailed?: boolean;
  remindersSent?: number;
  lastReminderAt?: string | null;
  reminderOptOut?: boolean;
  reminderOptOutAt?: string | null;
  maxReminders?: number;
  riskFlags: string[];

  // Delegation / Reissue (prepared, not yet UI-active)
  reissueTargetEmail?: string | null;
  reassignedFromEmail?: string | null;
  reissuedAt?: string | null;
}
