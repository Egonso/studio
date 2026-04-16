import { z } from 'zod';

import { normalizeReturnToPath } from '@/lib/auth/login-routing';
import { safeIdentifierSchema } from '@/lib/security/safe-schemas';

const optionalCheckoutPlanSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.enum(['pro', 'enterprise']).optional(),
);

const optionalBillingIntervalSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.enum(['month', 'year']).optional(),
);

const optionalIdentifierSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  safeIdentifierSchema.optional(),
);

const optionalReturnToSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z
    .string()
    .trim()
    .max(512, 'Return-Pfad ist zu lang.')
    .transform((value) => normalizeReturnToPath(value))
    .refine((value) => value !== null, 'Return-Pfad ist ungültig.')
    .optional(),
);

export const CheckoutRequestSchema = z
  .object({
    targetPlan: optionalCheckoutPlanSchema,
    registerId: optionalIdentifierSchema,
    workspaceId: optionalIdentifierSchema,
    billingInterval: optionalBillingIntervalSchema,
    promotionCode: optionalIdentifierSchema,
    returnTo: optionalReturnToSchema,
  })
  .strict();

export type CheckoutRequestBody = z.infer<typeof CheckoutRequestSchema>;

export function parseCheckoutRequestBody(
  input: unknown,
): CheckoutRequestBody {
  return CheckoutRequestSchema.parse(input);
}
