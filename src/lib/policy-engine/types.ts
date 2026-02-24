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
    /** Human-readable reason for inclusion (e.g. "Gilt für Systeme mit personenbez. Daten") */
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
}

// ── Policy Context (consumed by PE-2 Assembler) ─────────────────────────────

export interface PolicyContext {
    register: Register;
    useCases: UseCaseCard[];
    orgSettings: OrgSettings;
    level: PolicyLevel;
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
    1: "Commitment (1 Seite)",
    2: "Framework (3–5 Seiten)",
    3: "Enterprise (8–10 Seiten)",
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
    draft: "Entwurf",
    review: "In Prüfung",
    approved: "Genehmigt",
    archived: "Archiviert",
};
