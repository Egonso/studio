import { registerUseCaseStatusLabels } from "./status-flow";
import {
  getUseCaseSource,
  getUseCaseSourceBadges,
  getUseCaseSubmitterIdentity,
  type UseCaseBadgeKey,
} from "./source";
import type {
  ExternalSubmission,
  ManualEditEvent,
  StatusChange,
  UseCaseCard,
} from "./types";

export type RegisterTimelineEventKind =
  | "created"
  | "origin"
  | "manual_edit"
  | "status_change"
  | "review"
  | "proof"
  | "seal"
  | "external_submission";

export interface RegisterTimelineEvent {
  id: string;
  kind: RegisterTimelineEventKind;
  timestamp: string;
  title: string;
  description?: string | null;
  actor?: string | null;
  badges: UseCaseBadgeKey[];
  tone: "default" | "success" | "warning" | "danger";
}

const IGNORED_CHANGE_PATHS = new Set([
  "cardVersion",
  "formatVersion",
  "globalUseCaseId",
  "publicHashId",
  "updatedAt",
  "manualEdits",
  "reviews",
  "statusHistory",
  "proof",
  "sealedAt",
  "sealedBy",
  "sealedByName",
  "sealHash",
  "governanceAssessment.flex.iso.lastReviewedAt",
  "governanceAssessment.flex.iso.nextReviewAt",
]);

const FIELD_LABELS: Record<string, string> = {
  purpose: "Zweck",
  usageContexts: "Wirkungsbereich",
  "responsibility.responsibleParty": "Owner-Rolle",
  "responsibility.contactPersonName": "Kontaktperson",
  organisation: "Organisation",
  toolId: "Tool",
  toolFreeText: "Tool-Name",
  dataCategory: "Datenkategorie",
  dataCategories: "Datenkategorien",
  decisionImpact: "Entscheidungsrelevanz",
  decisionInfluence: "Entscheidungseinfluss",
  governanceAssessment: "Governance-Einstellungen",
  "governanceAssessment.core.aiActCategory": "KI-Risikoklasse",
  "governanceAssessment.flex.iso.reviewCycle": "Review-Zyklus",
  "governanceAssessment.flex.iso.oversightModel": "Aufsichtsmodell",
  "governanceAssessment.flex.iso.documentationLevel": "Dokumentationsniveau",
  "governanceAssessment.flex.iso.lifecycleStatus": "Lifecycle-Status",
  isPublicVisible: "Sichtbarkeit",
  publicInfo: "Tool-Recherche",
};

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function looksLikeOpaqueActorId(value: string): boolean {
  return (
    /^[A-Za-z0-9_-]{20,}$/.test(value) ||
    /^user[_-]/i.test(value) ||
    /^anon/i.test(value)
  );
}

function formatTimelineActor(
  value: string | null | undefined,
  fallback: string | null
): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return fallback;
  }

  const uppercased = normalized.toUpperCase();
  if (
    uppercased === "SUPPLIER_REQUEST" ||
    uppercased === "SUPPLIER_REQUEST_LINK"
  ) {
    return "Lieferanteneinreichung";
  }

  if (uppercased === "ACCESS_CODE" || uppercased === "ACCESS_CODE_CAPTURE") {
    return "Erfassung über Zugangscode";
  }

  if (uppercased === "IMPORT" || uppercased === "IMPORTED") {
    return "Import";
  }

  if (uppercased === "ANONYMOUS") {
    return "Öffentliche Einreichung";
  }

  if (uppercased === "HUMAN") {
    return "Internes Team";
  }

  if (uppercased === "AUTOMATION" || uppercased === "SYSTEM") {
    return "System";
  }

  if (looksLikeOpaqueActorId(normalized)) {
    return fallback;
  }

  return normalized;
}

function compareJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldIgnorePath(path: string): boolean {
  if (IGNORED_CHANGE_PATHS.has(path)) {
    return true;
  }

  return Array.from(IGNORED_CHANGE_PATHS).some((ignored) =>
    path.startsWith(`${ignored}.`)
  );
}

function collectChangedPaths(
  before: unknown,
  after: unknown,
  path = ""
): string[] {
  if (!path) {
    if (!isRecord(before) || !isRecord(after)) {
      return [];
    }

    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Array.from(keys).flatMap((key) =>
      collectChangedPaths(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        key
      )
    );
  }

  if (shouldIgnorePath(path)) {
    return [];
  }

  if (compareJson(before, after)) {
    return [];
  }

  if (Array.isArray(before) || Array.isArray(after)) {
    return [path];
  }

  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Array.from(keys).flatMap((key) =>
      collectChangedPaths(before[key], after[key], `${path}.${key}`)
    );
  }

  return [path];
}

function dedupeChangedFields(paths: string[]): string[] {
  return Array.from(new Set(paths)).slice(0, 12);
}

