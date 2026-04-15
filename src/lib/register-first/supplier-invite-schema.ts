import { z } from 'zod';

import type { SupplierInviteRecord } from './supplier-invite-types';

function normalizeDateTimeValue(value: unknown): unknown {
  if (typeof value === 'string' || value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      const date = value.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    if ('seconds' in value && typeof value.seconds === 'number') {
      const nanoseconds =
        'nanoseconds' in value && typeof value.nanoseconds === 'number'
          ? value.nanoseconds
          : 0;
      return new Date(
        value.seconds * 1000 + Math.floor(nanoseconds / 1_000_000),
      ).toISOString();
    }
  }

  return value;
}

const dateTimeLikeSchema = z.preprocess(normalizeDateTimeValue, z.string().datetime());

function normalizeSupplierInviteRecord(input: unknown): unknown {
  if (!input || typeof input !== 'object') {
    return input;
  }

  const record = input as Record<string, unknown>;
  const intendedEmail =
    typeof record.intendedEmail === 'string'
      ? record.intendedEmail.trim().toLowerCase()
      : '';
  const fallbackDomain = intendedEmail.includes('@')
    ? intendedEmail.split('@').at(1)?.trim().toLowerCase() ?? ''
    : '';

  return {
    senderPolicy: 'exact_email',
    verificationMode: 'email_otp',
    deliveryFailed: false,
    otpDeliveryFailed: false,
    remindersSent: 0,
    reminderOptOut: false,
    maxReminders: 2,
    riskFlags: [],
    ...record,
    intendedDomain:
      typeof record.intendedDomain === 'string' && record.intendedDomain.trim().length > 0
        ? record.intendedDomain
        : fallbackDomain,
  };
}

export const supplierInviteRecordSchema = z.preprocess(normalizeSupplierInviteRecord, z.object({
  inviteId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  secretHash: z.string().trim().min(32).max(256),

  status: z.enum(['active', 'verified', 'submitted', 'revoked', 'expired']),

  intendedEmail: z.string().trim().email().max(320),
  intendedDomain: z.string().trim().min(1).max(320),
  supplierOrganisationHint: z.string().trim().min(1).max(200).optional().nullable(),

  senderPolicy: z.enum(['exact_email']).default('exact_email'),
  verificationMode: z.enum(['email_otp']).default('email_otp'),

  maxSubmissions: z.number().int().min(1).default(1),
  submissionCount: z.number().int().min(0).default(0),

  createdAt: dateTimeLikeSchema,
  createdBy: z.string().trim().min(1).max(200),
  createdByEmail: z.string().trim().email().max(320).optional().nullable(),

  campaignId: z.string().trim().min(1).max(200).optional().nullable(),
  campaignLabel: z.string().trim().min(1).max(200).optional().nullable(),
  campaignContext: z.string().trim().min(1).max(500).optional().nullable(),
  campaignSource: z.enum(['manual', 'csv']).optional().nullable(),

  expiresAt: dateTimeLikeSchema,
  revokedAt: dateTimeLikeSchema.optional().nullable(),
  revokedBy: z.string().trim().min(1).max(200).optional().nullable(),

  firstUsedAt: dateTimeLikeSchema.optional().nullable(),
  lastUsedAt: dateTimeLikeSchema.optional().nullable(),
  lastUsedIpHash: z.string().trim().max(128).optional().nullable(),

  inviteAccessUrlCiphertext: z.string().trim().min(10).max(4000).optional().nullable(),
  inviteEmailSentAt: dateTimeLikeSchema.optional().nullable(),
  deliveryFailed: z.boolean().default(false),
  otpDeliveryFailed: z.boolean().default(false),
  remindersSent: z.number().int().min(0).max(10).default(0),
  lastReminderAt: dateTimeLikeSchema.optional().nullable(),
  reminderOptOut: z.boolean().default(false),
  reminderOptOutAt: dateTimeLikeSchema.optional().nullable(),
  maxReminders: z.number().int().min(0).max(10).default(2),
  riskFlags: z.array(z.string().trim().max(100)).max(20).default([]),

  reissueTargetEmail: z.string().trim().email().max(320).optional().nullable(),
  reassignedFromEmail: z.string().trim().email().max(320).optional().nullable(),
  reissuedAt: dateTimeLikeSchema.optional().nullable(),
}));

export function parseSupplierInviteRecord(input: unknown): SupplierInviteRecord {
  return supplierInviteRecordSchema.parse(input) as SupplierInviteRecord;
}
