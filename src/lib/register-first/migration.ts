import { generateGlobalUseCaseId, generatePublicHashId } from "./id-generation";
import {
  CANONICAL_CARD_VERSION,
  normalizeCaptureUsageContext,
  normalizeCaptureUsageContexts,
  normalizeCardVersion,
  normalizeDataCategories,
  normalizeRegisterUseCaseStatus,
  normalizeUseCaseWorkflow,
  normalizeUseCaseOriginSource,
} from "./card-model";
import type {
  DecisionImpact,
  DecisionInfluence,
  ToolPublicInfo,
  UseCaseCard,
  UseCaseOrigin,
  UseCaseSystemProviderType,
} from "./types";

const SOURCE_LABEL_KEY = "source";
const SOURCE_LABEL_SUPPLIER_REQUEST = "supplier_request";
const SUPPLIER_EMAIL_LABEL_KEY = "supplier_email";

const SYSTEM_CAPTURE_MARKERS = new Set([
  "ANONYMOUS",
  "SUPPLIER_REQUEST",
  "IMPORT",
  "IMPORTED",
  "ACCESS_CODE",
]);

const SYSTEM_PROVIDER_TYPES = new Set([
  "TOOL",
  "API",
  "MODEL",
  "CONNECTOR",
  "INTERNAL",
  "OTHER",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function looksLikeEmail(value: string | null): boolean {
  return value !== null && value.includes("@");
}

function normalizeDecisionImpactValue(
  value: unknown,
  decisionInfluence: unknown,
  inferredSource: UseCaseOrigin["source"]
): DecisionImpact {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "YES" || normalized === "NO" || normalized === "UNSURE") {
      return normalized;
    }
  }

  if (typeof decisionInfluence === "string") {
    const normalizedInfluence = decisionInfluence.trim().toUpperCase();
    if (normalizedInfluence === "ASSISTANCE") {
      return "NO";
    }
    if (normalizedInfluence === "AUTOMATED") {
      return "YES";
    }
    if (normalizedInfluence === "PREPARATION") {
      return "UNSURE";
    }
  }

  return inferredSource === "supplier_request" || inferredSource === "access_code"
    ? "UNSURE"
    : "NO";
}

function normalizeDecisionInfluenceValue(
  value: unknown
): DecisionInfluence | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (
    normalized === "ASSISTANCE" ||
    normalized === "PREPARATION" ||
    normalized === "AUTOMATED"
  ) {
    return normalized;
  }

  return undefined;
}

function getLabelValue(input: unknown, key: string): string | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const match = input.find((entry) => {
    return (
      isRecord(entry) &&
      normalizeOptionalText(entry.key)?.toLowerCase() === key.toLowerCase()
    );
  });

  return isRecord(match) ? normalizeOptionalText(match.value) : null;
}

function mergeLabels(
  input: unknown,
  additions: Array<{ key: string; value: string | null }>
): Array<{ key: string; value: string }> | undefined {
  const merged = new Map<string, string>();

  if (Array.isArray(input)) {
    for (const entry of input) {
      if (!isRecord(entry)) {
        continue;
      }

      const key = normalizeOptionalText(entry.key);
      const value = normalizeOptionalText(entry.value);
      if (key && value) {
        merged.set(key, value);
      }
    }
  }

  for (const addition of additions) {
    if (addition.value) {
      merged.set(addition.key, addition.value);
    }
  }

  if (merged.size === 0) {
    return undefined;
  }

  return Array.from(merged.entries()).map(([key, value]) => ({ key, value }));
}

function normalizeSystemProviderType(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  return SYSTEM_PROVIDER_TYPES.has(normalized) ? normalized : undefined;
}

function normalizeSystemPublicInfo(
  input: unknown
): UseCaseCard["systemPublicInfo"] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const normalizedEntries = input.flatMap((entry) => {
    if (!isRecord(entry) || !isRecord(entry.publicInfo)) {
      return [];
    }

    const systemKey = normalizeOptionalText(entry.systemKey);
    const toolId = normalizeOptionalText(entry.toolId) ?? undefined;
    const toolFreeText = normalizeOptionalText(entry.toolFreeText) ?? undefined;
    const displayName =
      normalizeOptionalText(entry.displayName) ?? toolFreeText ?? toolId ?? null;

    if (!systemKey || !displayName) {
      return [];
    }

    return [
      {
        systemKey,
        toolId,
        toolFreeText,
        displayName,
        vendor: normalizeOptionalText(entry.vendor),
        providerType: normalizeSystemProviderType(
          entry.providerType
        ) as UseCaseSystemProviderType | undefined,
        publicInfo: entry.publicInfo as unknown as ToolPublicInfo,
      },
    ];
  });

  return normalizedEntries.length > 0 ? normalizedEntries : undefined;
}

