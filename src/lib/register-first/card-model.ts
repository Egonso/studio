export const REGISTER_USE_CASE_STATUS_VALUES = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
] as const;

export type RegisterUseCaseStatus =
  (typeof REGISTER_USE_CASE_STATUS_VALUES)[number];

export const registerUseCaseStatusOrder: RegisterUseCaseStatus[] = [
  ...REGISTER_USE_CASE_STATUS_VALUES,
];

export const registerUseCaseStatusLabels: Record<
  RegisterUseCaseStatus,
  string
> = Object.freeze({
  UNREVIEWED: "Formale Prüfung ausstehend",
  REVIEW_RECOMMENDED: "Prüfung empfohlen",
  REVIEWED: "Prüfung abgeschlossen",
  PROOF_READY: "Nachweisfähig",
});

export const registerUseCaseStatusTransitions: Record<
  RegisterUseCaseStatus,
  RegisterUseCaseStatus[]
> = Object.freeze({
  UNREVIEWED: ["REVIEW_RECOMMENDED", "REVIEWED"],
  REVIEW_RECOMMENDED: ["REVIEWED"],
  REVIEWED: ["REVIEW_RECOMMENDED", "PROOF_READY"],
  PROOF_READY: ["REVIEWED"],
});

const REGISTER_USE_CASE_STATUS_ALIAS_MAP: Record<string, RegisterUseCaseStatus> =
  Object.freeze({
    unreviewed: "UNREVIEWED",
    draft: "UNREVIEWED",
    new: "UNREVIEWED",
    created: "UNREVIEWED",
    pending_review: "UNREVIEWED",
    review_recommended: "REVIEW_RECOMMENDED",
    reviewrecommended: "REVIEW_RECOMMENDED",
    review_required: "REVIEW_RECOMMENDED",
    reviewrequired: "REVIEW_RECOMMENDED",
    needs_review: "REVIEW_RECOMMENDED",
    needsreview: "REVIEW_RECOMMENDED",
    reviewed: "REVIEWED",
    complete: "REVIEWED",
    completed: "REVIEWED",
    approved: "REVIEWED",
    proof_ready: "PROOF_READY",
    proofready: "PROOF_READY",
    ready_for_proof: "PROOF_READY",
    readyforproof: "PROOF_READY",
  });

export const CARD_VERSION_VALUES = ["1.0", "1.1"] as const;
export type CardVersion = (typeof CARD_VERSION_VALUES)[number];
export const CANONICAL_CARD_VERSION = "1.1" as const;

const CARD_VERSION_ALIAS_MAP: Record<string, CardVersion> = Object.freeze({
  "1.0": "1.1",
  "1.1": "1.1",
  "1.2": "1.1",
  "v1.0": "1.1",
  "v1.1": "1.1",
  "v1.2": "1.1",
});

export const CAPTURE_USAGE_CONTEXT_VALUES = [
  "INTERNAL_ONLY",
  "CUSTOMER_FACING",
  "EMPLOYEE_FACING",
  "EXTERNAL_PUBLIC",
  "EMPLOYEES",
  "CUSTOMERS",
  "APPLICANTS",
  "PUBLIC",
] as const;

export type CaptureUsageContext =
  (typeof CAPTURE_USAGE_CONTEXT_VALUES)[number];

export const USAGE_CONTEXT_LABELS: Record<CaptureUsageContext, string> =
  Object.freeze({
    INTERNAL_ONLY: "Nur interne Prozesse",
    EMPLOYEES: "Mitarbeitende betroffen",
    CUSTOMERS: "Kund*innen betroffen",
    APPLICANTS: "Bewerber*innen betroffen",
    PUBLIC: "Öffentlichkeit betroffen",
    CUSTOMER_FACING: "Kund*innen betroffen",
    EMPLOYEE_FACING: "Mitarbeitende betroffen",
    EXTERNAL_PUBLIC: "Öffentlichkeit betroffen",
  });

export const USAGE_CONTEXT_OPTIONS: CaptureUsageContext[] = [
  "INTERNAL_ONLY",
  "EMPLOYEES",
  "CUSTOMERS",
  "APPLICANTS",
  "PUBLIC",
];

const CAPTURE_USAGE_CONTEXT_ALIAS_MAP: Record<string, CaptureUsageContext> =
  Object.freeze({
    internal_only: "INTERNAL_ONLY",
    internalonly: "INTERNAL_ONLY",
    employees: "EMPLOYEES",
    employee_facing: "EMPLOYEES",
    employeefacing: "EMPLOYEES",
    customers: "CUSTOMERS",
    customer_facing: "CUSTOMERS",
    customerfacing: "CUSTOMERS",
    applicants: "APPLICANTS",
    applicant: "APPLICANTS",
    public: "PUBLIC",
    external_public: "PUBLIC",
    externalpublic: "PUBLIC",
  });

