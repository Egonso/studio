import { z } from 'zod';

const DOCUMENTATION_TYPE_VALUES = [
  'application',
  'process',
  'workflow',
] as const;
const USAGE_CONTEXT_VALUES = [
  'INTERNAL_ONLY',
  'EMPLOYEES',
  'CUSTOMERS',
  'APPLICANTS',
  'PUBLIC',
] as const;
const DECISION_INFLUENCE_VALUES = [
  'ASSISTANCE',
  'PREPARATION',
  'AUTOMATED',
] as const;
const DATA_CATEGORY_VALUES = [
  'NO_PERSONAL_DATA',
  'PERSONAL_DATA',
  'SPECIAL_PERSONAL',
  'INTERNAL_CONFIDENTIAL',
  'PUBLIC_DATA',
  'HEALTH_DATA',
  'BIOMETRIC_DATA',
  'POLITICAL_RELIGIOUS',
  'OTHER_SENSITIVE',
] as const;
const CONNECTION_MODE_VALUES = [
  'MANUAL_SEQUENCE',
  'SEMI_AUTOMATED',
  'FULLY_AUTOMATED',
] as const;
const REGISTER_STATUS_VALUES = [
  'UNREVIEWED',
  'REVIEW_RECOMMENDED',
  'REVIEWED',
  'PROOF_READY',
] as const;
const CONFIDENCE_VALUES = ['low', 'medium', 'high'] as const;
const RISK_CLASS_VALUES = [
  'UNASSESSED',
  'MINIMAL',
  'LIMITED',
  'HIGH',
  'PROHIBITED',
] as const;
const SIGNAL_STRENGTH_VALUES = ['low', 'medium', 'high'] as const;
const VERDICT_VALUES = [
  'ready_for_handoff',
  'needs_input',
  'blocked',
] as const;

export const DraftAssistDocumentationTypeSchema = z.enum(
  DOCUMENTATION_TYPE_VALUES,
);
export const DraftAssistUsageContextSchema = z.enum(USAGE_CONTEXT_VALUES);
export const DraftAssistDecisionInfluenceSchema = z.enum(
  DECISION_INFLUENCE_VALUES,
);
export const DraftAssistDataCategorySchema = z.enum(DATA_CATEGORY_VALUES);
export const DraftAssistConnectionModeSchema = z.enum(CONNECTION_MODE_VALUES);
export const DraftAssistRegisterStatusSchema = z.enum(REGISTER_STATUS_VALUES);
export const DraftAssistConfidenceSchema = z.enum(CONFIDENCE_VALUES);
export const DraftAssistRiskClassSchema = z.enum(RISK_CLASS_VALUES);
export const DraftAssistSignalStrengthSchema = z.enum(
  SIGNAL_STRENGTH_VALUES,
);
export const DraftAssistVerdictSchema = z.enum(VERDICT_VALUES);

export const DraftAssistExistingUseCaseSchema = z.object({
  useCaseId: z.string().trim().min(1).max(120),
  purpose: z.string().trim().min(1).max(300),
  status: DraftAssistRegisterStatusSchema,
  primarySystem: z.string().trim().min(1).max(160).nullable().optional(),
  usageContexts: z.array(DraftAssistUsageContextSchema).max(8).default([]),
  decisionInfluence:
    DraftAssistDecisionInfluenceSchema.nullable().optional(),
  dataCategories: z.array(DraftAssistDataCategorySchema).max(8).default([]),
});

export const DraftAssistContextSchema = z.object({
  registerId: z.string().trim().min(1).max(120).nullable().optional(),
  registerName: z.string().trim().min(1).max(200).nullable().optional(),
  organisationName: z.string().trim().min(1).max(200).nullable().optional(),
  organisationUnit: z.string().trim().min(1).max(200).nullable().optional(),
  policyTitles: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  existingUseCaseCount: z.number().int().min(0).max(5000).default(0),
  existingUseCases: z
    .array(DraftAssistExistingUseCaseSchema)
    .max(8)
    .default([]),
});

