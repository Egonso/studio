import { z } from 'zod';

export const PRODUCT_FUNNEL_PRIVACY_VERSION = '2026-07-16' as const;

const opaqueSessionIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);

const workspaceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9_-]+$/);

export const productFunnelSourceSchema = z.enum([
  'eukigesetz',
  'training_completion',
  'training_landing',
  'register_landing',
  'invite',
  'capture',
  'register',
  'review_queue',
  'supplier_inbox',
  'supplier_request',
  'pass',
  'certificate',
  'checkout',
  'stripe_webhook',
]);

const contextSchema = z
  .object({
    anonymousSessionId: opaqueSessionIdSchema,
    workspaceId: workspaceIdSchema.optional(),
    source: productFunnelSourceSchema,
    occurredAt: z.string().datetime().optional(),
  })
  .strict();

const emptyPayloadSchema = z.object({}).strict();
const trainingPlanSchema = z.enum([
  'solo',
  'team',
  'enterprise',
  'governance_pro',
  'governance_enterprise',
]);
const captureSourceSchema = z.enum([
  'training_completion',
  'training_landing',
  'register_landing',
  'invite',
]);
const captureModeSchema = z.enum([
  'direct',
  'description_assist',
  'coverage_assist',
]);
const captureStorageSchema = z.enum(['local', 'submitted', 'register']);
const captureFieldSchema = z.enum([
  'purpose',
  'ownerRole',
  'systems',
  'usageContexts',
  'dataCategories',
  'decisionInfluence',
]);
const useCaseStatusSchema = z.enum([
  'UNREVIEWED',
  'REVIEW_RECOMMENDED',
  'REVIEWED',
  'PROOF_READY',
]);
export const productFunnelActionEventNameSchema = z.enum([
  'review_completed',
  'supplier_submission_processed',
  'pass_generated',
  'pass_shared',
  'export_completed',
]);

function eventSchema<
  TName extends string,
  TPayload extends z.ZodTypeAny,
>(eventName: TName, payload: TPayload) {
  return z
    .object({
      eventName: z.literal(eventName),
      payload,
      context: contextSchema,
    })
    .strict();
}

export const productFunnelEventSchema = z.discriminatedUnion('eventName', [
  eventSchema('training_landing_viewed', emptyPayloadSchema),
  eventSchema(
    'training_role_selected',
    z.object({ role: z.enum(['learner', 'team_organizer']) }).strict(),
  ),
  eventSchema('training_curriculum_viewed', emptyPayloadSchema),
  eventSchema(
    'training_pricing_viewed',
    z.object({ plan: trainingPlanSchema }).strict(),
  ),
  eventSchema(
    'training_checkout_started',
    z.object({ plan: trainingPlanSchema }).strict(),
  ),
  eventSchema(
    'training_purchase_completed',
    z.object({ plan: trainingPlanSchema }).strict(),
  ),
  eventSchema('training_completed', emptyPayloadSchema),
  eventSchema('training_certificate_opened', emptyPayloadSchema),
  eventSchema(
    'first_use_case_cta_clicked',
    z.object({ source: captureSourceSchema }).strict(),
  ),
  eventSchema(
    'capture_started',
    z
      .object({
        mode: captureModeSchema,
        source: captureSourceSchema.optional(),
      })
      .strict(),
  ),
  eventSchema(
    'capture_validation_failed',
    z
      .object({
        fields: z.array(captureFieldSchema).min(1).max(8),
      })
      .strict(),
  ),
  eventSchema(
    'capture_completed',
    z
      .object({
        storage: captureStorageSchema,
        source: captureSourceSchema.optional(),
      })
      .strict(),
  ),
  eventSchema(
    'first_real_use_case_completed',
    z.object({ storage: captureStorageSchema }).strict(),
  ),
  eventSchema('register_created_after_capture', emptyPayloadSchema),
  eventSchema('register_joined_after_capture', emptyPayloadSchema),
  eventSchema('review_queue_opened', emptyPayloadSchema),
  eventSchema(
    'review_completed',
    z.object({ status: useCaseStatusSchema }).strict(),
  ),
  eventSchema(
    'supplier_submission_received',
    z.object({ source: z.enum(['supplier_request', 'access_code', 'manual_import']) }).strict(),
  ),
  eventSchema(
    'supplier_submission_processed',
    z.object({ action: z.enum(['approve', 'reject', 'merge']) }).strict(),
  ),
  eventSchema(
    'pass_generated',
    z.object({ format: z.enum(['json', 'pdf']) }).strict(),
  ),
  eventSchema(
    'pass_shared',
    z.object({ channel: z.literal('public_link') }).strict(),
  ),
  eventSchema(
    'pass_verified',
    z.object({ kind: z.enum(['use_case_pass', 'course_certificate']) }).strict(),
  ),
  eventSchema(
    'export_completed',
    z.object({ format: z.enum(['json', 'pdf', 'audit_bundle']) }).strict(),
  ),
  eventSchema(
    'returned_d7_for_action',
    z.object({ action: productFunnelActionEventNameSchema }).strict(),
  ),
  eventSchema(
    'returned_d30_for_action',
    z.object({ action: productFunnelActionEventNameSchema }).strict(),
  ),
]);

export type ProductFunnelEventInput = z.infer<
  typeof productFunnelEventSchema
>;
export type ProductFunnelEventName = ProductFunnelEventInput['eventName'];
export type ProductFunnelActionEventName = z.infer<
  typeof productFunnelActionEventNameSchema
>;
export type ProductFunnelSource = z.infer<typeof productFunnelSourceSchema>;

export function parseProductFunnelEvent(input: unknown): ProductFunnelEventInput {
  return productFunnelEventSchema.parse(input);
}

export function normalizeProductFunnelSessionId(
  value: string | null | undefined,
): string | null {
  const result = opaqueSessionIdSchema.safeParse(value);
  return result.success ? result.data : null;
}
