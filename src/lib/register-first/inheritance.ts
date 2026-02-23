/**
 * Inheritance Layer – Org → Use Case field inheritance and provenance tracking.
 *
 * Sprint S3-PREP: Pure data logic, no UI, no capability-gating.
 *
 * Concept:
 *   OrgSettings (Register-level) define defaults that flow down to each
 *   UseCaseCard's governanceAssessment. Each field on a Use Case can be
 *   either "inherited" (from org defaults) or "overridden" (use-case-specific).
 *   FieldProvenance tracks the origin of each value.
 */

import type { OrgSettings, UseCaseCard } from "./types";

// ── Provenance Tracking ─────────────────────────────────────────────────────

export type FieldSource = "inherit" | "override";

export interface FieldProvenance {
  source: FieldSource;
  /** Reason for the override (required when source === 'override') */
  overrideReason?: string;
  /** Who approved this override (userId or name) */
  approvedBy?: string;
  /** ISO timestamp of when this provenance record was created */
  timestamp: string;
}

// ── Inheritance Configuration ───────────────────────────────────────────────

/**
 * Defines which fields can be inherited from OrgSettings → UseCaseCard.
 * Each key maps an org-level setting to the corresponding use-case field path.
 */
export interface InheritableFieldMapping {
  /** Org field path (dot-notation key within OrgSettings / Register) */
  orgPath: string;
  /** Use Case target field path (dot-notation within UseCaseCard) */
  useCasePath: string;
  /** Human-readable label (German, for UI later) */
  label: string;
}

/**
 * Static registry of inheritable field mappings.
 * Extend this array as new org-level defaults become available.
 */
export const INHERITABLE_FIELDS: readonly InheritableFieldMapping[] = [
  {
    orgPath: "reviewStandard",
    useCasePath: "governanceAssessment.flex.iso.reviewCycle",
    label: "Pruefrhythmus",
  },
  {
    orgPath: "aiPolicy.url",
    useCasePath: "governanceAssessment.flex.policyLinks",
    label: "KI-Richtlinie",
  },
  {
    orgPath: "incidentProcess.url",
    useCasePath: "governanceAssessment.flex.incidentProcessDefined",
    label: "Vorfallprozess",
  },
  {
    orgPath: "rolesFramework.booleanDefined",
    useCasePath: "governanceAssessment.core.oversightDefined",
    label: "Rollenkonzept definiert",
  },
] as const;

export interface InheritanceConfig {
  /** Which fields are eligible for inheritance */
  fields: readonly InheritableFieldMapping[];
  /** Whether inheritance is active (can be toggled per register) */
  enabled: boolean;
}

export const DEFAULT_INHERITANCE_CONFIG: InheritanceConfig = {
  fields: INHERITABLE_FIELDS,
  enabled: true,
};

// ── Org Defaults (merged shape for use-case pre-population) ─────────────────

/**
 * Represents the resolved default values derived from OrgSettings
 * that can be applied to a Use Case's governance assessment.
 */
export interface OrgDefaults {
  reviewCycle?: "annual" | "semiannual" | "quarterly" | "monthly" | "ad_hoc" | "unknown";
  policyLinks?: string[];
  incidentProcessDefined?: boolean;
  oversightDefined?: boolean;
}

/**
 * Represents the use-case-level overrides that take precedence
 * over org defaults when both exist.
 */
export interface UseCaseOverrides {
  reviewCycle?: "annual" | "semiannual" | "quarterly" | "monthly" | "ad_hoc" | "unknown";
  policyLinks?: string[];
  incidentProcessDefined?: boolean;
  oversightDefined?: boolean;
}

/**
 * The merged result after applying inheritance logic.
 */
export interface MergedDefaults {
  reviewCycle: "annual" | "semiannual" | "quarterly" | "monthly" | "ad_hoc" | "unknown";
  policyLinks: string[];
  incidentProcessDefined: boolean;
  oversightDefined: boolean;
  /** Provenance map: field name → how the value was resolved */
  provenance: Record<string, FieldProvenance>;
}

