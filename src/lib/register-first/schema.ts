import { z } from "zod";
import {
  captureAssistContextSchema,
  type CaptureAssistContext,
} from "@/lib/coverage-assist/types";
import type {
  CaptureInput,
  ExternalSubmission,
  GovernanceDecisionActor,
  RegisterUseCaseStatus,
  SupplierRequestTokenRecord,
  UseCaseOrigin,
  UseCaseCard,
} from "./types";
import { dataCategorySchema } from "./tool-registry-types";
import {
  AFFECTED_PARTY_VALUES,
  CARD_VERSION_VALUES,
  CAPTURE_USAGE_CONTEXT_VALUES,
  DECISION_IMPACT_VALUES,
  DECISION_INFLUENCE_VALUES,
  REGISTER_USE_CASE_STATUS_VALUES,
  USE_CASE_ORIGIN_SOURCE_VALUES,
  normalizeCaptureUsageContexts,
  normalizeDataCategories,
  normalizeWorkflowConnectionMode,
  normalizeUseCaseWorkflow,
  WORKFLOW_CONNECTION_MODE_VALUES,
} from "./card-model";
import {
  createUseCaseOrigin,
  normalizeUseCaseCardRecord,
} from "./migration";
import { generateGlobalUseCaseId, generatePublicHashId } from "./id-generation";

const externalSubmissionSourceTypeValues = [
  "supplier_request",
  "access_code",
  "manual_import",
] as const;

const externalSubmissionStatusValues = [
  "submitted",
  "approved",
  "rejected",
  "merged",
] as const;
const workspaceRoleValues = [
  "OWNER",
  "ADMIN",
  "REVIEWER",
  "MEMBER",
  "EXTERNAL_OFFICER",
] as const;