function summarizeManualEdit(changedFields: string[]): string {
  if (changedFields.some((field) => field.startsWith("governanceAssessment"))) {
    return "Governance-Angaben aktualisiert";
  }

  if (changedFields.includes("isPublicVisible")) {
    return "Sichtbarkeit aktualisiert";
  }

  if (
    changedFields.some((field) =>
      [
        "purpose",
        "usageContexts",
        "toolId",
        "toolFreeText",
        "dataCategory",
        "dataCategories",
        "decisionImpact",
        "decisionInfluence",
        "responsibility.responsibleParty",
        "responsibility.contactPersonName",
        "organisation",
      ].includes(field)
    )
  ) {
    return "Stammdaten aktualisiert";
  }

  return "Use Case aktualisiert";
}

export function formatChangedFieldLabel(path: string): string {
  return FIELD_LABELS[path] ?? path;
}

function formatChangedFieldLabels(paths: string[]): string[] {
  const labels = paths.map(formatChangedFieldLabel);
  return Array.from(new Set(labels));
}

export function createManualEditEvent(input: {
  before: UseCaseCard;
  after: UseCaseCard;
  editedAt: string;
  editedBy: string;
  editedByName?: string | null;
  summary?: string;
}): ManualEditEvent | null {
  const changedFields = dedupeChangedFields(
    collectChangedPaths(input.before, input.after)
  );

  if (changedFields.length === 0) {
    return null;
  }

  return {
    editId: `edit_${input.editedAt}_${changedFields.join("_").slice(0, 32)}`,
    editedAt: input.editedAt,
    editedBy: input.editedBy,
    editedByName: normalizeOptionalText(input.editedByName),
    summary: input.summary ?? summarizeManualEdit(changedFields),
    changedFields,
  };
}

function buildStatusChangeEvent(
  change: StatusChange,
  reviewKeys: Set<string>,
  badges: UseCaseBadgeKey[]
): RegisterTimelineEvent | null {
  const key = `${change.changedAt}:${change.changedBy}:${change.to}`;
  if (reviewKeys.has(key)) {
    return null;
  }

  return {
    id: `status_${change.changedAt}_${change.to}`,
    kind: "status_change",
    timestamp: change.changedAt,
    title: `Status geändert: ${registerUseCaseStatusLabels[change.from]} → ${registerUseCaseStatusLabels[change.to]}`,
    description: normalizeOptionalText(change.reason),
    actor: formatTimelineActor(
      normalizeOptionalText(change.changedByName) ??
        normalizeOptionalText(change.changedBy),
      "Internes Team"
    ),
    badges,
    tone: change.to === "PROOF_READY" ? "success" : "default",
  };
}

function buildOriginEvent(card: UseCaseCard, badges: UseCaseBadgeKey[]): RegisterTimelineEvent {
  const source = getUseCaseSource(card);
  const submitter = getUseCaseSubmitterIdentity(card);
  const requestId =
    normalizeOptionalText(card.origin?.sourceRequestId) ??
    normalizeOptionalText(card.externalIntake?.submissionId) ??
    normalizeOptionalText(card.externalIntake?.requestTokenId) ??
    normalizeOptionalText(card.externalIntake?.accessCodeId);
  const timestamp = card.externalIntake?.submittedAt ?? card.createdAt;

  const title =
    source === "supplier_request"
      ? "Lieferanteneinreichung erhalten"
      : source === "access_code"
        ? "Über Zugangscode erfasst"
        : source === "import"
          ? "Import übernommen"
          : "Manuell erfasst";

  const descriptionParts = [
    submitter ? `Von ${submitter}` : null,
    requestId ? `Referenz ${requestId}` : null,
  ].filter(Boolean);
  const tone: RegisterTimelineEvent["tone"] =
    source === "manual" ? "default" : "warning";
  const actorFallback =
    source === "supplier_request"
      ? "Lieferanteneinreichung"
      : source === "access_code"
        ? "Erfassung über Zugangscode"
        : source === "import"
          ? "Import"
          : "Internes Team";

  return {
    id: `origin_${card.useCaseId}`,
    kind: "origin",
    timestamp,
    title,
    description: descriptionParts.join(" · ") || null,
    actor: formatTimelineActor(submitter, actorFallback),
    badges,
    tone,
  };
}