// ── Mapping Helpers ─────────────────────────────────────────────────────────

const REVIEW_STANDARD_TO_CYCLE: Record<string, MergedDefaults["reviewCycle"]> = {
  annual: "annual",
  semiannual: "semiannual",
  "risk-based": "ad_hoc",
};

/**
 * Derive OrgDefaults from OrgSettings.
 * Maps org-level field shapes into the flat structure used for inheritance.
 */
export function deriveOrgDefaults(orgSettings: OrgSettings | null | undefined): OrgDefaults {
  if (!orgSettings) return {};

  const defaults: OrgDefaults = {};

  // reviewStandard → reviewCycle
  if (orgSettings.reviewStandard) {
    defaults.reviewCycle =
      REVIEW_STANDARD_TO_CYCLE[orgSettings.reviewStandard] ?? "unknown";
  }

  // aiPolicy.url → policyLinks
  if (orgSettings.aiPolicy?.url) {
    defaults.policyLinks = [orgSettings.aiPolicy.url];
  }

  // incidentProcess → incidentProcessDefined
  if (orgSettings.incidentProcess?.url) {
    defaults.incidentProcessDefined = true;
  }

  // rolesFramework → oversightDefined
  if (orgSettings.rolesFramework?.booleanDefined != null) {
    defaults.oversightDefined = orgSettings.rolesFramework.booleanDefined;
  }

  return defaults;
}

/**
 * Extract current use-case-level overrides from a UseCaseCard.
 * Returns only fields that have explicit values on the card.
 */
