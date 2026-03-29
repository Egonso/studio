import { z } from 'zod';

import type { SupplierInviteRecord } from './supplier-invite-types';

export const supplierInviteRecordSchema = z.object({
  inviteId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  secretHash: z.string().trim().min(32).max(256),

  status: z.enum(['active', 'verified', 'submitted', 'revoked', 'expired']),

  intendedEmail: z.string().trim().email().max(320),
  intendedDomain: z.string().trim().min(1).max(320),
  supplierOrganisationHint: z.string().trim().min(1).max(200).optional().nullable(),

  senderPolicy: z.enum(['exact_email']),
  verificationMode: z.enum(['email_otp']),

  maxSubmissions: z.number().int().min(1).default(1),
  submissionCount: z.number().int().min(0).default(0),

  createdAt: z.string().datetime(),
  createdBy: z.string().trim().min(1).max(200),
  createdByEmail: z.string().trim().email().max(320).optional().nullable(),

  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional().nullable(),
  revokedBy: z.string().trim().min(1).max(200).optional().nullable(),

  firstUsedAt: z.string().datetime().optional().nullable(),
  lastUsedAt: z.string().datetime().optional().nullable(),
  lastUsedIpHash: z.string().trim().max(128).optional().nullable(),

  deliveryFailed: z.boolean().default(false),
  riskFlags: z.array(z.string().trim().max(100)).max(20).default([]),

  reissueTargetEmail: z.string().trim().email().max(320).optional().nullable(),
  reassignedFromEmail: z.string().trim().email().max(320).optional().nullable(),
  reissuedAt: z.string().datetime().optional().nullable(),
});

export function parseSupplierInviteRecord(input: unknown): SupplierInviteRecord {
  return supplierInviteRecordSchema.parse(input) as SupplierInviteRecord;
}
