import { z } from "zod";

import {
  normalizeDataCategories,
  normalizeUseCaseWorkflow,
  normalizeWorkflowConnectionMode,
  resolveOrderedSystemsFromCard,
  splitOrderedSystemsForStorage,
} from "./card-model";
import { parseUseCaseCard } from "./schema";
import { createUseCaseOrigin } from "./migration";
import { sanitizeFirestorePayload } from "./firestore-sanitize";
import { dataCategorySchema, TOOL_ID_OTHER } from "./tool-registry-types";
import {
  DATA_CATEGORY_SPECIAL_OPTIONS,
  type DataCategory,
  type OrderedUseCaseSystem,
  type UseCaseCard,
  type UseCaseWorkflow,
} from "./types";
import { prepareUseCaseForStorage } from "./use-case-builder";

export const SUPPLIER_REQUEST_FILTER = "supplier_requests" as const;
export const SUPPLIER_REQUEST_SOURCE_LABEL_KEY = "source" as const;
export const SUPPLIER_REQUEST_SOURCE_LABEL_VALUE = "supplier_request" as const;
export const SUPPLIER_REQUEST_EMAIL_LABEL_KEY = "supplier_email" as const;
export const SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT = "INTERNAL_ONLY" as const;

const supplierRequestSystemSchema = z
  .union([
    z.string().trim().min(1).max(300),
    z
      .object({
        entryId: z.string().trim().min(1).max(200).optional().nullable(),
        toolId: z.string().trim().min(1).max(100).optional().nullable(),
        toolFreeText: z.string().trim().min(1).max(300).optional().nullable(),
        name: z.string().trim().min(1).max(300).optional().nullable(),
      })
      .superRefine((value, ctx) => {
        if (
          !value.toolId?.trim() &&
          !value.toolFreeText?.trim() &&
          !value.name?.trim()
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each system entry needs a system reference.",
          });
        }
      }),
  ])
  .optional();

const supplierRequestSubmissionSchema = z.object({
  supplierEmail: z.string().trim().email().max(320),
  toolName: z.string().trim().min(1).max(300),
  systems: z.array(supplierRequestSystemSchema).max(8).optional().nullable(),
  purpose: z.string().trim().min(3).max(500),
  dataCategory: dataCategorySchema.optional(),
  dataCategories: z.array(dataCategorySchema).max(13).optional().nullable(),
  aiActCategory: z.string().trim().max(120).optional().nullable(),
  workflowConnectionMode: z.string().trim().max(80).optional().nullable(),
  workflowSummary: z.string().trim().max(300).optional().nullable(),
  workflow: z.unknown().optional().nullable(),
}).superRefine((value, ctx) => {
  if (
    !Array.isArray(value.dataCategories) &&
    !value.dataCategory
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mindestens eine Datenkategorie ist erforderlich.",
      path: ["dataCategories"],
    });
  }
});

type UseCaseLabel = NonNullable<UseCaseCard["labels"]>[number];
type SupplierRequestSystemInput = z.infer<typeof supplierRequestSystemSchema>;

export interface SupplierRequestSubmission extends Record<string, unknown> {
  supplierEmail: string;
  toolName: string;
  purpose: string;
  dataCategory: DataCategory;
  dataCategories: DataCategory[];
  aiActCategory?: string | null;
  workflow?: UseCaseWorkflow;
}

export interface CreateSupplierRequestUseCaseOptions {
  useCaseId: string;
  organisationName?: string | null;
  now?: Date;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeSupplierRequestDataCategories(
  values: unknown,
  fallbackValue?: unknown
): DataCategory[] {
  let normalized = normalizeDataCategories(values, fallbackValue);

  const hasSpecialChildren = normalized.some((value) =>
    DATA_CATEGORY_SPECIAL_OPTIONS.includes(value)
  );

  if (normalized.includes("SPECIAL_PERSONAL") || hasSpecialChildren) {
    if (!normalized.includes("SPECIAL_PERSONAL")) {
      normalized = [...normalized, "SPECIAL_PERSONAL"];
    }
    if (!normalized.includes("PERSONAL_DATA")) {
      normalized = [...normalized, "PERSONAL_DATA"];
    }
  }

  return Array.from(new Set(normalized));
}

function normalizeSupplierSystemInput(
  input: SupplierRequestSystemInput,
  position: number
): Partial<OrderedUseCaseSystem> | null {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    const toolFreeText = normalizeOptionalText(input);
    if (!toolFreeText) {
      return null;
    }

    return {
      entryId: `supplier_system_${position}`,
      position,
      toolId: TOOL_ID_OTHER,
      toolFreeText,
    };
  }

  const toolId = normalizeOptionalText(input.toolId) ?? undefined;
  const toolFreeText =
    normalizeOptionalText(input.toolFreeText) ??
    normalizeOptionalText(input.name) ??
    undefined;

  if (!toolId && !toolFreeText) {
    return null;
  }

