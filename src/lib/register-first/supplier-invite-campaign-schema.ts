import { z } from 'zod';

import type { SupplierInviteCampaignRecord } from './supplier-invite-types';

export const supplierInviteCampaignRecordSchema = z.object({
  campaignId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  createdAt: z.string().datetime(),
  createdBy: z.string().trim().min(1).max(200),
  createdByEmail: z.string().trim().email().max(320).optional().nullable(),
  label: z.string().trim().min(1).max(200).optional().nullable(),
  context: z.string().trim().min(1).max(500).optional().nullable(),
  source: z.enum(['manual', 'csv']),
  recipientCount: z.number().int().min(1).max(100),
});

export function parseSupplierInviteCampaignRecord(
  input: unknown,
): SupplierInviteCampaignRecord {
  return supplierInviteCampaignRecordSchema.parse(
    input,
  ) as SupplierInviteCampaignRecord;
}