function buildExternalSubmissionDecisionEvent(
  submission: ExternalSubmission,
  badges: UseCaseBadgeKey[]
): RegisterTimelineEvent | null {
  if (!submission.reviewedAt || submission.status === "submitted") {
    return null;
  }

  const title =
    submission.status === "approved"
      ? "Externe Einreichung freigegeben"
      : submission.status === "rejected"
        ? "Externe Einreichung abgelehnt"
        : "Externe Einreichung übernommen";

  const details = [
    normalizeOptionalText(submission.reviewNote),
    normalizeOptionalText(submission.linkedUseCaseId)
      ? `Use Case ${submission.linkedUseCaseId}`
      : null,
  ].filter(Boolean);
  const tone: RegisterTimelineEvent["tone"] =
    submission.status === "rejected"
      ? "danger"
      : submission.status === "merged"
        ? "success"
        : "default";

  return {
    id: `submission_${submission.submissionId}_${submission.status}`,
    kind: "external_submission",
    timestamp: submission.reviewedAt,
    title,
    description: details.join(" · ") || null,
    actor: formatTimelineActor(
      normalizeOptionalText(submission.reviewedBy),
      "Internes Team"
    ),
    badges,
    tone,
  };
}

export function buildUseCaseTimeline(input: {
  card: UseCaseCard;
  submission?: ExternalSubmission | null;
}): RegisterTimelineEvent[] {
  const badges = getUseCaseSourceBadges(input.card).map((badge) => badge.key);
  const reviewKeys = new Set(
    input.card.reviews.map(
      (review) => `${review.reviewedAt}:${review.reviewedBy}:${review.nextStatus}`
    )
  );

  const events: Array<RegisterTimelineEvent | null> = [
    {
      id: `created_${input.card.useCaseId}`,
      kind: "created",
      timestamp: input.card.createdAt,
      title: "Use Case erstellt",
      description: normalizeOptionalText(input.card.globalUseCaseId)
        ? `ID ${input.card.globalUseCaseId}`
        : null,
      actor: formatTimelineActor(
        normalizeOptionalText(input.card.origin?.capturedByUserId) ??
          normalizeOptionalText(input.card.capturedBy),
        getUseCaseSource(input.card) === "supplier_request"
          ? "Lieferanteneinreichung"
          : getUseCaseSource(input.card) === "access_code"
            ? "Erfassung über Zugangscode"
            : getUseCaseSource(input.card) === "import"
              ? "Import"
              : "Internes Team"
      ),
      badges,
      tone: "default",
    },
    buildOriginEvent(input.card, badges),
    ...(input.card.manualEdits ?? []).map((edit) => ({
      id: `edit_${edit.editId}`,
      kind: "manual_edit" as const,
      timestamp: edit.editedAt,
      title: edit.summary,
      description:
        edit.changedFields.length > 0
          ? formatChangedFieldLabels(edit.changedFields).join(", ")
          : null,
      actor: formatTimelineActor(
        normalizeOptionalText(edit.editedByName) ??
          normalizeOptionalText(edit.editedBy),
        "Internes Team"
      ),
      badges,
      tone: "default" as const,
    })),
    ...(input.card.statusHistory ?? []).map((change) =>
      buildStatusChangeEvent(change, reviewKeys, badges)
    ),
    ...input.card.reviews.map((review): RegisterTimelineEvent => {
      const tone: RegisterTimelineEvent["tone"] =
        review.nextStatus === "PROOF_READY"
          ? "success"
          : review.nextStatus === "REVIEW_RECOMMENDED"
            ? "warning"
            : "default";

      return {
        id: `review_${review.reviewId}`,
        kind: "review",
        timestamp: review.reviewedAt,
        title: `Review dokumentiert: ${registerUseCaseStatusLabels[review.nextStatus]}`,
        description: normalizeOptionalText(review.notes),
        actor: formatTimelineActor(
          normalizeOptionalText(review.reviewedBy),
          "Internes Team"
        ),
        badges,
        tone,
      };
    }),
    input.card.proof
      ? {
          id: `proof_${input.card.useCaseId}`,
          kind: "proof" as const,
          timestamp: input.card.proof.generatedAt,
          title: "Verify- und Proof-Daten aktualisiert",
          description: normalizeOptionalText(input.card.proof.verification.scope),
          actor: null,
          badges,
          tone: "success" as const,
        }
      : null,
    input.card.sealedAt
      ? {
          id: `seal_${input.card.useCaseId}`,
          kind: "seal" as const,
          timestamp: input.card.sealedAt,
          title: "Use Case gezeichnet und versiegelt",
          description: normalizeOptionalText(input.card.sealHash),
          actor: formatTimelineActor(
            normalizeOptionalText(input.card.sealedByName) ??
              normalizeOptionalText(input.card.sealedBy),
            "EUKI Officer"
          ),
          badges,
          tone: "success" as const,
        }
      : null,
    input.submission
      ? buildExternalSubmissionDecisionEvent(input.submission, badges)
      : null,
  ];

  const kindRank: Record<RegisterTimelineEventKind, number> = {
    external_submission: 0,
    seal: 1,
    proof: 2,
    review: 3,
    status_change: 4,
    manual_edit: 5,
    origin: 6,
    created: 7,
  };

  return events
    .filter((event): event is RegisterTimelineEvent => event !== null)
    .sort((a, b) => {
      const timeDiff =
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }

      return kindRank[a.kind] - kindRank[b.kind];
    });
}
