import {
  normalizeWorkflowConnectionMode,
  resolveOrderedSystemsFromCard,
  splitOrderedSystemsForStorage,
} from "./card-model";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
  OrderedUseCaseSystem,
  UseCaseWorkflow,
  WorkflowConnectionMode,
} from "./types";

export const CAPTURE_TOOL_PLACEHOLDER_ID = "__placeholder__";

export const SHARED_CAPTURE_FIELD_IDS = {
  purpose: "qc-purpose",
  ownerRole: "qc-owner",
  tool: "qc-tool",
} as const;

export type SharedCaptureFieldName = "purpose" | "ownerRole";

export type SharedCaptureFieldErrors = Partial<
  Record<SharedCaptureFieldName, string>
>;

export interface SharedCaptureFieldsInput {
  purpose: string;
  ownerRole: string;
  contactPersonName?: string | null;
  toolId?: string | null;
  toolFreeText?: string | null;
  systems?: Array<{
    entryId?: string | null;
    toolId?: string | null;
    toolFreeText?: string | null;
  }> | null;
  workflowConnectionMode?: WorkflowConnectionMode | string | null;
  workflowSummary?: string | null;
  usageContexts?: CaptureUsageContext[] | null;
  dataCategories?: DataCategory[] | null;
  decisionInfluence?: DecisionInfluence | null;
}

export interface NormalizedSharedCaptureFields {
  purpose: string;
  ownerRole: string;
  contactPersonName?: string;
  toolId?: string;
  toolFreeText?: string;
  orderedSystems: OrderedUseCaseSystem[];
  workflow?: UseCaseWorkflow;
  usageContexts: CaptureUsageContext[];
  dataCategories?: DataCategory[];
  decisionInfluence?: DecisionInfluence;
}

export interface SharedCaptureNormalizationOptions {
  multisystemEnabled?: boolean;
}

export interface SharedCaptureValidationResult {
  isValid: boolean;
  errors: SharedCaptureFieldErrors;
  firstInvalidField: SharedCaptureFieldName | null;
  normalized: NormalizedSharedCaptureFields;
}

function normalizeText(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSystemDraftEntry(input: {
  entryId?: string | null;
  toolId?: string | null;
  toolFreeText?: string | null;
  position: number;
}): OrderedUseCaseSystem | null {
  const toolId =
    input.toolId && input.toolId !== CAPTURE_TOOL_PLACEHOLDER_ID
      ? input.toolId
      : undefined;
  const toolFreeText = normalizeText(input.toolFreeText);

  if (toolId === "other" && !toolFreeText) {
    return null;
  }

  if (!toolId && !toolFreeText) {
    return null;
  }

  return {
    entryId: normalizeText(input.entryId) ?? `capture_system_${input.position}`,
    position: input.position,
    toolId: toolId ?? (toolFreeText ? "other" : undefined),
    toolFreeText,
  };
}

export function normalizeSharedCaptureFields(
  input: SharedCaptureFieldsInput,
  options: SharedCaptureNormalizationOptions = {}
): NormalizedSharedCaptureFields {
  const normalizedPurpose = normalizeText(input.purpose) ?? "";
  const normalizedOwnerRole = normalizeText(input.ownerRole) ?? "";
  const normalizedToolId =
    input.toolId && input.toolId !== CAPTURE_TOOL_PLACEHOLDER_ID
      ? input.toolId
      : undefined;
  const normalizedToolFreeText = normalizeText(input.toolFreeText);
  const multisystemEnabled = options.multisystemEnabled === true;

  const initialSystems = multisystemEnabled && Array.isArray(input.systems)
    ? input.systems
        .map((system, index) =>
          normalizeSystemDraftEntry({
            entryId: system?.entryId,
            toolId: system?.toolId,
            toolFreeText: system?.toolFreeText,
            position: index + 1,
          })
        )
        .filter((system): system is OrderedUseCaseSystem => system !== null)
    : [];

  if (initialSystems.length === 0) {
    const fallbackPrimarySystem = normalizeSystemDraftEntry({
      entryId: "primary",
      toolId: normalizedToolId,
      toolFreeText: normalizedToolFreeText,
      position: 1,
    });

    if (fallbackPrimarySystem) {
      initialSystems.push(fallbackPrimarySystem);
    }
  }

  const canStoreWorkflow = multisystemEnabled && initialSystems.length >= 2;
  const splitSystems = splitOrderedSystemsForStorage(initialSystems, {
    workflow: canStoreWorkflow
      ? {
          connectionMode: normalizeWorkflowConnectionMode(
            input.workflowConnectionMode
          ),
          summary: normalizeText(input.workflowSummary),
        }
      : undefined,
    createEntryId: () => `capture_system_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`,
  });
  const orderedSystems = resolveOrderedSystemsFromCard(splitSystems);

  return {
    purpose: normalizedPurpose,
    ownerRole: normalizedOwnerRole,
    contactPersonName: normalizeText(input.contactPersonName),
    toolId: splitSystems.toolId,
    toolFreeText: splitSystems.toolFreeText,
    orderedSystems,
    workflow: canStoreWorkflow ? splitSystems.workflow : undefined,
    usageContexts:
      input.usageContexts && input.usageContexts.length > 0
        ? [...input.usageContexts]
        : (["INTERNAL_ONLY"] as CaptureUsageContext[]),
    dataCategories:
      input.dataCategories && input.dataCategories.length > 0
        ? [...input.dataCategories]
        : undefined,
    decisionInfluence: input.decisionInfluence ?? undefined,
  };
}

export function validateSharedCaptureFields(
  input: SharedCaptureFieldsInput,
  options: SharedCaptureNormalizationOptions = {}
): SharedCaptureValidationResult {
  const normalized = normalizeSharedCaptureFields(input, options);
  const errors: SharedCaptureFieldErrors = {};

  if (normalized.purpose.length < 3) {
    errors.purpose =
      "Please enter a use case name with at least 3 characters.";
  }

  if (normalized.ownerRole.length < 2) {
    errors.ownerRole =
      "Please enter an owner role or function with at least 2 characters.";
  }

  const firstInvalidField =
    (Object.keys(SHARED_CAPTURE_FIELD_IDS) as Array<keyof typeof SHARED_CAPTURE_FIELD_IDS>)
      .find(
        (fieldName): fieldName is SharedCaptureFieldName =>
          fieldName !== "tool" && Boolean(errors[fieldName])
      ) ?? null;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstInvalidField,
    normalized,
  };
}
