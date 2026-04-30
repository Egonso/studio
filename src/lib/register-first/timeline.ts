import { getRegisterUseCaseStatusLabel } from "./status-flow";
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
  toolId: "System",
  toolFreeText: "System-Name",
  workflow: "Ablauf & Systeme",
  "workflow.additionalSystems": "Ablauf & Systeme",
  "workflow.connectionMode": "Ablaufart",
  "workflow.summary": "Ablaufbeschreibung",
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
  systemPublicInfo: "System-Compliance",
};

const FIELD_LABELS_EN: Record<string, string> = {
  purpose: "Purpose",
  usageContexts: "Scope",
  "responsibility.responsibleParty": "Owner role",
  "responsibility.contactPersonName": "Contact person",
  organisation: "Organisation",
  toolId: "System",
  toolFreeText: "System name",
  workflow: "Workflow & systems",
  "workflow.additionalSystems": "Workflow & systems",
  "workflow.connectionMode": "Workflow type",
  "workflow.summary": "Workflow description",
  dataCategory: "Data category",
  dataCategories: "Data categories",
  decisionImpact: "Decision relevance",
  decisionInfluence: "Decision influence",
  governanceAssessment: "Governance settings",
  "governanceAssessment.core.aiActCategory": "AI risk class",
  "governanceAssessment.flex.iso.reviewCycle": "Review cycle",
  "governanceAssessment.flex.iso.oversightModel": "Oversight model",
  "governanceAssessment.flex.iso.documentationLevel": "Documentation level",
  "governanceAssessment.flex.iso.lifecycleStatus": "Lifecycle status",
  isPublicVisible: "Visibility",
  publicInfo: "Tool research",
  systemPublicInfo: "System compliance",
};

function isEnglishLocale(locale: string | null | undefined): boolean {
  return locale?.toLowerCase().startsWith("en") ?? false;
}

function getTimelineCopy(locale?: string) {
  if (isEnglishLocale(locale)) {
    return {
      supplierSubmission: "Supplier submission",
      accessCodeCapture: "Capture via access code",
      import: "Import",
      publicSubmission: "Public submission",
      internalTeam: "Internal team",
      useCaseUpdated: "Use case updated",
      governanceUpdated: "Governance information updated",
      visibilityUpdated: "Visibility updated",
      complianceUpdated: "Compliance information updated",
      masterDataUpdated: "Master data updated",
      statusChanged: "Status changed",
      manualCaptured: "Manually captured",
      supplierReceived: "Supplier submission received",
      accessCodeCaptured: "Captured via access code",
      importAdopted: "Import adopted",
      from: "From",
      reference: "Reference",
      externalApproved: "External submission approved",
      externalRejected: "External submission rejected",
      externalMerged: "External submission adopted",
      useCaseCreated: "Use case created",
      reviewDocumented: "Review documented",
      proofUpdated: "Verification and proof data updated",
      useCaseSealed: "Use case signed and sealed",
    };
  }

  return {
    supplierSubmission: "Lieferanteneinreichung",
    accessCodeCapture: "Erfassung über Zugangscode",
    import: "Import",
    publicSubmission: "Öffentliche Einreichung",
    internalTeam: "Internes Team",
    useCaseUpdated: "Use Case aktualisiert",
    governanceUpdated: "Governance-Angaben aktualisiert",
    visibilityUpdated: "Sichtbarkeit aktualisiert",
    complianceUpdated: "Compliance-Informationen aktualisiert",
    masterDataUpdated: "Stammdaten aktualisiert",
    statusChanged: "Status geändert",
    manualCaptured: "Manuell erfasst",
    supplierReceived: "Lieferanteneinreichung erhalten",
    accessCodeCaptured: "Über Zugangscode erfasst",
    importAdopted: "Import übernommen",
    from: "Von",
    reference: "Referenz",
    externalApproved: "Externe Einreichung freigegeben",
    externalRejected: "Externe Einreichung abgelehnt",
    externalMerged: "Externe Einreichung übernommen",
    useCaseCreated: "Use Case erstellt",
    reviewDocumented: "Review dokumentiert",
    proofUpdated: "Verify- und Proof-Daten aktualisiert",
    useCaseSealed: "Use Case gezeichnet und versiegelt",
  };
}