export const DATA_CATEGORIES = [
  "NO_PERSONAL_DATA",
  "PERSONAL_DATA",
  "SPECIAL_PERSONAL",
  "HEALTH_DATA",
  "BIOMETRIC_DATA",
  "POLITICAL_RELIGIOUS",
  "OTHER_SENSITIVE",
  "INTERNAL_CONFIDENTIAL",
  "PUBLIC_DATA",
  "NONE",
  "INTERNAL",
  "PERSONAL",
  "SENSITIVE",
] as const;

export type DataCategory = (typeof DATA_CATEGORIES)[number];

export const DATA_CATEGORY_LABELS: Record<DataCategory, string> =
  Object.freeze({
    NO_PERSONAL_DATA: "Keine personenbezogenen Daten",
    PERSONAL_DATA: "Personenbezogene Daten",
    SPECIAL_PERSONAL: "Besondere personenbezogene Daten",
    HEALTH_DATA: "Gesundheitsdaten",
    BIOMETRIC_DATA: "Biometrische Daten",
    POLITICAL_RELIGIOUS: "Politische / religiöse Angaben",
    OTHER_SENSITIVE: "Weitere sensible Daten",
    INTERNAL_CONFIDENTIAL: "Interne / vertrauliche Unternehmensdaten",
    PUBLIC_DATA: "Öffentlich zugängliche Daten",
    NONE: "Keine besonderen Daten",
    INTERNAL: "Interne Daten",
    PERSONAL: "Personenbezogene Daten",
    SENSITIVE: "Sensible Daten",
  });

export const DATA_CATEGORY_MAIN_OPTIONS: DataCategory[] = [
  "NO_PERSONAL_DATA",
  "PERSONAL_DATA",
  "SPECIAL_PERSONAL",
  "INTERNAL_CONFIDENTIAL",
  "PUBLIC_DATA",
];

export const DATA_CATEGORY_SPECIAL_OPTIONS: DataCategory[] = [
  "HEALTH_DATA",
  "BIOMETRIC_DATA",
  "POLITICAL_RELIGIOUS",
  "OTHER_SENSITIVE",
];

const DATA_CATEGORY_ALIAS_MAP: Record<string, DataCategory> = Object.freeze({
  no_personal_data: "NO_PERSONAL_DATA",
  nopersonaldata: "NO_PERSONAL_DATA",
  none: "NO_PERSONAL_DATA",
  personal_data: "PERSONAL_DATA",
  personaldata: "PERSONAL_DATA",
  personal: "PERSONAL_DATA",
  special_personal: "SPECIAL_PERSONAL",
  specialpersonal: "SPECIAL_PERSONAL",
  sensitive: "SPECIAL_PERSONAL",
  internal_confidential: "INTERNAL_CONFIDENTIAL",
  internalconfidential: "INTERNAL_CONFIDENTIAL",
  internal: "INTERNAL_CONFIDENTIAL",
  public_data: "PUBLIC_DATA",
  publicdata: "PUBLIC_DATA",
  health_data: "HEALTH_DATA",
  healthdata: "HEALTH_DATA",
  biometric_data: "BIOMETRIC_DATA",
  biometricdata: "BIOMETRIC_DATA",
  political_religious: "POLITICAL_RELIGIOUS",
  politicalreligious: "POLITICAL_RELIGIOUS",
  other_sensitive: "OTHER_SENSITIVE",
  othersensitive: "OTHER_SENSITIVE",
});

export const DECISION_IMPACT_VALUES = ["YES", "NO", "UNSURE"] as const;
export type DecisionImpact = (typeof DECISION_IMPACT_VALUES)[number];

export const AFFECTED_PARTY_VALUES = [
  "INDIVIDUALS",
  "GROUPS_OR_TEAMS",
  "EXTERNAL_PEOPLE",
  "INTERNAL_PROCESSES",
] as const;
export type AffectedParty = (typeof AFFECTED_PARTY_VALUES)[number];

export const DECISION_INFLUENCE_VALUES = [
  "ASSISTANCE",
  "PREPARATION",
  "AUTOMATED",
] as const;
export type DecisionInfluence =
  (typeof DECISION_INFLUENCE_VALUES)[number];

export const DECISION_INFLUENCE_LABELS: Record<DecisionInfluence, string> =
  Object.freeze({
    ASSISTANCE: "Reine Assistenz (keine Entscheidungsrelevanz)",
    PREPARATION: "Vorbereitung von Entscheidungen",
    AUTOMATED: "Trifft oder automatisiert Entscheidungen",
  });