export const DraftAssistInputSchema = z.object({
  description: z.string().trim().min(50).max(2000),
  context: DraftAssistContextSchema.nullable().optional(),
});

export const DraftAssistDraftSchema = z.object({
  documentationType: DraftAssistDocumentationTypeSchema,
  title: z.string().trim().min(3).max(300),
  summary: z.string().trim().min(1).max(300).optional(),
  purpose: z.string().trim().min(3).max(500),
  ownerRole: z.string().trim().min(2).max(120),
  contactPersonName: z.string().trim().min(1).max(120).nullable().optional(),
  isCurrentlyResponsible: z.boolean().optional(),
  responsibleParty: z.string().trim().min(1).max(120).nullable().optional(),
  usageContexts: z.array(DraftAssistUsageContextSchema).min(1).max(8),
  decisionInfluence: DraftAssistDecisionInfluenceSchema.optional(),
  dataCategories: z.array(DraftAssistDataCategorySchema).max(13).default([]),
  systems: z
    .array(
      z.object({
        position: z.number().int().min(1).max(20),
        name: z.string().trim().min(1).max(300),
        providerType: z.string().trim().min(1).max(80).optional(),
      }),
    )
    .min(1)
    .max(8),
  workflow: z
    .object({
      connectionMode: DraftAssistConnectionModeSchema.optional(),
      summary: z.string().trim().min(1).max(300).optional(),
    })
    .optional(),
  triggers: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  steps: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  humansInLoop: z
    .array(z.string().trim().min(1).max(300))
    .max(6)
    .default([]),
  risks: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
  controls: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
  artifacts: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  tags: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
});

export const DraftAssistDraftMetaSchema = z.object({
  confidence: DraftAssistConfidenceSchema,
  missingFacts: z.array(z.string().trim().min(1).max(200)).max(3).default([]),
  assumptions: z.array(z.string().trim().min(1).max(200)).max(3).default([]),
});

export const DraftAssistResultSchema = z.object({
  draft: DraftAssistDraftSchema,
  meta: DraftAssistDraftMetaSchema,
});

export const DraftAssistRiskSuggestionSchema = z.object({
  suggestedRiskClass: DraftAssistRiskClassSchema,
  signalStrength: DraftAssistSignalStrengthSchema,
  reviewRecommended: z.boolean(),
  reasons: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
  openQuestions: z
    .array(z.string().trim().min(1).max(200))
    .max(5)
    .default([]),
  sourceSignals: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
});

export const DraftAssistVerifierSchema = z.object({
  schemaValid: z.boolean(),
  captureMappingValid: z.boolean(),
  missingFacts: z
    .array(z.string().trim().min(1).max(200))
    .max(8)
    .default([]),
  duplicateHints: z
    .array(z.string().trim().min(1).max(240))
    .max(3)
    .default([]),
  reviewTriggers: z
    .array(z.string().trim().min(1).max(240))
    .max(8)
    .default([]),
  riskSuggestion: DraftAssistRiskSuggestionSchema.nullable().default(null),
  openQuestions: z
    .array(z.string().trim().min(1).max(200))
    .max(5)
    .default([]),
  verdict: DraftAssistVerdictSchema,
});

const DraftAssistCaptureWorkflowSystemSchema = z.object({
  entryId: z.string().trim().min(1).max(120),
  position: z.number().int().min(2).max(1000),
  toolId: z.string().trim().min(1).max(120).optional(),
  toolFreeText: z.string().trim().min(1).max(300).optional(),
});

const DraftAssistCaptureWorkflowSchema = z.object({
  additionalSystems: z
    .array(DraftAssistCaptureWorkflowSystemSchema)
    .max(19)
    .default([]),
  connectionMode: DraftAssistConnectionModeSchema.optional(),
  summary: z.string().trim().min(1).max(300).optional(),
});