type TimelineCopy = ReturnType<typeof getTimelineCopy>;

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
  fallback: string | null,
  copy: TimelineCopy = getTimelineCopy(),
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
    return copy.supplierSubmission;
  }

  if (uppercased === "ACCESS_CODE" || uppercased === "ACCESS_CODE_CAPTURE") {
    return copy.accessCodeCapture;
  }

  if (uppercased === "IMPORT" || uppercased === "IMPORTED") {
    return "Import";
  }

  if (uppercased === "ANONYMOUS") {
    return copy.publicSubmission;
  }

  if (uppercased === "HUMAN") {
    return copy.internalTeam;
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
    changedFields.includes("publicInfo") ||
    changedFields.includes("systemPublicInfo")
  ) {
    return "Compliance-Informationen aktualisiert";
  }

  if (
    changedFields.some((field) =>
      [
        "purpose",
        "usageContexts",
        "toolId",
        "toolFreeText",
        "workflow",
        "workflow.additionalSystems",
        "workflow.connectionMode",
        "workflow.summary",
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

export function formatChangedFieldLabel(path: string, locale?: string): string {
  return (isEnglishLocale(locale) ? FIELD_LABELS_EN : FIELD_LABELS)[path] ?? path;
}

function formatChangedFieldLabels(paths: string[], locale?: string): string[] {
  const labels = paths.map((path) => formatChangedFieldLabel(path, locale));
  return Array.from(new Set(labels));
}

function localizeManualEditSummary(summary: string, copy: TimelineCopy): string {
  switch (summary) {
    case "Governance-Angaben aktualisiert":
      return copy.governanceUpdated;
    case "Sichtbarkeit aktualisiert":
      return copy.visibilityUpdated;
    case "Compliance-Informationen aktualisiert":
      return copy.complianceUpdated;
    case "Stammdaten aktualisiert":
      return copy.masterDataUpdated;
    case "Use Case aktualisiert":
      return copy.useCaseUpdated;
    default:
      return summary;
  }
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
  badges: UseCaseBadgeKey[],
  locale: string | undefined,
  copy: TimelineCopy,
): RegisterTimelineEvent | null {
  const key = `${change.changedAt}:${change.changedBy}:${change.to}`;
  if (reviewKeys.has(key)) {
    return null;
  }

  return {
    id: `status_${change.changedAt}_${change.to}`,
    kind: "status_change",
    timestamp: change.changedAt,
    title: `${copy.statusChanged}: ${getRegisterUseCaseStatusLabel(
      change.from,
      locale,
    )} → ${getRegisterUseCaseStatusLabel(change.to, locale)}`,
    description: normalizeOptionalText(change.reason),
    actor: formatTimelineActor(
      normalizeOptionalText(change.changedByName) ??
        normalizeOptionalText(change.changedBy),
      copy.internalTeam,
      copy,
    ),
    badges,
    tone: change.to === "PROOF_READY" ? "success" : "default",
  };
}

function buildOriginEvent(
  card: UseCaseCard,
  badges: UseCaseBadgeKey[],
  copy: TimelineCopy,
): RegisterTimelineEvent {
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
      ? copy.supplierReceived
      : source === "access_code"
        ? copy.accessCodeCaptured
        : source === "import"
          ? copy.importAdopted
          : copy.manualCaptured;

  const tone: RegisterTimelineEvent["tone"] =
    source === "manual" ? "default" : "warning";
  const actorFallback =
    source === "supplier_request"
      ? copy.supplierSubmission
      : source === "access_code"
        ? copy.accessCodeCapture
        : source === "import"
        ? copy.import
          : copy.internalTeam;
  const actor = formatTimelineActor(submitter, actorFallback, copy);
  const descriptionParts = [
    actor && (source !== "manual" || actor !== copy.internalTeam)
      ? `${copy.from} ${actor}`
      : null,
    requestId ? `${copy.reference} ${requestId}` : null,
  ].filter(Boolean);

  return {
    id: `origin_${card.useCaseId}`,
    kind: "origin",
    timestamp,
    title,
    description: descriptionParts.join(" · ") || null,
    actor,
    badges,
    tone,
  };
}

function buildExternalSubmissionDecisionEvent(
  submission: ExternalSubmission,
  badges: UseCaseBadgeKey[],
  copy: TimelineCopy,
): RegisterTimelineEvent | null {
  if (!submission.reviewedAt || submission.status === "submitted") {
    return null;
  }

  const title =
    submission.status === "approved"
      ? copy.externalApproved
      : submission.status === "rejected"
        ? copy.externalRejected
        : copy.externalMerged;

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
      copy.internalTeam,
      copy,
    ),
    badges,
    tone,
  };
}

export function buildUseCaseTimeline(input: {
  card: UseCaseCard;
  submission?: ExternalSubmission | null;
  locale?: string;
}): RegisterTimelineEvent[] {
  const copy = getTimelineCopy(input.locale);
  const badges = getUseCaseSourceBadges(input.card, input.locale).map(
    (badge) => badge.key,
  );
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
      title: copy.useCaseCreated,
      description: normalizeOptionalText(input.card.globalUseCaseId)
        ? `ID ${input.card.globalUseCaseId}`
        : null,
      actor: formatTimelineActor(
        normalizeOptionalText(input.card.origin?.capturedByUserId) ??
          normalizeOptionalText(input.card.capturedBy),
        getUseCaseSource(input.card) === "supplier_request"
          ? copy.supplierSubmission
          : getUseCaseSource(input.card) === "access_code"
            ? copy.accessCodeCapture
            : getUseCaseSource(input.card) === "import"
              ? copy.import
              : copy.internalTeam,
        copy,
      ),
      badges,
      tone: "default",
    },
    buildOriginEvent(input.card, badges, copy),
    ...(input.card.manualEdits ?? []).map((edit) => ({
      id: `edit_${edit.editId}`,
      kind: "manual_edit" as const,
      timestamp: edit.editedAt,
      title: localizeManualEditSummary(edit.summary, copy),
      description:
        edit.changedFields.length > 0
          ? formatChangedFieldLabels(edit.changedFields, input.locale).join(", ")
          : null,
      actor: formatTimelineActor(
        normalizeOptionalText(edit.editedByName) ??
          normalizeOptionalText(edit.editedBy),
        copy.internalTeam,
        copy,
      ),
      badges,
      tone: "default" as const,
    })),
    ...(input.card.statusHistory ?? []).map((change) =>
      buildStatusChangeEvent(change, reviewKeys, badges, input.locale, copy)
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
        title: `${copy.reviewDocumented}: ${getRegisterUseCaseStatusLabel(
          review.nextStatus,
          input.locale,
        )}`,
        description: normalizeOptionalText(review.notes),
        actor: formatTimelineActor(
          normalizeOptionalText(review.reviewedBy),
          copy.internalTeam,
          copy,
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
          title: copy.proofUpdated,
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
          title: copy.useCaseSealed,
          description: normalizeOptionalText(input.card.sealHash),
          actor: formatTimelineActor(
            normalizeOptionalText(input.card.sealedByName) ??
              normalizeOptionalText(input.card.sealedBy),
            "EUKI Officer",
            copy,
          ),
          badges,
          tone: "success" as const,
        }
      : null,
    input.submission
      ? buildExternalSubmissionDecisionEvent(input.submission, badges, copy)
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
