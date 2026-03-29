import type { ApprovalWorkflow } from '@/lib/enterprise/workspace';

// ── Supplier Invite V2: Contact-Bound Verified Requests ────────────────────

export type SupplierInviteStatus =
  | 'active'
  | 'verified'
  | 'submitted'
  | 'revoked'
  | 'expired';

export type SupplierInviteSenderPolicy = 'exact_email';

export type SupplierInviteVerificationMode = 'email_otp';

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

  expiresAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;

  firstUsedAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIpHash?: string | null;

  deliveryFailed: boolean;
  riskFlags: string[];

  // Delegation / Reissue (prepared, not yet UI-active)
  reissueTargetEmail?: string | null;
  reassignedFromEmail?: string | null;
  reissuedAt?: string | null;
}
