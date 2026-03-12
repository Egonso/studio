import { z } from "zod";

import { parseUseCaseCard } from "./schema";
import { sanitizeFirestorePayload } from "./firestore-sanitize";
import { dataCategorySchema, TOOL_ID_OTHER } from "./tool-registry-types";
import type { UseCaseCard } from "./types";
import { prepareUseCaseForStorage } from "./use-case-builder";

export const SUPPLIER_REQUEST_FILTER = "supplier_requests" as const;
export const SUPPLIER_REQUEST_SOURCE_LABEL_KEY = "source" as const;
export const SUPPLIER_REQUEST_SOURCE_LABEL_VALUE = "supplier_request" as const;
export const SUPPLIER_REQUEST_EMAIL_LABEL_KEY = "supplier_email" as const;
export const SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT = "INTERNAL_ONLY" as const;

const supplierRequestSubmissionSchema = z.object({
  supplierEmail: z.string().trim().email().max(320),
  toolName: z.string().trim().min(1).max(300),
  purpose: z.string().trim().min(3).max(500),
  dataCategory: dataCategorySchema,
  aiActCategory: z.string().trim().max(120).optional().nullable(),
});

type UseCaseLabel = NonNullable<UseCaseCard["labels"]>[number];

export type SupplierRequestSubmission = z.infer<
  typeof supplierRequestSubmissionSchema
>;

export interface CreateSupplierRequestUseCaseOptions {
  useCaseId: string;
  organisationName?: string | null;
  now?: Date;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mergeLabels(
  existing: UseCaseCard["labels"],
  additions: UseCaseLabel[]
): UseCaseLabel[] {
  const merged = new Map<string, string>();

  for (const label of existing ?? []) {
    merged.set(label.key, label.value);
  }

  for (const label of additions) {
    merged.set(label.key, label.value);
  }

  return Array.from(merged.entries()).map(([key, value]) => ({ key, value }));
}

export function parseSupplierRequestSubmission(
  input: unknown
): SupplierRequestSubmission {
  return supplierRequestSubmissionSchema.parse(input);
}

export function createSupplierRequestUseCase(
  input: unknown,
  options: CreateSupplierRequestUseCaseOptions
): UseCaseCard {
  const submission = parseSupplierRequestSubmission(input);
  const currentTime = options.now ?? new Date();
  const cardDraft = prepareUseCaseForStorage(
    {
      purpose: submission.purpose,
      usageContexts: [SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT],
      isCurrentlyResponsible: false,
      responsibleParty: submission.supplierEmail,
      decisionImpact: "UNSURE",
      toolId: TOOL_ID_OTHER,
      toolFreeText: submission.toolName,
      dataCategory: submission.dataCategory,
      dataCategories: [submission.dataCategory],
      organisation: normalizeOptionalText(options.organisationName),
    },
    {
      useCaseId: options.useCaseId,
      now: currentTime,
    }
  );

  const timestamp = currentTime.toISOString();

  return parseUseCaseCard({
    ...cardDraft,
    labels: mergeLabels(cardDraft.labels, [
      {
        key: SUPPLIER_REQUEST_SOURCE_LABEL_KEY,
        value: SUPPLIER_REQUEST_SOURCE_LABEL_VALUE,
      },
      {
        key: SUPPLIER_REQUEST_EMAIL_LABEL_KEY,
        value: submission.supplierEmail,
      },
    ]),
    reviewHints: [
      ...cardDraft.reviewHints,
      "Lieferantenanfrage eingegangen.",
      "Wirkungsbereich aus Lieferantenanfrage pruefen.",
    ],
    governanceAssessment: {
      core: {
        aiActCategory: normalizeOptionalText(submission.aiActCategory),
        assessedAt: timestamp,
      },
      flex: {},
    },
    capturedBy: "SUPPLIER_REQUEST",
    capturedByName: submission.supplierEmail,
  });
}

export function isSupplierRequestCard(
  card: Pick<UseCaseCard, "labels">
): boolean {
  return (
    getUseCaseLabelValue(card, SUPPLIER_REQUEST_SOURCE_LABEL_KEY) ===
    SUPPLIER_REQUEST_SOURCE_LABEL_VALUE
  );
}

export function getUseCaseLabelValue(
  card: Pick<UseCaseCard, "labels">,
  key: string
): string | null {
  const value = card.labels?.find((label) => label.key === key)?.value;
  return normalizeOptionalText(value);
}

export function getSupplierRequestContact(
  card: Pick<UseCaseCard, "labels" | "responsibility">
): string | null {
  return (
    getUseCaseLabelValue(card, SUPPLIER_REQUEST_EMAIL_LABEL_KEY) ??
    normalizeOptionalText(card.responsibility.responsibleParty)
  );
}

export function sanitizeSupplierRequestCard(card: UseCaseCard): UseCaseCard {
  return sanitizeFirestorePayload(card);
}
