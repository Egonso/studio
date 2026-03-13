import type { UseCaseCard, UseCaseOriginSource } from "./types";

export type UseCaseBadgeKey =
  | "EXTERN"
  | "LIEFERANT"
  | "ZUGANGSCODE"
  | "MANUELL"
  | "REVIEW_NOETIG";

export type UseCaseSourceFilter = "ALL" | UseCaseBadgeKey;

export interface UseCaseBadgeSpec {
  key: UseCaseBadgeKey;
  label: string;
  className: string;
}

export const USE_CASE_SOURCE_LABELS: Record<UseCaseOriginSource, string> =
  Object.freeze({
    manual: "Manuell",
    supplier_request: "Lieferant",
    access_code: "Zugangscode",
    import: "Import",
  });

const SOURCE_LABEL_KEY = "source";
const SOURCE_LABEL_SUPPLIER_REQUEST = "supplier_request";
const SUPPLIER_EMAIL_LABEL_KEY = "supplier_email";

export const USE_CASE_BADGE_META: Record<UseCaseBadgeKey, UseCaseBadgeSpec> =
  Object.freeze({
    EXTERN: {
      key: "EXTERN",
      label: "Extern",
      className:
        "border-slate-300 bg-white text-slate-700 hover:bg-white",
    },
    LIEFERANT: {
      key: "LIEFERANT",
      label: "Lieferant",
      className:
        "border-slate-300 bg-white text-slate-700 hover:bg-white",
    },
    ZUGANGSCODE: {
      key: "ZUGANGSCODE",
      label: "Zugangscode",
      className:
        "border-slate-300 bg-white text-slate-700 hover:bg-white",
    },
    MANUELL: {
      key: "MANUELL",
      label: "Manuell",
      className:
        "border-slate-300 bg-white text-slate-700 hover:bg-white",
    },
    REVIEW_NOETIG: {
      key: "REVIEW_NOETIG",
      label: "Review nötig",
      className:
        "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50",
    },
  });

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function looksLikeOpaqueIdentity(value: string): boolean {
  return (
    /^[A-Za-z0-9_-]{20,}$/.test(value) ||
    /^user[_-]/i.test(value) ||
    /^anon/i.test(value)
  );
}

function normalizeReadableIdentity(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  return looksLikeOpaqueIdentity(normalized) ? null : normalized;
}

function formatIdentity(
  name: string | null,
  email: string | null,
  fallback?: string | null
): string | null {
  if (name && email && name.toLowerCase() !== email.toLowerCase()) {
    return `${name} <${email}>`;
  }

  return name ?? email ?? normalizeOptionalText(fallback);
}

function getLabelValue(card: Pick<UseCaseCard, "labels">, key: string): string | null {
  return (
    card.labels?.find(
      (label) => normalizeOptionalText(label.key)?.toLowerCase() === key.toLowerCase()
    )?.value ?? null
  );
}

export function getUseCaseSource(card: Pick<
  UseCaseCard,
  "origin" | "externalIntake" | "capturedViaCode" | "capturedBy" | "labels"
>): UseCaseOriginSource {
  if (card.origin?.source) {
    return card.origin.source;
  }

  if (card.externalIntake?.sourceType === "supplier_request") {
    return "supplier_request";
  }

  if (card.externalIntake?.sourceType === "access_code") {
    return "access_code";
  }

  if (card.externalIntake?.sourceType === "manual_import") {
    return "import";
  }

  if (
    getLabelValue(card, SOURCE_LABEL_KEY) === SOURCE_LABEL_SUPPLIER_REQUEST ||
    card.capturedBy === "SUPPLIER_REQUEST"
  ) {
    return "supplier_request";
  }

  if (card.capturedViaCode) {
    return "access_code";
  }

  return "manual";
}

export function isExternalUseCase(
  card: Pick<
    UseCaseCard,
    "origin" | "externalIntake" | "capturedViaCode" | "capturedBy" | "labels"
  >
): boolean {
  return getUseCaseSource(card) !== "manual";
}

export function getUseCaseSourceLabel(source: UseCaseOriginSource): string {
  return USE_CASE_SOURCE_LABELS[source];
}

export function getUseCaseSubmitterIdentity(
  card: Pick<
    UseCaseCard,
    | "origin"
    | "externalIntake"
    | "responsibility"
    | "capturedByName"
    | "capturedBy"
    | "labels"
  >
): string | null {
  const source = getUseCaseSource(card);

  const submittedByName =
    normalizeOptionalText(card.origin?.submittedByName) ??
    normalizeOptionalText(card.externalIntake?.submittedByName) ??
    normalizeOptionalText(card.capturedByName);
  const submittedByEmail =
    normalizeOptionalText(card.origin?.submittedByEmail) ??
    normalizeOptionalText(card.externalIntake?.submittedByEmail) ??
    normalizeOptionalText(getLabelValue(card, SUPPLIER_EMAIL_LABEL_KEY));

  if (source === "manual") {
    return (
      normalizeOptionalText(card.capturedByName) ??
      normalizeReadableIdentity(card.origin?.capturedByUserId)
    );
  }

  return formatIdentity(
    submittedByName,
    submittedByEmail,
    normalizeOptionalText(card.responsibility.responsibleParty)
  );
}

export function getUseCaseSourceBadges(
  card: Pick<
    UseCaseCard,
    | "status"
    | "origin"
    | "externalIntake"
    | "capturedViaCode"
    | "capturedBy"
    | "labels"
  >
): UseCaseBadgeSpec[] {
  const source = getUseCaseSource(card);
  const badges: UseCaseBadgeSpec[] = [];

  if (source === "manual") {
    badges.push(USE_CASE_BADGE_META.MANUELL);
  } else {
    badges.push(USE_CASE_BADGE_META.EXTERN);
  }

  if (source === "supplier_request") {
    badges.push(USE_CASE_BADGE_META.LIEFERANT);
  }

  if (source === "access_code") {
    badges.push(USE_CASE_BADGE_META.ZUGANGSCODE);
  }

  if (card.status === "REVIEW_RECOMMENDED") {
    badges.push(USE_CASE_BADGE_META.REVIEW_NOETIG);
  }

  return badges;
}

export function matchesUseCaseSourceFilter(
  card: Pick<
    UseCaseCard,
    | "status"
    | "origin"
    | "externalIntake"
    | "capturedViaCode"
    | "capturedBy"
    | "labels"
  >,
  filter: UseCaseSourceFilter
): boolean {
  if (filter === "ALL") {
    return true;
  }

  return getUseCaseSourceBadges(card).some((badge) => badge.key === filter);
}

export function getUseCaseSourceFilterLabel(filter: UseCaseSourceFilter): string {
  if (filter === "ALL") {
    return "Alle Quellen";
  }

  return USE_CASE_BADGE_META[filter].label;
}
