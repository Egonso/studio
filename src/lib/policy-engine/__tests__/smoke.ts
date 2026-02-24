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
}
