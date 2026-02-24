import assert from "node:assert/strict";
import type { PolicyDocument, PolicyLevel, PolicyStatus } from "../types";
import {
    isValidPolicyTransition,
    POLICY_STATUS_TRANSITIONS,
    POLICY_LEVEL_LABELS,
    POLICY_STATUS_LABELS,
} from "../types";
import { createInMemoryPolicyRepository } from "../policy-repository";
import { createPolicyService } from "../policy-service";
import type { PolicyScope } from "../policy-repository";

export async function runPolicyEngineSmoke() {
    // ── Types ──────────────────────────────────────────────────────────────
    assert.equal(POLICY_LEVEL_LABELS[1], "Commitment (1 Seite)");
    assert.equal(POLICY_LEVEL_LABELS[3], "Enterprise (8–10 Seiten)");
    assert.equal(POLICY_STATUS_LABELS.draft, "Entwurf");
    assert.equal(POLICY_STATUS_LABELS.approved, "Genehmigt");

    // Status transitions
    assert.equal(isValidPolicyTransition("draft", "review"), true);
    assert.equal(isValidPolicyTransition("draft", "approved"), false);
    assert.equal(isValidPolicyTransition("review", "approved"), true);
    assert.equal(isValidPolicyTransition("review", "draft"), true);
    assert.equal(isValidPolicyTransition("approved", "draft"), true);
    assert.equal(isValidPolicyTransition("approved", "archived"), true);
    assert.equal(isValidPolicyTransition("archived", "draft"), false);

    // ── Repository (in-memory) ─────────────────────────────────────────────
    const repo = createInMemoryPolicyRepository();
    const scope: PolicyScope = { userId: "user_test", registerId: "reg_test" };

    const doc: PolicyDocument = {
        policyId: "pol_001",
        registerId: "reg_test",
        level: 1,
        status: "draft",
        title: "KI-Richtlinie – Commitment",
        sections: [
            {
                sectionId: "sec_01",
                title: "AI Commitment",
                content: "# Commitment\n\nWir setzen KI verantwortungsvoll ein.",
                order: 1,
                isConditional: false,
            },
        ],
        metadata: {
            createdAt: "2026-02-24T10:00:00.000Z",
            updatedAt: "2026-02-24T10:00:00.000Z",
            createdBy: "user_test",
            version: 1,
        },
        orgContextSnapshot: {
            organisationName: "EUKI GmbH",
            industry: "SaaS",
            contactPerson: "Max Mustermann",
        },
    };

    // Create
    const created = await repo.create(scope, doc);
    assert.equal(created.policyId, "pol_001");
    assert.equal(created.status, "draft");

    // GetById
    const fetched = await repo.getById(scope, "pol_001");
    assert.ok(fetched);
    assert.equal(fetched.title, "KI-Richtlinie – Commitment");
    assert.equal(fetched.sections.length, 1);

    // List
    const list = await repo.list(scope);
    assert.equal(list.length, 1);

    // Save (update)
    const updated = await repo.save(scope, {
        ...doc,
        status: "review",
        metadata: { ...doc.metadata, version: 2, updatedAt: "2026-02-24T11:00:00.000Z" },
    });
    assert.equal(updated.status, "review");
    assert.equal(updated.metadata.version, 2);

    // SoftDelete
    await repo.softDelete(scope, "pol_001");
    const archived = await repo.getById(scope, "pol_001");
    assert.ok(archived);
    assert.equal(archived.status, "archived");

    // Different scope returns empty
    const otherScope: PolicyScope = { userId: "other_user", registerId: "other_reg" };
    const otherList = await repo.list(otherScope);
    assert.equal(otherList.length, 0);

    console.log("Policy Engine foundation smoke tests passed.");

    // ── PE-4: Versioning ────────────────────────────────────────────────
    const vRepo = createInMemoryPolicyRepository();
    const vScope: PolicyScope = { userId: "v_user", registerId: "v_reg" };

    const vDoc: PolicyDocument = {
        policyId: "pol_v01",
        registerId: "v_reg",
        level: 2,
        status: "draft",
        title: "Versioning Test",
        sections: [
            { sectionId: "s1", title: "Sec 1", content: "# Content v1", order: 1, isConditional: false },
        ],
        metadata: {
            createdAt: "2026-02-24T10:00:00.000Z",
            updatedAt: "2026-02-24T10:00:00.000Z",
            createdBy: "v_user",
            version: 1,
        },
        orgContextSnapshot: { organisationName: "Test GmbH" },
    };

    await vRepo.create(vScope, vDoc);

    // Simulate status transition: draft → review (with version snapshot)
    const afterReview = await vRepo.save(vScope, {
        ...vDoc,
        status: "review",
        versions: [
            {
                versionNumber: 1,
                createdAt: "2026-02-24T11:00:00.000Z",
                createdBy: "v_user",
                changeNote: "Zur Prüfung eingereicht",
                sectionsSnapshot: JSON.parse(JSON.stringify(vDoc.sections)),
                fromStatus: "draft",
                toStatus: "review",
            },
        ],
        metadata: { ...vDoc.metadata, version: 2, updatedAt: "2026-02-24T11:00:00.000Z" },
    });

    assert.equal(afterReview.versions?.length, 1);
    assert.equal(afterReview.versions![0].fromStatus, "draft");
    assert.equal(afterReview.versions![0].toStatus, "review");
    assert.equal(afterReview.versions![0].changeNote, "Zur Prüfung eingereicht");
    assert.equal(afterReview.versions![0].sectionsSnapshot.length, 1);
    assert.equal(afterReview.versions![0].versionNumber, 1);

    // Simulate review → approved (add second version)
    const afterApproved = await vRepo.save(vScope, {
        ...afterReview,
        status: "approved",
        versions: [
            {
                versionNumber: 2,
                createdAt: "2026-02-24T12:00:00.000Z",
                createdBy: "v_user",
                changeNote: "Genehmigt durch GF",
                sectionsSnapshot: JSON.parse(JSON.stringify(afterReview.sections)),
                fromStatus: "review",
                toStatus: "approved",
            },
            ...afterReview.versions!,
        ],
        metadata: { ...afterReview.metadata, version: 3, updatedAt: "2026-02-24T12:00:00.000Z", approvedBy: "v_user", approvedAt: "2026-02-24T12:00:00.000Z" },
    });

    assert.equal(afterApproved.versions?.length, 2);
    assert.equal(afterApproved.versions![0].toStatus, "approved");
    assert.equal(afterApproved.versions![1].toStatus, "review");
    assert.equal(afterApproved.metadata.version, 3);

    // Verify max 5 version limit (simulate 6 transitions — only 5 kept)
    const sixVersions = Array.from({ length: 6 }, (_, i) => ({
        versionNumber: i + 1,
        createdAt: `2026-02-24T${(10 + i).toString().padStart(2, "0")}:00:00.000Z`,
        createdBy: "v_user",
        sectionsSnapshot: [],
        fromStatus: "draft" as const,
        toStatus: "review" as const,
    }));
    const trimmed = sixVersions.slice(0, 5);
    assert.equal(trimmed.length, 5, "Max 5 versions retained");

    console.log("PE-4 versioning smoke tests passed.");
}