export const DECISION_INFLUENCE_OPTIONS: DecisionInfluence[] = [
  "ASSISTANCE",
  "PREPARATION",
  "AUTOMATED",
];

export const USE_CASE_ORIGIN_SOURCE_VALUES = [
  "manual",
  "access_code",
  "supplier_request",
  "import",
] as const;

export type UseCaseOriginSource =
  (typeof USE_CASE_ORIGIN_SOURCE_VALUES)[number];

const USE_CASE_ORIGIN_SOURCE_ALIAS_MAP: Record<string, UseCaseOriginSource> =
  Object.freeze({
    manual: "manual",
    access_code: "access_code",
    accesscode: "access_code",
    "access-code": "access_code",
    supplier_request: "supplier_request",
    supplierrequest: "supplier_request",
    "supplier-request": "supplier_request",
    import: "import",
    imported: "import",
    manual_import: "import",
    manualimport: "import",
  });

function toLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function normalizeRegisterUseCaseStatus(
  value: unknown,
  fallback: RegisterUseCaseStatus = "UNREVIEWED"
): RegisterUseCaseStatus {
  if (typeof value !== "string") {
    return fallback;
  }

  const direct = value.trim().toUpperCase() as RegisterUseCaseStatus;
  if (
    (REGISTER_USE_CASE_STATUS_VALUES as readonly string[]).includes(direct)
  ) {
    return direct;
  }

  return REGISTER_USE_CASE_STATUS_ALIAS_MAP[toLookupKey(value)] ?? fallback;
}

export function normalizeCardVersion(value: unknown): CardVersion {
  if (typeof value !== "string") {
    return CANONICAL_CARD_VERSION;
  }

  return CARD_VERSION_ALIAS_MAP[value.trim().toLowerCase()] ?? CANONICAL_CARD_VERSION;
}

export function normalizeCaptureUsageContext(
  value: unknown
): CaptureUsageContext | null {
  if (typeof value !== "string") {
    return null;
  }

  const direct = value.trim().toUpperCase() as CaptureUsageContext;
  if (
    (CAPTURE_USAGE_CONTEXT_VALUES as readonly string[]).includes(direct)
  ) {
    return CAPTURE_USAGE_CONTEXT_ALIAS_MAP[toLookupKey(direct)] ?? direct;
  }

  return CAPTURE_USAGE_CONTEXT_ALIAS_MAP[toLookupKey(value)] ?? null;
}

export function normalizeCaptureUsageContexts(
  values: unknown,
  fallback: CaptureUsageContext[] = ["INTERNAL_ONLY"]
): CaptureUsageContext[] {
  const normalized = Array.isArray(values)
    ? values
        .map((value) => normalizeCaptureUsageContext(value))
        .filter((value): value is CaptureUsageContext => value !== null)
    : [];

  return normalized.length > 0 ? dedupe(normalized) : [...fallback];
}

export function normalizeDataCategory(value: unknown): DataCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  const direct = value.trim().toUpperCase() as DataCategory;
  if ((DATA_CATEGORIES as readonly string[]).includes(direct)) {
    return DATA_CATEGORY_ALIAS_MAP[toLookupKey(direct)] ?? direct;
  }

  return DATA_CATEGORY_ALIAS_MAP[toLookupKey(value)] ?? null;
}

export function normalizeDataCategories(
  values: unknown,
  fallbackValue?: unknown
): DataCategory[] {
  const rawValues = Array.isArray(values)
    ? values
    : fallbackValue !== undefined
      ? [fallbackValue]
      : [];

  let normalized = rawValues
    .map((value) => normalizeDataCategory(value))
    .filter((value): value is DataCategory => value !== null);

  normalized = dedupe(normalized);

  if (
    normalized.includes("NO_PERSONAL_DATA") &&
    normalized.some((value) => value !== "NO_PERSONAL_DATA")
  ) {
    normalized = normalized.filter((value) => value !== "NO_PERSONAL_DATA");
  }

  return normalized;
}

export function normalizeUseCaseOriginSource(
  value: unknown
): UseCaseOriginSource | null {
  if (typeof value !== "string") {
    return null;
  }

  const direct = value.trim() as UseCaseOriginSource;
  if (
    (USE_CASE_ORIGIN_SOURCE_VALUES as readonly string[]).includes(direct)
  ) {
    return direct;
  }

  return USE_CASE_ORIGIN_SOURCE_ALIAS_MAP[toLookupKey(value)] ?? null;
}
