import type {
    PolicyDocument,
    PolicyLevel,
    PolicyStatus,
    PolicyOrgSnapshot,
    PolicyVersion,
} from "./types";
import { isValidPolicyTransition, POLICY_LEVEL_LABELS, MAX_POLICY_VERSIONS } from "./types";
import type { PolicyScope, PolicyRepository } from "./policy-repository";
import { createFirestorePolicyRepository } from "./policy-repository";

// ── Service Interface ───────────────────────────────────────────────────────

export interface PolicyService {
    createPolicy(
        registerId: string,
        level: PolicyLevel,
        orgSnapshot: PolicyOrgSnapshot,
        actorId: string,
    ): Promise<PolicyDocument>;

    getPolicy(
        registerId: string,
        policyId: string,
    ): Promise<PolicyDocument | null>;

    listPolicies(registerId: string): Promise<PolicyDocument[]>;

    updatePolicy(
        registerId: string,
        policyId: string,
        updates: Partial<Pick<PolicyDocument, "title" | "sections">>,
    ): Promise<PolicyDocument>;

    updatePolicyStatus(
        registerId: string,
        policyId: string,
        nextStatus: PolicyStatus,
        actorId: string,
        changeNote?: string,
    ): Promise<PolicyDocument>;
}

// ── Scope Resolver ──────────────────────────────────────────────────────────

async function resolveScope(registerId: string): Promise<PolicyScope> {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("UNAUTHENTICATED");
    return { userId: user.uid, registerId };
}

// ── ID Generation ───────────────────────────────────────────────────────────

function generatePolicyId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `pol_${ts}_${rand}`;
}

// ── Service Implementation ──────────────────────────────────────────────────

export function createPolicyService(
    repo?: PolicyRepository,
): PolicyService {
    const repository = repo ?? createFirestorePolicyRepository();

    return {
        async createPolicy(registerId, level, orgSnapshot, actorId) {
            const scope = await resolveScope(registerId);
            const now = new Date().toISOString();

            const doc: PolicyDocument = {
                policyId: generatePolicyId(),
                registerId,
                level,
                status: "draft",
                title: `AI Policy – ${POLICY_LEVEL_LABELS[level]}`,
                sections: [],
                metadata: {
                    createdAt: now,
                    updatedAt: now,
                    createdBy: actorId,
                    version: 1,
                },
                orgContextSnapshot: orgSnapshot,
            };

            return repository.create(scope, doc);
        },

        async getPolicy(registerId, policyId) {
            const scope = await resolveScope(registerId);
            return repository.getById(scope, policyId);
        },

        async listPolicies(registerId) {
            const scope = await resolveScope(registerId);
            return repository.list(scope);
        },

        async updatePolicy(registerId, policyId, updates) {
            const scope = await resolveScope(registerId);
            const doc = await repository.getById(scope, policyId);
            if (!doc) throw new Error("POLICY_NOT_FOUND");

            const updated: PolicyDocument = {
                ...doc,
                ...updates,
                metadata: {
                    ...doc.metadata,
                    updatedAt: new Date().toISOString(),
                    version: doc.metadata.version + 1,
                },
            };

            return repository.save(scope, updated);
        },

        async updatePolicyStatus(registerId, policyId, nextStatus, actorId, changeNote) {
            const scope = await resolveScope(registerId);
            const doc = await repository.getById(scope, policyId);
            if (!doc) throw new Error("POLICY_NOT_FOUND");

            if (!isValidPolicyTransition(doc.status, nextStatus)) {
                throw new Error(
                    `INVALID_STATUS_TRANSITION: ${doc.status} → ${nextStatus}`,
                );
            }

            const now = new Date().toISOString();
            const newVersion = doc.metadata.version + 1;

            // Create version snapshot on every status change
            const snapshot: PolicyVersion = {
                versionNumber: doc.metadata.version,
                createdAt: now,
                createdBy: actorId,
                changeNote,
                sectionsSnapshot: JSON.parse(JSON.stringify(doc.sections)),
                fromStatus: doc.status,
                toStatus: nextStatus,
            };

            // Keep max 5 versions (newest first, trim oldest)
            const existingVersions = doc.versions ?? [];
            const updatedVersions = [snapshot, ...existingVersions].slice(
                0,
                MAX_POLICY_VERSIONS,
            );

            const updated: PolicyDocument = {
                ...doc,
                status: nextStatus,
                versions: updatedVersions,
                metadata: {
                    ...doc.metadata,
                    updatedAt: now,
                    version: newVersion,
                    ...(nextStatus === "approved"
                        ? { approvedBy: actorId, approvedAt: now }
                        : {}),
                },
            };

            return repository.save(scope, updated);
        },
    };
}

// ── Singleton ───────────────────────────────────────────────────────────────

export const policyService = createPolicyService();