export const registerUseCaseStatusSchema = z.enum(REGISTER_USE_CASE_STATUS_VALUES);
export const captureUsageContextSchema = z.enum(CAPTURE_USAGE_CONTEXT_VALUES);
export const decisionImpactSchema = z.enum(DECISION_IMPACT_VALUES);
export const decisionInfluenceSchema = z.enum(DECISION_INFLUENCE_VALUES);
export const affectedPartySchema = z.enum(AFFECTED_PARTY_VALUES);
export const workflowConnectionModeSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeWorkflowConnectionMode(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid connectionMode. Expected one of ${WORKFLOW_CONNECTION_MODE_VALUES.join(", ")}`,
      });
      return z.NEVER;
    }

    return normalized;
  });
export const externalSubmissionSourceTypeSchema = z.enum(
  externalSubmissionSourceTypeValues
);
export const externalSubmissionStatusSchema = z.enum(
  externalSubmissionStatusValues
);
const workspaceRoleSchema = z.enum(workspaceRoleValues);
const approvalDecisionRecordSchema = z.object({
  decisionId: z.string().trim().min(1).max(200),
  role: workspaceRoleSchema,
  actorUserId: z.string().trim().min(1).max(200),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().min(1).max(2000).optional().nullable(),
  decidedAt: z.string().datetime(),
});
const approvalWorkflowSchema = z.object({
  status: z.enum(["not_required", "pending", "approved", "rejected"]),
  requiredRoles: z.array(workspaceRoleSchema).max(5),
  requestedAt: z.string().datetime().optional().nullable(),
  requestedBy: z.string().trim().min(1).max(200).optional().nullable(),
  decisions: z.array(approvalDecisionRecordSchema),
});

// ── Card version schema ─────────────────────────────────────────────────────
const cardVersionSchema = z.enum(CARD_VERSION_VALUES);

const orderedUseCaseSystemSchema = z
  .object({
    entryId: z.string().trim().min(1).max(200),
    position: z.number().int().min(1).max(1000),
    toolId: z.string().min(1).max(100).optional(),
    toolFreeText: z.string().trim().min(1).max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.toolId && !value.toolFreeText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each workflow system needs toolId or toolFreeText",
        path: ["toolId"],
      });
    }

    if (
      value.toolId === "other" &&
      (!value.toolFreeText || value.toolFreeText.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "toolFreeText is required when toolId is 'other'",
        path: ["toolFreeText"],
      });
    }
  });

const useCaseWorkflowSchema = z.object({
  additionalSystems: z.array(orderedUseCaseSystemSchema).max(20),
  connectionMode: workflowConnectionModeSchema.optional(),
  summary: z.string().trim().min(1).max(300).optional(),
});

// ── Capture Input Schema (extended for v1.1) ────────────────────────────────
export const captureInputSchema = z
  .object({
    purpose: z.string().trim().min(3).max(500),
    usageContexts: z.array(captureUsageContextSchema).min(1).max(8),
    isCurrentlyResponsible: z.boolean(),
    responsibleParty: z.string().trim().min(2).max(120).optional().nullable(),
    contactPersonName: z.string().trim().min(1).max(120).optional().nullable(),
    decisionImpact: decisionImpactSchema.optional(),
    decisionInfluence: decisionInfluenceSchema.optional(),
    affectedParties: z.array(affectedPartySchema).max(4).optional(),
    // v1.1 capture fields (optional for backward compat)
    toolId: z.string().min(1).max(100).optional(),
    toolFreeText: z.string().trim().min(1).max(300).optional(),
    workflow: useCaseWorkflowSchema.optional(),
    dataCategory: dataCategorySchema.optional(),
    dataCategories: z.array(dataCategorySchema).max(13).optional(),
    // v1.2 capture fields (Register-First: flat metadata)
    organisation: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      !value.isCurrentlyResponsible &&
      (!value.responsibleParty || value.responsibleParty.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "responsibleParty is required when isCurrentlyResponsible is false",
        path: ["responsibleParty"],
      });
    }

    if (
      value.decisionImpact === "NO" &&
      value.affectedParties &&
      value.affectedParties.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "affectedParties must be empty when decisionImpact is set to NO",
        path: ["affectedParties"],
      });
    }

    // v1.1: if toolId is "other", toolFreeText is required
    if (
      value.toolId === "other" &&
      (!value.toolFreeText || value.toolFreeText.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "toolFreeText is required when toolId is 'other'",
        path: ["toolFreeText"],
      });
    }
  });

const reviewEventSchema = z.object({
  reviewId: z.string().min(1),
  reviewedAt: z.string().datetime(),
  reviewedBy: z.string().min(1),
  nextStatus: z.enum(["REVIEW_RECOMMENDED", "REVIEWED", "PROOF_READY"]),
  notes: z.string().max(2000).optional(),
});

const proofMetaSchema = z.object({
  verifyUrl: z.string().url(),
  generatedAt: z.string().datetime(),
  verification: z.object({
    isReal: z.boolean(),
    isCurrent: z.boolean(),
    scope: z.string().trim().min(1).max(200),
  }),
});

const manualEditEventSchema = z.object({
  editId: z.string().min(1),
  editedAt: z.string().datetime(),
  editedBy: z.string().min(1),
  editedByName: z.string().trim().min(1).max(200).optional().nullable(),
  summary: z.string().trim().min(1).max(300),
  changedFields: z.array(z.string().trim().min(1).max(200)).max(20),
});

const evidenceReferenceSchema = z.object({
  evidenceId: z.string().min(1),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["NOTE", "DOCUMENT", "LINK"]),
  uri: z.string().url().optional(),
});

const flagStatusSchema = z.enum(["yes", "no", "not_found"]);
const confidenceLevelSchema = z.enum(["low", "medium", "high"]);

const publicInfoSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum([
    "trust_center",
    "privacy",
    "terms",
    "dpa",
    "scc",
    "blog",
    "other",
  ]),
  accessedAt: z.string().datetime(),
});

export const toolPublicInfoSchema = z.object({
  lastCheckedAt: z.string().datetime().nullable(),
  checker: z.enum(["perplexity", "manual", "web"]).nullable(),
  summary: z.string().max(300).nullable(),
  flags: z.object({
    gdprClaim: flagStatusSchema,
    aiActClaim: flagStatusSchema,
    trustCenterFound: flagStatusSchema,
    privacyPolicyFound: flagStatusSchema,
    dpaOrSccMention: flagStatusSchema,
  }),
  confidence: confidenceLevelSchema,
  sources: z.array(publicInfoSourceSchema),
  disclaimerVersion: z.string(),
});

const useCaseSystemProviderTypeSchema = z.enum([
  "TOOL",
  "API",
  "MODEL",
  "CONNECTOR",
  "INTERNAL",
  "OTHER",
]);

export const useCaseSystemPublicInfoSchema = z.object({
  systemKey: z.string().trim().min(1).max(400),
  toolId: z.string().trim().min(1).max(100).optional(),
  toolFreeText: z.string().trim().min(1).max(300).optional(),
  displayName: z.string().trim().min(1).max(300),
  vendor: z.string().trim().min(1).max(200).optional().nullable(),
  providerType: useCaseSystemProviderTypeSchema.optional(),
  publicInfo: toolPublicInfoSchema,
});

export const statusChangeSchema = z.object({
  from: registerUseCaseStatusSchema,
  to: registerUseCaseStatusSchema,
  changedAt: z.string().datetime(),
  changedBy: z.string(),
  changedByName: z.string(),
  reason: z.string().optional(),
});

const externalIntakeTraceSchema = z.object({
  source: z.enum(["ACCESS_CODE", "SUPPLIER_REQUEST_LINK"]),
  submittedAt: z.string().datetime(),
  registerId: z.string().min(1).max(200),
  ownerId: z.string().min(1).max(200).optional().nullable(),
  submissionId: z.string().min(1).max(200).optional().nullable(),
  sourceType: externalSubmissionSourceTypeSchema.optional().nullable(),
  submittedByName: z.string().trim().min(1).max(200).optional().nullable(),
  submittedByEmail: z.string().trim().email().max(320).optional().nullable(),
  submittedByRole: z.string().trim().min(1).max(200).optional().nullable(),
  requestPath: z.string().trim().min(1).max(500).optional().nullable(),
  requestTokenId: z.string().trim().min(1).max(200).optional().nullable(),
  requestCode: z.string().trim().min(1).max(120).optional().nullable(),
  accessCodeId: z.string().trim().min(1).max(200).optional().nullable(),
  accessCode: z.string().trim().min(1).max(120).optional().nullable(),
  accessCodeLabel: z.string().trim().min(1).max(200).optional().nullable(),
});

const useCaseOriginSchema = z.object({
  source: z.enum(USE_CASE_ORIGIN_SOURCE_VALUES),
  submittedByName: z.string().trim().min(1).max(200).optional().nullable(),
  submittedByEmail: z.string().trim().email().max(320).optional().nullable(),
  sourceRequestId: z.string().trim().min(1).max(200).optional().nullable(),
  capturedByUserId: z.string().trim().min(1).max(200).optional().nullable(),
});

export const supplierRequestTokenRecordSchema = z.object({
  tokenId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  tokenHash: z.string().trim().min(32).max(256),
  createdAt: z.string().datetime(),
  createdBy: z.string().trim().min(1).max(200),
  createdByEmail: z.string().trim().email().max(320).optional().nullable(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional().nullable(),
  revokedBy: z.string().trim().min(1).max(200).optional().nullable(),
  revokedByEmail: z.string().trim().email().max(320).optional().nullable(),
  revocationReason: z
    .enum(["manual", "replaced", "register_deleted"])
    .optional()
    .nullable(),
  lastUsedAt: z.string().datetime().optional().nullable(),
});

export const externalSubmissionSchema = z.object({
  submissionId: z.string().trim().min(1).max(200),
  registerId: z.string().trim().min(1).max(200),
  ownerId: z.string().trim().min(1).max(200),
  sourceType: externalSubmissionSourceTypeSchema,
  requestTokenId: z.string().trim().min(1).max(200).optional().nullable(),
  accessCodeId: z.string().trim().min(1).max(200).optional().nullable(),
  submittedByName: z.string().trim().min(1).max(200).optional().nullable(),
  submittedByEmail: z.string().trim().email().max(320).optional().nullable(),
  submittedAt: z.string().datetime(),
  rawPayloadSnapshot: z.record(z.string(), z.unknown()),
  status: externalSubmissionStatusSchema,
  linkedUseCaseId: z.string().trim().min(1).max(200).optional().nullable(),
  reviewedAt: z.string().datetime().optional().nullable(),
  reviewedBy: z.string().trim().min(1).max(200).optional().nullable(),
  reviewNote: z.string().trim().min(1).max(2000).optional().nullable(),
  approvalWorkflow: approvalWorkflowSchema.optional().nullable(),
});

// ── UseCaseCard Schema (accepts both v1.0 and v1.1) ─────────────────────────
export const useCaseCardSchema = z
  .object({
    cardVersion: cardVersionSchema,
    useCaseId: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    purpose: z.string().trim().min(3).max(500),
    usageContexts: z.array(captureUsageContextSchema).min(1).max(8),
    responsibility: z
      .object({
        isCurrentlyResponsible: z.boolean(),
        responsibleParty: z
          .string()
          .trim()
          .min(2)
          .max(120)
          .optional()
          .nullable(),
        contactPersonName: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .optional()
          .nullable(),
      })
      .superRefine((value, ctx) => {
        if (
          !value.isCurrentlyResponsible &&
          (!value.responsibleParty ||
            value.responsibleParty.trim().length === 0)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "responsibleParty is required when isCurrentlyResponsible is false",
            path: ["responsibleParty"],
          });
        }
      }),
    decisionImpact: decisionImpactSchema.optional(),
    decisionInfluence: decisionInfluenceSchema.optional(),
    affectedParties: z.array(affectedPartySchema).max(4).optional(),
    status: registerUseCaseStatusSchema,
    reviewHints: z.array(z.string().trim().min(1).max(300)).default([]),
    evidences: z.array(evidenceReferenceSchema).default([]),
    reviews: z.array(reviewEventSchema).default([]),
    proof: proofMetaSchema.nullable(),
    // ── v1.1 fields (all optional so v1.0 cards pass validation) ──────
    globalUseCaseId: z
      .string()
      .regex(/^EUKI-UC-\d{6}$/, "Must match EUKI-UC-XXXXXX format")
      .optional(),
    formatVersion: z.string().max(10).optional(),
    toolId: z.string().min(1).max(100).optional(),
    toolFreeText: z.string().trim().min(1).max(300).optional(),
    workflow: useCaseWorkflowSchema.optional(),
    dataCategory: dataCategorySchema.optional(),
    dataCategories: z.array(dataCategorySchema).max(13).optional(),
    publicHashId: z.string().min(8).max(24).optional(),
    isPublicVisible: z.boolean().optional(),
    publicInfo: toolPublicInfoSchema.optional().nullable(),
    systemPublicInfo: z.array(useCaseSystemPublicInfoSchema).max(20).optional(),
    // ── v1.2 fields (Register-First: flat metadata) ─────────────────
    organisation: z.string().trim().max(200).optional().nullable(),
    labels: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
    standardVersion: z.string().max(20).optional(),
    isDeleted: z.boolean().optional(),
    // ── Register-First Architecture: Assessment ─────────────────────────────
    governanceAssessment: z.object({
      core: z.object({
        aiActCategory: z.string().nullable().optional(),
        oversightDefined: z.boolean().optional(),
        reviewCycleDefined: z.boolean().optional(),
        documentationLevelDefined: z.boolean().optional(),
        trainingCompleted: z.boolean().optional(),
        incidentProcessDefined: z.boolean().optional(),
        coreVersion: z.string().optional(),
        assessedAt: z.string().datetime().optional()
      }).optional(),
      flex: z.record(z.any()).optional()
    }).optional(),
    // ── Audit Trail (Sprint 4) ──────────────────────────────────────────────
    statusHistory: z.array(statusChangeSchema).optional(),
    manualEdits: z.array(manualEditEventSchema).default([]),
    origin: useCaseOriginSchema.optional().nullable(),
    assistContext: captureAssistContextSchema.optional().nullable(),
    capturedBy: z.string().optional(),
    capturedByName: z.string().optional(),
    capturedViaCode: z.boolean().optional(),
    accessCodeLabel: z.string().optional(),
    externalIntake: externalIntakeTraceSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    // v1.1: if toolId is "other", toolFreeText is required
    if (
      value.toolId === "other" &&
      (!value.toolFreeText || value.toolFreeText.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "toolFreeText is required when toolId is 'other'",
        path: ["toolFreeText"],
      });
    }
  });

export function parseCaptureInput(input: unknown): CaptureInput {
  const parsed = captureInputSchema.parse(input);
  const dataCategories = normalizeDataCategories(
    parsed.dataCategories,
    parsed.dataCategory
  );
  return {
    ...parsed,
    usageContexts: normalizeCaptureUsageContexts(parsed.usageContexts),
    workflow: normalizeUseCaseWorkflow(parsed.workflow),
    dataCategory: dataCategories[0],
    dataCategories: dataCategories.length > 0 ? dataCategories : undefined,
    affectedParties: parsed.affectedParties ?? [],
  };
}

export function parseUseCaseCard(input: unknown): UseCaseCard {
  return useCaseCardSchema.parse(normalizeUseCaseCardRecord(input)) as UseCaseCard;
}

export function parseSupplierRequestTokenRecord(
  input: unknown
): SupplierRequestTokenRecord {
  return supplierRequestTokenRecordSchema.parse(input) as SupplierRequestTokenRecord;
}

export function parseExternalSubmission(input: unknown): ExternalSubmission {
  return externalSubmissionSchema.parse(input) as ExternalSubmission;
}

export function assertManualGovernanceDecision(actor: GovernanceDecisionActor) {
  if (actor !== "HUMAN") {
    throw new Error(
      "Automated governance decisions are prohibited in Register First."
    );
  }
}

// ── Canonical Card Draft (kept under legacy name for compatibility) ───────
interface CreateUseCaseCardDraftParams {
  useCaseId: string;
  now?: Date;
  status?: RegisterUseCaseStatus;
  origin?: UseCaseOrigin | null;
  assistContext?: CaptureAssistContext | null;
  globalUseCaseId?: string;
  publicHashId?: string;
}

export function createUseCaseCardDraft(
  input: unknown,
  params: CreateUseCaseCardDraftParams
): UseCaseCard {
  const currentTime = params.now ?? new Date();
  return createUseCaseCardV11Draft(input, {
    useCaseId: params.useCaseId,
    globalUseCaseId:
      params.globalUseCaseId ?? generateGlobalUseCaseId(currentTime),
    publicHashId: params.publicHashId ?? generatePublicHashId(),
    now: currentTime,
    status: params.status,
    origin: params.origin ?? createUseCaseOrigin({ source: "manual" }),
    assistContext: params.assistContext ?? null,
  });
}

// ── v1.1 Card Draft (canonical write path) ────────────────────────────────
interface CreateUseCaseCardV11DraftParams {
  useCaseId: string;
  globalUseCaseId: string;
  publicHashId: string;
  now?: Date;
  status?: RegisterUseCaseStatus;
  origin?: UseCaseOrigin | null;
  assistContext?: CaptureAssistContext | null;
}

export function createUseCaseCardV11Draft(
  input: unknown,
  params: CreateUseCaseCardV11DraftParams
): UseCaseCard {
  const capture = parseCaptureInput(input);
  const timestamp = (params.now ?? new Date()).toISOString();
  const status = params.status ?? "UNREVIEWED";
  const dataCategories = normalizeDataCategories(
    capture.dataCategories,
    capture.dataCategory
  );
  const decisionImpact =
    capture.decisionImpact ??
    (capture.decisionInfluence === "ASSISTANCE"
      ? "NO"
      : capture.decisionInfluence === "AUTOMATED"
        ? "YES"
        : "UNSURE");

  return parseUseCaseCard({
    cardVersion: "1.1",
    useCaseId: params.useCaseId,
    createdAt: timestamp,
    updatedAt: timestamp,
    purpose: capture.purpose,
    usageContexts: capture.usageContexts,
    responsibility: {
      isCurrentlyResponsible: capture.isCurrentlyResponsible,
      responsibleParty: capture.responsibleParty ?? null,
      contactPersonName: capture.contactPersonName ?? null,
    },
    decisionImpact,
    decisionInfluence: capture.decisionInfluence,
    affectedParties: capture.affectedParties ?? [],
    status,
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    origin: params.origin ?? createUseCaseOrigin({ source: "manual" }),
    assistContext: params.assistContext ?? null,
    // v1.1 fields
    globalUseCaseId: params.globalUseCaseId,
    formatVersion: "v1.1",
    toolId: capture.toolId,
    toolFreeText: capture.toolFreeText,
    workflow: capture.workflow,
    dataCategory: dataCategories[0] ?? "INTERNAL_CONFIDENTIAL",
    dataCategories:
      dataCategories.length > 0 ? dataCategories : ["INTERNAL_CONFIDENTIAL"],
    publicHashId: params.publicHashId,
    isPublicVisible: false,
    // v1.2 fields
    organisation: capture.organisation ?? null,
    standardVersion: "EUKI-UC-1.2",
  });
}