function inferLegacyOriginSource(input: unknown): UseCaseOrigin["source"] {
  if (!isRecord(input)) {
    return "manual";
  }

  const existingOrigin = isRecord(input.origin)
    ? normalizeUseCaseOriginSource(input.origin.source)
    : null;
  if (existingOrigin) {
    return existingOrigin;
  }

  const externalIntake = isRecord(input.externalIntake) ? input.externalIntake : null;
  const externalSourceType = externalIntake
    ? normalizeUseCaseOriginSource(externalIntake.sourceType)
    : null;
  if (externalSourceType) {
    return externalSourceType;
  }

  const externalSource = externalIntake
    ? normalizeOptionalText(externalIntake.source)?.toUpperCase()
    : null;
  if (externalSource === "ACCESS_CODE") {
    return "access_code";
  }
  if (externalSource === "SUPPLIER_REQUEST_LINK") {
    return "supplier_request";
  }

  const sourceLabel = getLabelValue(input.labels, SOURCE_LABEL_KEY);
  if (sourceLabel === SOURCE_LABEL_SUPPLIER_REQUEST) {
    return "supplier_request";
  }

  const capturedBy = normalizeOptionalText(input.capturedBy)?.toUpperCase();
  if (capturedBy === "SUPPLIER_REQUEST") {
    return "supplier_request";
  }
  if (capturedBy === "IMPORT" || capturedBy === "IMPORTED") {
    return "import";
  }

  if (input.capturedViaCode === true) {
    return "access_code";
  }

  return "manual";
}

