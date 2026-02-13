import { z } from "zod";
import type {
  CaptureInput,
  GovernanceDecisionActor,
  RegisterUseCaseStatus,
  UseCaseCard,
} from "./types";
import { dataCategorySchema } from "./tool-registry-types.ts";

const registerUseCaseStatusValues = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
] as const;

const captureUsageContextValues = [
  "INTERNAL_ONLY",
  "CUSTOMER_FACING",
  "EMPLOYEE_FACING",
  "EXTERNAL_PUBLIC",
] as const;

const decisionImpactValues = ["YES", "NO", "UNSURE"] as const;

const affectedPartyValues = [
  "INDIVIDUALS",
  "GROUPS_OR_TEAMS",
  "EXTERNAL_PEOPLE",
  "INTERNAL_PROCESSES",
] as const;

export const registerUseCaseStatusSchema = z.enum(registerUseCaseStatusValues);
export const captureUsageContextSchema = z.enum(captureUsageContextValues);
export const decisionImpactSchema = z.enum(decisionImpactValues);
export const affectedPartySchema = z.enum(affectedPartyValues);

// ── Card version schema ─────────────────────────────────────────────────────
const cardVersionSchema = z.enum(["1.0", "1.1"]);

// ── Capture Input Schema (extended for v1.1) ────────────────────────────────
export const captureInputSchema = z
  .object({
    purpose: z.string().trim().min(3).max(500),
    usageContexts: z.array(captureUsageContextSchema).min(1).max(4),
    isCurrentlyResponsible: z.boolean(),
    responsibleParty: z.string().trim().min(2).max(120).optional().nullable(),
    decisionImpact: decisionImpactSchema,
    affectedParties: z.array(affectedPartySchema).max(4).optional(),
    // v1.1 capture fields (optional for backward compat)
    toolId: z.string().min(1).max(100).optional(),
    toolFreeText: z.string().trim().min(1).max(300).optional(),
    dataCategory: dataCategorySchema.optional(),
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

const evidenceReferenceSchema = z.object({
  evidenceId: z.string().min(1),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["NOTE", "DOCUMENT", "LINK"]),
  uri: z.string().url().optional(),
});

// ── UseCaseCard Schema (accepts both v1.0 and v1.1) ─────────────────────────
export const useCaseCardSchema = z
  .object({
    cardVersion: cardVersionSchema,
    useCaseId: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    purpose: z.string().trim().min(3).max(500),
    usageContexts: z.array(captureUsageContextSchema).min(1).max(4),
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
    decisionImpact: decisionImpactSchema,
    affectedParties: z.array(affectedPartySchema).max(4),
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
    dataCategory: dataCategorySchema.optional(),
    publicHashId: z.string().min(8).max(24).optional(),
    isPublicVisible: z.boolean().optional(),
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
  return {
    ...parsed,
    affectedParties: parsed.affectedParties ?? [],
  };
}

export function parseUseCaseCard(input: unknown): UseCaseCard {
  return useCaseCardSchema.parse(input) as UseCaseCard;
}

export function assertManualGovernanceDecision(actor: GovernanceDecisionActor) {
  if (actor !== "HUMAN") {
    throw new Error(
      "Automated governance decisions are prohibited in Register First."
    );
  }
}

// ── v1.0 Card Draft (backward compat – no v1.1 fields) ─────────────────────
interface CreateUseCaseCardDraftParams {
  useCaseId: string;
  now?: Date;
  status?: RegisterUseCaseStatus;
}

export function createUseCaseCardDraft(
  input: unknown,
  params: CreateUseCaseCardDraftParams
): UseCaseCard {
  const capture = parseCaptureInput(input);
  const timestamp = (params.now ?? new Date()).toISOString();
  const status = params.status ?? "UNREVIEWED";

  return parseUseCaseCard({
    cardVersion: "1.0",
    useCaseId: params.useCaseId,
    createdAt: timestamp,
    updatedAt: timestamp,
    purpose: capture.purpose,
    usageContexts: capture.usageContexts,
    responsibility: {
      isCurrentlyResponsible: capture.isCurrentlyResponsible,
      responsibleParty: capture.responsibleParty ?? null,
    },
    decisionImpact: capture.decisionImpact,
    affectedParties: capture.affectedParties ?? [],
    status,
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  });
}

// ── v1.1 Card Draft (with tool, dataCategory, IDs) ─────────────────────────
interface CreateUseCaseCardV11DraftParams {
  useCaseId: string;
  globalUseCaseId: string;
  publicHashId: string;
  now?: Date;
  status?: RegisterUseCaseStatus;
}

export function createUseCaseCardV11Draft(
  input: unknown,
  params: CreateUseCaseCardV11DraftParams
): UseCaseCard {
  const capture = parseCaptureInput(input);
  const timestamp = (params.now ?? new Date()).toISOString();
  const status = params.status ?? "UNREVIEWED";

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
    },
    decisionImpact: capture.decisionImpact,
    affectedParties: capture.affectedParties ?? [],
    status,
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    // v1.1 fields
    globalUseCaseId: params.globalUseCaseId,
    formatVersion: "v1.1",
    toolId: capture.toolId,
    toolFreeText: capture.toolFreeText,
    dataCategory: capture.dataCategory ?? "INTERNAL",
    publicHashId: params.publicHashId,
    isPublicVisible: false,
  });
}