export const DraftAssistCaptureInputSchema = z.object({
  purpose: z.string().trim().min(3).max(500),
  usageContexts: z.array(DraftAssistUsageContextSchema).min(1).max(8),
  isCurrentlyResponsible: z.boolean(),
  responsibleParty: z.string().trim().min(1).max(120).nullable().optional(),
  contactPersonName: z.string().trim().min(1).max(120).nullable().optional(),
  decisionInfluence: DraftAssistDecisionInfluenceSchema.optional(),
  toolId: z.string().trim().min(1).max(120).optional(),
  toolFreeText: z.string().trim().min(1).max(300).optional(),
  workflow: DraftAssistCaptureWorkflowSchema.optional(),
  dataCategory: DraftAssistDataCategorySchema.optional(),
  dataCategories: z.array(DraftAssistDataCategorySchema).max(13).optional(),
  organisation: z.string().trim().min(1).max(200).nullable().optional(),
});

export const DraftAssistHandoffSchema = z.object({
  source: z.literal('draft_assist_v1'),
  manifest: DraftAssistDraftSchema,
  captureInput: DraftAssistCaptureInputSchema,
});

export const DraftAssistAssistResultSchema = z.object({
  draft: DraftAssistDraftSchema,
  meta: DraftAssistDraftMetaSchema,
  verifier: DraftAssistVerifierSchema,
  questions: z.array(z.string().trim().min(1).max(200)).max(5).default([]),
  handoff: DraftAssistHandoffSchema.nullable().default(null),
});

export type DraftAssistInput = z.infer<typeof DraftAssistInputSchema>;
export type DraftAssistContext = z.infer<typeof DraftAssistContextSchema>;
export type DraftAssistDraft = z.infer<typeof DraftAssistDraftSchema>;
export type DraftAssistDraftMeta = z.infer<typeof DraftAssistDraftMetaSchema>;
export type DraftAssistResult = z.infer<typeof DraftAssistResultSchema>;
export type DraftAssistRiskSuggestion = z.infer<
  typeof DraftAssistRiskSuggestionSchema
>;
export type DraftAssistVerifier = z.infer<typeof DraftAssistVerifierSchema>;
export type DraftAssistCaptureInput = z.infer<
  typeof DraftAssistCaptureInputSchema
>;
export type DraftAssistHandoff = z.infer<typeof DraftAssistHandoffSchema>;
export type DraftAssistAssistResult = z.infer<
  typeof DraftAssistAssistResultSchema
>;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function trimToLength(
  value: string | null | undefined,
  maxLength: number,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
}

function normalizeStringList(
  values: string[] | undefined,
  maxItems: number,
  maxLength: number,
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const trimmed = trimToLength(value, maxLength);
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);

    if (result.length >= maxItems) {
      break;
    }
  }

  return result;
}

export function normalizeDraftAssistDraft(
  draft: DraftAssistDraft,
): DraftAssistDraft {
  const sortedSystems = [...draft.systems].sort(
    (left, right) => left.position - right.position,
  );

  return DraftAssistDraftSchema.parse({
    ...draft,
    title: trimToLength(draft.title, 300) ?? draft.title,
    summary: trimToLength(draft.summary, 300),
    purpose: trimToLength(draft.purpose, 500) ?? draft.purpose,
    ownerRole: trimToLength(draft.ownerRole, 120) ?? draft.ownerRole,
    contactPersonName: normalizeOptionalText(draft.contactPersonName),
    responsibleParty: normalizeOptionalText(draft.responsibleParty),
    usageContexts: [...new Set(draft.usageContexts)].slice(0, 8),
    dataCategories: [...new Set(draft.dataCategories)].slice(0, 13),
    systems: sortedSystems.slice(0, 8).map((system, index) => ({
      position: index + 1,
      name: trimToLength(system.name, 300) ?? system.name,
      providerType: trimToLength(system.providerType, 80),
    })),
    workflow: draft.workflow
      ? {
          ...draft.workflow,
          summary: trimToLength(draft.workflow.summary, 300),
        }
      : undefined,
    triggers: normalizeStringList(draft.triggers, 6, 200),
    steps: normalizeStringList(draft.steps, 8, 300),
    humansInLoop: normalizeStringList(draft.humansInLoop, 6, 300),
    risks: normalizeStringList(draft.risks, 6, 300),
    controls: normalizeStringList(draft.controls, 6, 300),
    artifacts: normalizeStringList(draft.artifacts, 6, 200),
    tags: normalizeStringList(draft.tags, 8, 60),
  });
}

