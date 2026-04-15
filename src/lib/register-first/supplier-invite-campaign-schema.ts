import { z } from 'zod';

import type { SupplierInviteCampaignRecord } from './supplier-invite-types';

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

const dateTimeLikeSchema = z.preprocess(
  normalizeDateTimeValue,
  z.string().datetime(),
);

function normalizeCampaignRecord(input: unknown): unknown {
  if (!input || typeof input !== 'object') {
    return input;
  }

  const record = input as Record<string, unknown>;

  return {
    source: 'manual',
    recipientCount: 1,
    ...record,
  };
}

export const supplierInviteCampaignRecordSchema = z.preprocess(normalizeCampaignRecord, z.object({
  campaignId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  createdAt: dateTimeLikeSchema,
  createdBy: z.string().trim().min(1).max(200),
  createdByEmail: z.string().trim().email().max(320).optional().nullable(),
  label: z.string().trim().min(1).max(200).optional().nullable(),
  context: z.string().trim().min(1).max(500).optional().nullable(),
  source: z.enum(['manual', 'csv']).default('manual'),
  recipientCount: z.number().int().min(1).max(100),
}));

export function parseSupplierInviteCampaignRecord(
  input: unknown,
): SupplierInviteCampaignRecord {
  return supplierInviteCampaignRecordSchema.parse(
    input,
  ) as SupplierInviteCampaignRecord;
}