  return {
    entryId: normalizeOptionalText(input.entryId) ?? `supplier_system_${position}`,
    position,
    toolId: toolId ?? (toolFreeText ? TOOL_ID_OTHER : undefined),
    toolFreeText,
  };
}

function dedupeOrderedSystems(
  systems: ReadonlyArray<Partial<OrderedUseCaseSystem>>
): OrderedUseCaseSystem[] {
  const seen = new Set<string>();
  const deduped: OrderedUseCaseSystem[] = [];

  for (const [index, system] of systems.entries()) {
    const toolId = normalizeOptionalText(system.toolId) ?? undefined;
    const toolFreeText = normalizeOptionalText(system.toolFreeText) ?? undefined;

    if (!toolId && !toolFreeText) {
      continue;
    }

    const key = `${toolId ?? ""}::${toolFreeText?.toLowerCase() ?? ""}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push({
      entryId:
        normalizeOptionalText(system.entryId) ?? `supplier_system_${index + 1}`,
      position: deduped.length + 1,
      toolId: toolId ?? (toolFreeText ? TOOL_ID_OTHER : undefined),
      toolFreeText,
    });
  }

  return deduped;
}

function resolveSupplierWorkflow(
  toolName: string,
  systems: SupplierRequestSystemInput[] | null | undefined,
  workflowConnectionMode: string | null | undefined,
  workflowSummary: string | null | undefined,
  fallbackWorkflow: UseCaseWorkflow | undefined
): UseCaseWorkflow | undefined {
  const primarySystem: OrderedUseCaseSystem = {
    entryId: "primary",
    position: 1,
    toolId: TOOL_ID_OTHER,
    toolFreeText: toolName,
  };
  const explicitSystems = (systems ?? [])
    .map((system, index) => normalizeSupplierSystemInput(system, index + 2))
    .filter(
      (system): system is Partial<OrderedUseCaseSystem> => system !== null
    );
  const orderedSystems =
    explicitSystems.length > 0
      ? dedupeOrderedSystems([primarySystem, ...explicitSystems])
      : resolveOrderedSystemsFromCard({
          toolId: primarySystem.toolId,
          toolFreeText: primarySystem.toolFreeText,
          workflow: fallbackWorkflow,
        });
  const splitSystems = splitOrderedSystemsForStorage(orderedSystems, {
    workflow: {
      connectionMode:
        normalizeWorkflowConnectionMode(workflowConnectionMode) ??
        fallbackWorkflow?.connectionMode,
      summary: normalizeOptionalText(workflowSummary) ?? fallbackWorkflow?.summary,
    },
    createEntryId: () =>
      `supplier_system_${Math.random().toString(36).slice(2, 10)}`,
  });

  return splitSystems.workflow;
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
  const parsed = supplierRequestSubmissionSchema.parse(input);
  const toolName = parsed.toolName.trim();
  const dataCategories = normalizeSupplierRequestDataCategories(
    parsed.dataCategories,
    parsed.dataCategory
  );

  return {
    supplierEmail: parsed.supplierEmail,
    toolName,
    purpose: parsed.purpose,
    dataCategory: dataCategories[0],
    dataCategories,
    aiActCategory: normalizeOptionalText(parsed.aiActCategory),
    workflow: resolveSupplierWorkflow(
      toolName,
      parsed.systems,
      parsed.workflowConnectionMode,
      parsed.workflowSummary,
      normalizeUseCaseWorkflow(parsed.workflow)
    ),
  };
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
      workflow: submission.workflow,
      dataCategory: submission.dataCategory,
      dataCategories: submission.dataCategories,
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
    origin: createUseCaseOrigin({
      source: "supplier_request",
      submittedByName: submission.supplierEmail,
      submittedByEmail: submission.supplierEmail,
      sourceRequestId: null,
      capturedByUserId: null,
    }),
    capturedBy: "SUPPLIER_REQUEST",
    capturedByName: submission.supplierEmail,
  });
}

export function isSupplierRequestCard(
  card: Pick<UseCaseCard, "labels" | "origin" | "externalIntake" | "capturedBy">
): boolean {
  return (
    getUseCaseLabelValue(card, SUPPLIER_REQUEST_SOURCE_LABEL_KEY) ===
      SUPPLIER_REQUEST_SOURCE_LABEL_VALUE ||
    card.origin?.source === "supplier_request" ||
    card.externalIntake?.sourceType === "supplier_request" ||
    card.capturedBy === "SUPPLIER_REQUEST"
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
  card: Pick<UseCaseCard, "labels" | "responsibility" | "origin">
): string | null {
  return (
    normalizeOptionalText(card.origin?.submittedByEmail) ??
    getUseCaseLabelValue(card, SUPPLIER_REQUEST_EMAIL_LABEL_KEY) ??
    normalizeOptionalText(card.responsibility.responsibleParty)
  );
}

export function sanitizeSupplierRequestCard(card: UseCaseCard): UseCaseCard {
  return sanitizeFirestorePayload(card);
}
