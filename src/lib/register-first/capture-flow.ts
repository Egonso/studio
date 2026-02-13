import type {
  AffectedParty,
  CaptureInput,
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
} from "./types";

export interface CaptureFormDraft {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  isCurrentlyResponsible: boolean | null;
  responsibleParty: string;
  decisionImpact: DecisionImpact | null;
  affectedParties: AffectedParty[];
  // v1.1 fields
  toolId: string;
  toolFreeText: string;
  dataCategory: DataCategory | null;
}

export type CaptureFieldErrors = Partial<
  Record<
    | "purpose"
    | "usageContexts"
    | "isCurrentlyResponsible"
    | "responsibleParty"
    | "decisionImpact"
    | "toolId"
    | "toolFreeText"
    | "dataCategory",
    string
  >
>;

export interface CaptureValidationResult {
  isValid: boolean;
  errors: CaptureFieldErrors;
}

export function createEmptyCaptureDraft(): CaptureFormDraft {
  return {
    purpose: "",
    usageContexts: [],
    isCurrentlyResponsible: null,
    responsibleParty: "",
    decisionImpact: null,
    affectedParties: [],
    toolId: "",
    toolFreeText: "",
    dataCategory: null,
  };
}

export function shouldShowAffectedParties(
  decisionImpact: DecisionImpact | null
): boolean {
  return decisionImpact === "YES" || decisionImpact === "UNSURE";
}

export function validateCaptureDraft(draft: CaptureFormDraft): CaptureValidationResult {
  const errors: CaptureFieldErrors = {};

  if (!draft.purpose || draft.purpose.trim().length < 3) {
    errors.purpose = "Bitte gib einen kurzen Satz zum Zweck ein.";
  }

  if (!Array.isArray(draft.usageContexts) || draft.usageContexts.length === 0) {
    errors.usageContexts = "Bitte wähle mindestens einen Wirkungskontext.";
  }

  if (draft.isCurrentlyResponsible === null) {
    errors.isCurrentlyResponsible = "Bitte wähle Ja oder Nein.";
  }

  if (
    draft.isCurrentlyResponsible === false &&
    (!draft.responsibleParty || draft.responsibleParty.trim().length < 2)
  ) {
    errors.responsibleParty = "Bitte gib Name oder Rolle an.";
  }

  if (!draft.decisionImpact) {
    errors.decisionImpact = "Bitte wähle eine Option zur Entscheidungsrelevanz.";
  }

  // v1.1: toolFreeText required when toolId is "other"
  if (
    draft.toolId === "other" &&
    (!draft.toolFreeText || draft.toolFreeText.trim().length === 0)
  ) {
    errors.toolFreeText = "Bitte gib den Tool-Namen ein.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function toCaptureInput(draft: CaptureFormDraft): CaptureInput {
  if (draft.isCurrentlyResponsible === null || !draft.decisionImpact) {
    throw new Error("Incomplete capture draft.");
  }

  const result: CaptureInput = {
    purpose: draft.purpose.trim(),
    usageContexts: draft.usageContexts,
    isCurrentlyResponsible: draft.isCurrentlyResponsible,
    responsibleParty:
      draft.isCurrentlyResponsible === false
        ? draft.responsibleParty.trim()
        : null,
    decisionImpact: draft.decisionImpact,
    affectedParties: shouldShowAffectedParties(draft.decisionImpact)
      ? draft.affectedParties
      : [],
  };

  // v1.1 fields (only include if provided)
  if (draft.toolId && draft.toolId.length > 0) {
    result.toolId = draft.toolId;
    if (draft.toolId === "other" && draft.toolFreeText) {
      result.toolFreeText = draft.toolFreeText.trim();
    }
  }
  if (draft.dataCategory) {
    result.dataCategory = draft.dataCategory;
  }

  return result;
}

export type SaveCaptureInput<T> = (payload: CaptureInput) => Promise<T>;

export type SubmitCaptureResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: CaptureFieldErrors };

export async function submitCaptureDraft<T>(
  draft: CaptureFormDraft,
  save: SaveCaptureInput<T>
): Promise<SubmitCaptureResult<T>> {
  const validation = validateCaptureDraft(draft);
  if (!validation.isValid) {
    return { ok: false, errors: validation.errors };
  }

  const payload = toCaptureInput(draft);
  const value = await save(payload);
  return { ok: true, value };
}