function normalizeCapturedByUserId(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (SYSTEM_CAPTURE_MARKERS.has(normalized.toUpperCase())) {
    return null;
  }

  if (looksLikeEmail(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeResponsibility(
  input: Record<string, unknown>,
  inferredSource: UseCaseOrigin["source"]
): {
  isCurrentlyResponsible: boolean;
  responsibleParty?: string | null;
  contactPersonName?: string | null;
} {
  const responsibility = isRecord(input.responsibility) ? input.responsibility : null;
  const supplierEmail =
    getLabelValue(input.labels, SUPPLIER_EMAIL_LABEL_KEY) ??
    normalizeOptionalText(input.supplierEmail);

  const responsibleParty =
    (responsibility && normalizeOptionalText(responsibility.responsibleParty)) ??
    (inferredSource === "supplier_request" ? supplierEmail : null);

  const contactPersonName =
    (responsibility && normalizeOptionalText(responsibility.contactPersonName)) ??
    null;

  return {
    isCurrentlyResponsible:
      typeof responsibility?.isCurrentlyResponsible === "boolean"
        ? responsibility.isCurrentlyResponsible
        : false,
    responsibleParty,
    contactPersonName,
  };
}

function inferStatusFallback(input: Record<string, unknown>) {
  if (isRecord(input.proof) && normalizeOptionalText(input.proof.verifyUrl)) {
    return "PROOF_READY" as const;
  }

  if (Array.isArray(input.reviews) && input.reviews.length > 0) {
    return "REVIEWED" as const;
  }

  return "UNREVIEWED" as const;
}

function normalizeExternalIntakeTrace(
  input: unknown,
  inferredSource: UseCaseOrigin["source"]
): Record<string, unknown> | null {
  if (!isRecord(input)) {
    return null;
  }

  const source =
    normalizeOptionalText(input.source)?.toUpperCase() ??
    (inferredSource === "access_code"
      ? "ACCESS_CODE"
      : inferredSource === "supplier_request"
        ? "SUPPLIER_REQUEST_LINK"
        : null);

  if (!source) {
    return null;
  }

  return {
    ...input,
    source,
    sourceType:
      normalizeUseCaseOriginSource(input.sourceType) ??
      (inferredSource === "access_code" || inferredSource === "supplier_request"
        ? inferredSource
        : null),
    ownerId: normalizeOptionalText(input.ownerId),
    submissionId: normalizeOptionalText(input.submissionId),
    submittedByName: normalizeOptionalText(input.submittedByName),
    submittedByEmail: normalizeOptionalText(input.submittedByEmail),
    submittedByRole: normalizeOptionalText(input.submittedByRole),
    requestPath: normalizeOptionalText(input.requestPath),
    requestTokenId: normalizeOptionalText(input.requestTokenId),
    requestCode: normalizeOptionalText(input.requestCode),
    accessCodeId: normalizeOptionalText(input.accessCodeId),
    accessCode: normalizeOptionalText(input.accessCode),
    accessCodeLabel: normalizeOptionalText(input.accessCodeLabel),
  };
}

export function createUseCaseOrigin(input: {
  source: UseCaseOrigin["source"];
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  sourceRequestId?: string | null;
  capturedByUserId?: string | null;
}): UseCaseOrigin {
  return {
    source: input.source,
    submittedByName: normalizeOptionalText(input.submittedByName),
    submittedByEmail: normalizeOptionalText(input.submittedByEmail),
    sourceRequestId: normalizeOptionalText(input.sourceRequestId),
    capturedByUserId: normalizeOptionalText(input.capturedByUserId),
  };
}

function deriveUseCaseOrigin(input: Record<string, unknown>): UseCaseOrigin {
  const inferredSource = inferLegacyOriginSource(input);
  const origin = isRecord(input.origin) ? input.origin : null;
  const externalIntake = normalizeExternalIntakeTrace(
    input.externalIntake,
    inferredSource
  );
  const responsibility = normalizeResponsibility(input, inferredSource);
  const sourceLabelEmail = getLabelValue(input.labels, SUPPLIER_EMAIL_LABEL_KEY);
  const submittedByEmail =
    (origin && normalizeOptionalText(origin.submittedByEmail)) ??
    normalizeOptionalText(externalIntake?.submittedByEmail) ??
    sourceLabelEmail ??
    (inferredSource === "supplier_request" &&
    looksLikeEmail(responsibility.responsibleParty ?? null)
      ? responsibility.responsibleParty ?? null
      : null);

  const submittedByName =
    (origin && normalizeOptionalText(origin.submittedByName)) ??
    normalizeOptionalText(externalIntake?.submittedByName) ??
    normalizeOptionalText(input.capturedByName) ??
    normalizeOptionalText(responsibility.contactPersonName) ??
    submittedByEmail;

  const sourceRequestId =
    (origin && normalizeOptionalText(origin.sourceRequestId)) ??
    normalizeOptionalText(externalIntake?.submissionId) ??
    normalizeOptionalText(externalIntake?.requestTokenId) ??
    normalizeOptionalText(externalIntake?.accessCodeId) ??
    null;

  const capturedByUserId =
    (origin && normalizeCapturedByUserId(origin.capturedByUserId)) ??
    normalizeCapturedByUserId(input.capturedBy);

  return createUseCaseOrigin({
    source: inferredSource,
    submittedByName,
    submittedByEmail,
    sourceRequestId,
    capturedByUserId,
  });
}

function normalizeToolFields(input: Record<string, unknown>) {
  const toolId = normalizeOptionalText(input.toolId);
  const toolFreeText =
    normalizeOptionalText(input.toolFreeText) ??
    normalizeOptionalText(input.toolName);

  if (toolId === "other" || (!toolId && toolFreeText)) {
    return {
      toolId: "other",
      toolFreeText,
    };
  }

  return {
    toolId,
    toolFreeText,
  };
}

function shouldNormalizeSupplierLegacyContext(
  input: Record<string, unknown>,
  inferredSource: UseCaseOrigin["source"]
): boolean {
  if (inferredSource !== "supplier_request") {
    return false;
  }

  if (!Array.isArray(input.usageContexts) || input.usageContexts.length !== 1) {
    return false;
  }

  return normalizeCaptureUsageContext(input.usageContexts[0]) === "PUBLIC";
}

export function normalizeUseCaseCardRecord(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  const inferredSource = inferLegacyOriginSource(input);
  const responsibility = normalizeResponsibility(input, inferredSource);
  const usageContexts = shouldNormalizeSupplierLegacyContext(input, inferredSource)
    ? ["INTERNAL_ONLY"]
    : normalizeCaptureUsageContexts(input.usageContexts);
  const dataCategories = normalizeDataCategories(
    input.dataCategories,
    input.dataCategory
  );
  const toolFields = normalizeToolFields(input);
  const workflow = normalizeUseCaseWorkflow(input.workflow);
  const systemPublicInfo = normalizeSystemPublicInfo(input.systemPublicInfo);
  const externalIntake = normalizeExternalIntakeTrace(
    input.externalIntake,
    inferredSource
  );
  const origin = deriveUseCaseOrigin(input);
  const supplierEmail =
    origin.submittedByEmail ??
    (looksLikeEmail(responsibility.responsibleParty ?? null)
      ? responsibility.responsibleParty ?? null
      : null);

  return {
    ...input,
    cardVersion: normalizeCardVersion(input.cardVersion),
    formatVersion:
      normalizeOptionalText(input.formatVersion) ?? "v1.1",
    status: normalizeRegisterUseCaseStatus(
      input.status,
      inferStatusFallback(input)
    ),
    usageContexts,
    responsibility,
    decisionImpact: normalizeDecisionImpactValue(
      input.decisionImpact,
      input.decisionInfluence,
      inferredSource
    ),
    decisionInfluence: normalizeDecisionInfluenceValue(input.decisionInfluence),
    affectedParties: Array.isArray(input.affectedParties)
      ? input.affectedParties
      : [],
    reviewHints: Array.isArray(input.reviewHints) ? input.reviewHints : [],
    evidences: Array.isArray(input.evidences) ? input.evidences : [],
    reviews: Array.isArray(input.reviews) ? input.reviews : [],
    proof: input.proof ?? null,
    toolId: toolFields.toolId ?? undefined,
    toolFreeText: toolFields.toolFreeText ?? undefined,
    workflow,
    systemPublicInfo,
    dataCategory: dataCategories[0] ?? undefined,
    dataCategories: dataCategories.length > 0 ? dataCategories : undefined,
    origin,
    labels:
      inferredSource === "supplier_request"
        ? mergeLabels(input.labels, [
            { key: SOURCE_LABEL_KEY, value: SOURCE_LABEL_SUPPLIER_REQUEST },
            { key: SUPPLIER_EMAIL_LABEL_KEY, value: supplierEmail },
          ])
        : input.labels,
    externalIntake,
  };
}

/**
 * Migrates a legacy UseCaseCard into the canonical v1.1 shape in-memory.
 * Does NOT persist – caller must save explicitly via repository/service.
 */
export function migrateCardToV1_1(
  card: UseCaseCard,
  now: Date = new Date()
): UseCaseCard {
  const normalized = normalizeUseCaseCardRecord(card) as UseCaseCard;
  const dataCategories = normalizeDataCategories(
    normalized.dataCategories,
    normalized.dataCategory
  );

  return {
    ...normalized,
    cardVersion: CANONICAL_CARD_VERSION,
    globalUseCaseId: normalized.globalUseCaseId ?? generateGlobalUseCaseId(now),
    formatVersion: normalized.formatVersion ?? "v1.1",
    dataCategory: dataCategories[0] ?? "INTERNAL_CONFIDENTIAL",
    dataCategories:
      dataCategories.length > 0 ? dataCategories : ["INTERNAL_CONFIDENTIAL"],
    publicHashId: normalized.publicHashId ?? generatePublicHashId(),
    isPublicVisible: normalized.isPublicVisible ?? false,
    standardVersion: normalized.standardVersion ?? "EUKI-UC-1.2",
    origin:
      normalized.origin ??
      createUseCaseOrigin({ source: inferLegacyOriginSource(normalized) }),
  };
}

export function needsMigrationToV1_1(card: Pick<
  UseCaseCard,
  | "cardVersion"
  | "globalUseCaseId"
  | "publicHashId"
  | "formatVersion"
  | "dataCategory"
  | "origin"
>): boolean {
  return (
    card.cardVersion !== CANONICAL_CARD_VERSION ||
    !card.globalUseCaseId ||
    !card.publicHashId ||
    !card.formatVersion ||
    !card.dataCategory ||
    !card.origin
  );
}

export function ensureV1_1Shape(card: UseCaseCard): UseCaseCard {
  if (!needsMigrationToV1_1(card)) {
    return card;
  }

  return migrateCardToV1_1(card);
}