export function extractUseCaseOverrides(
  card: Pick<UseCaseCard, "governanceAssessment">
): UseCaseOverrides {
  const overrides: UseCaseOverrides = {};
  const flex = card.governanceAssessment?.flex;
  const core = card.governanceAssessment?.core;

  if (flex?.iso?.reviewCycle && flex.iso.reviewCycle !== "unknown") {
    overrides.reviewCycle = flex.iso.reviewCycle;
  }

  if (flex?.policyLinks && flex.policyLinks.length > 0) {
    overrides.policyLinks = flex.policyLinks;
  }

  if (flex?.incidentProcessDefined != null) {
    overrides.incidentProcessDefined = flex.incidentProcessDefined;
  }

  if (core?.oversightDefined != null) {
    overrides.oversightDefined = core.oversightDefined;
  }

  return overrides;
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Create a FieldProvenance record.
 */
export function createProvenance(
  source: FieldSource,
  reason?: string,
  approvedBy?: string,
  timestamp?: string
): FieldProvenance {
  return {
    source,
    ...(reason != null ? { overrideReason: reason } : {}),
    ...(approvedBy != null ? { approvedBy } : {}),
    timestamp: timestamp ?? new Date().toISOString(),
  };
}

/**
 * Check whether a use-case field value differs from (overrides) the org default.
 *
 * Returns `true` if the use-case has an explicit value that differs from
 * the org-level default, meaning it's an override.
 * Returns `false` if the values match (inherited) or if neither is set.
 */
export function hasOverride<T>(
  useCaseValue: T | undefined | null,
  orgDefault: T | undefined | null
): boolean {
  // Neither side has a value → no override
  if (useCaseValue == null && orgDefault == null) return false;

  // Use case has a value but org doesn't → it's an explicit value, not an override
  if (orgDefault == null) return false;

  // Org has a value but use case doesn't → inherited (no override)
  if (useCaseValue == null) return false;

  // Both have values → compare
  if (Array.isArray(useCaseValue) && Array.isArray(orgDefault)) {
    if (useCaseValue.length !== orgDefault.length) return true;
    return JSON.stringify(useCaseValue) !== JSON.stringify(orgDefault);
  }

  return useCaseValue !== orgDefault;
}

/**
 * Apply org defaults to use-case overrides, producing a merged result
 * with provenance tracking for each field.
 *
 * Priority: useCaseOverrides > orgDefaults > fallback defaults.
 */
export function applyOrgDefaults(
  orgSettings: OrgSettings | null | undefined,
  useCaseOverrides: UseCaseOverrides = {},
  timestamp?: string
): MergedDefaults {
  const orgDefaults = deriveOrgDefaults(orgSettings);
  const ts = timestamp ?? new Date().toISOString();
  const provenance: Record<string, FieldProvenance> = {};

  // ── reviewCycle ───────────────────────────────────────────────────────
  const reviewCycleOverridden = hasOverride(
    useCaseOverrides.reviewCycle,
    orgDefaults.reviewCycle
  );
  const reviewCycle: MergedDefaults["reviewCycle"] = reviewCycleOverridden
    ? useCaseOverrides.reviewCycle!
    : orgDefaults.reviewCycle ?? "unknown";
  provenance["reviewCycle"] = createProvenance(
    reviewCycleOverridden ? "override" : "inherit",
    undefined,
    undefined,
    ts
  );

  // ── policyLinks ───────────────────────────────────────────────────────
  const policyLinksOverridden = hasOverride(
    useCaseOverrides.policyLinks,
    orgDefaults.policyLinks
  );
  const policyLinks: string[] = policyLinksOverridden
    ? useCaseOverrides.policyLinks!
    : orgDefaults.policyLinks ?? [];
  provenance["policyLinks"] = createProvenance(
    policyLinksOverridden ? "override" : "inherit",
    undefined,
    undefined,
    ts
  );

  // ── incidentProcessDefined ────────────────────────────────────────────
  const incidentOverridden = hasOverride(
    useCaseOverrides.incidentProcessDefined,
    orgDefaults.incidentProcessDefined
  );
  const incidentProcessDefined: boolean = incidentOverridden
    ? useCaseOverrides.incidentProcessDefined!
    : orgDefaults.incidentProcessDefined ?? false;
  provenance["incidentProcessDefined"] = createProvenance(
    incidentOverridden ? "override" : "inherit",
    undefined,
    undefined,
    ts
  );

  // ── oversightDefined ──────────────────────────────────────────────────
  const oversightOverridden = hasOverride(
    useCaseOverrides.oversightDefined,
    orgDefaults.oversightDefined
  );
  const oversightDefined: boolean = oversightOverridden
    ? useCaseOverrides.oversightDefined!
    : orgDefaults.oversightDefined ?? false;
  provenance["oversightDefined"] = createProvenance(
    oversightOverridden ? "override" : "inherit",
    undefined,
    undefined,
    ts
  );

  return {
    reviewCycle,
    policyLinks,
    incidentProcessDefined,
    oversightDefined,
    provenance,
  };
}

/**
 * Compute a full provenance map for a Use Case against its org defaults.
 * Useful for displaying inheritance indicators in the UI.
 */
export function computeProvenanceMap(
  orgSettings: OrgSettings | null | undefined,
  card: Pick<UseCaseCard, "governanceAssessment">,
  timestamp?: string
): Record<string, FieldProvenance> {
  const orgDefaults = deriveOrgDefaults(orgSettings);
  const overrides = extractUseCaseOverrides(card);
  const ts = timestamp ?? new Date().toISOString();

  const fieldKeys = [
    "reviewCycle",
    "policyLinks",
    "incidentProcessDefined",
    "oversightDefined",
  ] as const;

  const map: Record<string, FieldProvenance> = {};

  for (const key of fieldKeys) {
    const isOverridden = hasOverride(
      overrides[key as keyof UseCaseOverrides],
      orgDefaults[key as keyof OrgDefaults]
    );
    map[key] = createProvenance(
      isOverridden ? "override" : "inherit",
      undefined,
      undefined,
      ts
    );
  }

  return map;
}
