import type { Register, UseCaseCard, OrgSettings } from "@/lib/register-first/types";

// ── Policy Document ─────────────────────────────────────────────────────────

export type PolicyLevel = 1 | 2 | 3;

export type PolicyStatus = "draft" | "review" | "approved" | "archived";

export interface PolicySection {
    sectionId: string;
    title: string;
    /** Markdown content */
    content: string;
    order: number;
    /** True if this section was conditionally included */
    isConditional: boolean;
    /** Human-readable reason for inclusion (e.g. "Applies to systems processing personal data") */
    conditionLabel?: string;
}

export interface PolicyMetadata {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: string;
    version: number;
}

// ── Policy Version (PE-4: Versioning) ───────────────────────────────────────

export const MAX_POLICY_VERSIONS = 5;

export interface PolicyVersion {
    versionNumber: number;
    createdAt: string;
    createdBy: string;
    changeNote?: string;
    /** Snapshot of sections at the time of the status change */
    sectionsSnapshot: PolicySection[];
    /** Status the document transitioned TO */
    toStatus: PolicyStatus;
    /** Status the document transitioned FROM */
    fromStatus: PolicyStatus;
}

export interface PolicyOrgSnapshot {
    organisationName: string;
    industry?: string;
    contactPerson?: string;
}

export interface PolicyDocument {
    policyId: string;
    registerId: string;
    level: PolicyLevel;
    status: PolicyStatus;
    title: string;
    sections: PolicySection[];
    metadata: PolicyMetadata;
    orgContextSnapshot: PolicyOrgSnapshot;
    /** Version history snapshots (max MAX_POLICY_VERSIONS, newest first) */
    versions?: PolicyVersion[];
}

// ── Policy Context (consumed by PE-2 Assembler) ─────────────────────────────

export interface PolicyContext {
    register: Register;
    useCases: UseCaseCard[];
    orgSettings: OrgSettings;
    level: PolicyLevel;
    locale?: "de" | "en" | string;
}

// ── Status Transitions ──────────────────────────────────────────────────────

export const POLICY_STATUS_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
    draft: ["review"],
    review: ["approved", "draft"],
    approved: ["draft", "archived"],
    archived: [],
};

export function isValidPolicyTransition(
    from: PolicyStatus,
    to: PolicyStatus,
): boolean {
    return POLICY_STATUS_TRANSITIONS[from].includes(to);
}

// ── Level Labels ────────────────────────────────────────────────────────────

export const POLICY_LEVEL_LABELS: Record<PolicyLevel, string> = {
    1: "Commitment (1 page)",
    2: "Framework (3\u20135 pages)",
    3: "Enterprise (8\u201310 pages)",
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
    draft: "Draft",
    review: "Under review",
    approved: "Approved",
    archived: "Archived",
};
