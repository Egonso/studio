import { z } from 'zod';

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

export const CheckoutRequestSchema = z
  .object({
    targetPlan: optionalCheckoutPlanSchema,
    registerId: optionalIdentifierSchema,
    workspaceId: optionalIdentifierSchema,
    billingInterval: optionalBillingIntervalSchema,
  })
  .strict();

export type CheckoutRequestBody = z.infer<typeof CheckoutRequestSchema>;

export function parseCheckoutRequestBody(
  input: unknown,
): CheckoutRequestBody {
  return CheckoutRequestSchema.parse(input);
}