export function normalizeDraftAssistDraftMeta(
  meta: DraftAssistDraftMeta,
): DraftAssistDraftMeta {
  return DraftAssistDraftMetaSchema.parse({
    confidence: meta.confidence,
    missingFacts: normalizeStringList(meta.missingFacts, 3, 200),
    assumptions: normalizeStringList(meta.assumptions, 3, 200),
  });
}

export function normalizeDraftAssistResult(
  result: DraftAssistResult,
): DraftAssistResult {
  return DraftAssistResultSchema.parse({
    draft: normalizeDraftAssistDraft(result.draft),
    meta: normalizeDraftAssistDraftMeta(result.meta),
  });
}

export function normalizeDraftAssistVerifier(
  verifier: DraftAssistVerifier,
): DraftAssistVerifier {
  return DraftAssistVerifierSchema.parse({
    ...verifier,
    missingFacts: normalizeStringList(verifier.missingFacts, 8, 200),
    duplicateHints: normalizeStringList(verifier.duplicateHints, 3, 240),
    reviewTriggers: normalizeStringList(verifier.reviewTriggers, 8, 240),
    riskSuggestion: verifier.riskSuggestion
      ? {
          ...verifier.riskSuggestion,
          reasons: normalizeStringList(verifier.riskSuggestion.reasons, 6, 240),
          openQuestions: normalizeStringList(
            verifier.riskSuggestion.openQuestions,
            5,
            200,
          ),
          sourceSignals: normalizeStringList(
            verifier.riskSuggestion.sourceSignals,
            12,
            120,
          ),
        }
      : null,
    openQuestions: normalizeStringList(verifier.openQuestions, 5, 200),
  });
}

export function normalizeDraftAssistHandoff(
  handoff: DraftAssistHandoff,
): DraftAssistHandoff {
  return DraftAssistHandoffSchema.parse({
    ...handoff,
    manifest: normalizeDraftAssistDraft(handoff.manifest),
  });
}

export function normalizeDraftAssistAssistResult(
  result: DraftAssistAssistResult,
): DraftAssistAssistResult {
  return DraftAssistAssistResultSchema.parse({
    draft: normalizeDraftAssistDraft(result.draft),
    meta: normalizeDraftAssistDraftMeta(result.meta),
    verifier: normalizeDraftAssistVerifier(result.verifier),
    questions: normalizeStringList(result.questions, 5, 200),
    handoff: result.handoff
      ? normalizeDraftAssistHandoff(result.handoff)
      : null,
  });
}

export function parseDraftAssistInput(input: unknown): DraftAssistInput {
  return DraftAssistInputSchema.parse(input);
}

export function parseDraftAssistContext(input: unknown): DraftAssistContext {
  return DraftAssistContextSchema.parse(input);
}

export function parseDraftAssistResult(input: unknown): DraftAssistResult {
  return DraftAssistResultSchema.parse(input);
}

export function parseDraftAssistVerifier(input: unknown): DraftAssistVerifier {
  return DraftAssistVerifierSchema.parse(input);
}

export function parseDraftAssistAssistResult(
  input: unknown,
): DraftAssistAssistResult {
  return DraftAssistAssistResultSchema.parse(input);
}
