import assert from "node:assert/strict";
import test from "node:test";
import type { PolicyDocument } from "@/lib/policy-engine/types";
import {
  getWorkflowLinkReferences,
  removeWorkflowLinkReference,
  resolveWorkflowLinkEntries,
  toggleWorkflowLinkReference,
} from "./workflow-links";

const policyDocument: PolicyDocument = {
  policyId: "pol_register_core",
  registerId: "reg_1",
  level: 2,
  status: "approved",
  title: "Review- und Freigabeprozess",
  sections: [],
  metadata: {
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-10T10:00:00.000Z",
    createdBy: "user_1",
    version: 3,
  },
  orgContextSnapshot: {
    organisationName: "EUKI Test",
  },
};

test("toggleWorkflowLinkReference setzt eine neue Verknuepfung", () => {
  const references = toggleWorkflowLinkReference([], policyDocument.policyId);
  assert.deepEqual(references, [policyDocument.policyId]);
});

test("resolveWorkflowLinkEntries zeigt verknuepfte Dokumente mit Titel und Status", () => {
  const entries = resolveWorkflowLinkEntries([policyDocument.policyId], [policyDocument]);

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.title, "Review- und Freigabeprozess");
  assert.equal(entries[0]?.meta, "Genehmigt · pol_register_core");
  assert.equal(entries[0]?.isResolved, true);
});

test("removeWorkflowLinkReference entfernt eine bestehende Verknuepfung", () => {
  const references = removeWorkflowLinkReference(
    [policyDocument.policyId],
    policyDocument.policyId
  );
  assert.deepEqual(references, []);
});

test("getWorkflowLinkReferences normalisiert leere und doppelte Eintraege", () => {
  const references = getWorkflowLinkReferences([
    " ",
    "pol_register_core",
    "POL_REGISTER_CORE",
    "https://example.com/process",
  ]);

  assert.deepEqual(references, [
    "pol_register_core",
    "https://example.com/process",
  ]);
});
