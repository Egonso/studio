import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
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
  usageContexts: CaptureUsageContext[];
  dataCategories?: DataCategory[];
  decisionInfluence?: DecisionInfluence;
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

export function normalizeSharedCaptureFields(
  input: SharedCaptureFieldsInput
): NormalizedSharedCaptureFields {
  const normalizedPurpose = normalizeText(input.purpose) ?? "";
  const normalizedOwnerRole = normalizeText(input.ownerRole) ?? "";
  const normalizedToolId =
    input.toolId && input.toolId !== CAPTURE_TOOL_PLACEHOLDER_ID
      ? input.toolId
      : undefined;
  const normalizedToolFreeText = normalizeText(input.toolFreeText);

  return {
    purpose: normalizedPurpose,
    ownerRole: normalizedOwnerRole,
    contactPersonName: normalizeText(input.contactPersonName),
    toolId:
      normalizedToolId === "other"
        ? normalizedToolFreeText
          ? "other"
          : undefined
        : normalizedToolId,
    toolFreeText:
      normalizedToolId === "other" ? normalizedToolFreeText : undefined,
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
  input: SharedCaptureFieldsInput
): SharedCaptureValidationResult {
  const normalized = normalizeSharedCaptureFields(input);
  const errors: SharedCaptureFieldErrors = {};

  if (normalized.purpose.length < 3) {
    errors.purpose =
      "Bitte gib einen Use-Case-Namen mit mindestens 3 Zeichen an.";
  }

  if (normalized.ownerRole.length < 2) {
    errors.ownerRole =
      "Bitte gib eine Owner-Rolle oder Funktion mit mindestens 2 Zeichen an.";
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
