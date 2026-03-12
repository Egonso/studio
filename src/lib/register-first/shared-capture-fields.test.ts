import assert from "node:assert/strict";
import test from "node:test";

import {
  CAPTURE_TOOL_PLACEHOLDER_ID,
  normalizeSharedCaptureFields,
  validateSharedCaptureFields,
} from "./shared-capture-fields";

test("validateSharedCaptureFields marks the business-required fields", () => {
  const result = validateSharedCaptureFields({
    purpose: "AI",
    ownerRole: "A",
    toolId: CAPTURE_TOOL_PLACEHOLDER_ID,
    toolFreeText: "",
    usageContexts: [],
  });

  assert.equal(result.isValid, false);
  assert.equal(
    result.errors.purpose,
    "Bitte gib einen Use-Case-Namen mit mindestens 3 Zeichen an."
  );
  assert.equal(
    result.errors.ownerRole,
    "Bitte gib eine Owner-Rolle oder Funktion mit mindestens 2 Zeichen an."
  );
  assert.equal(result.firstInvalidField, "purpose");
});

test("normalizeSharedCaptureFields treats an empty tool as optional and defaults usageContexts", () => {
  const normalized = normalizeSharedCaptureFields({
    purpose: "Copilot für interne Dokumentation",
    ownerRole: "Operations Lead",
    toolId: "other",
    toolFreeText: "   ",
    usageContexts: [],
    dataCategories: [],
    decisionInfluence: null,
  });

  assert.equal(normalized.toolId, undefined);
  assert.equal(normalized.toolFreeText, undefined);
  assert.deepEqual(normalized.usageContexts, ["INTERNAL_ONLY"]);
  assert.equal(normalized.dataCategories, undefined);
  assert.equal(normalized.decisionInfluence, undefined);
});

test("normalizeSharedCaptureFields keeps an unknown tool as a custom tool", () => {
  const normalized = normalizeSharedCaptureFields({
    purpose: "Copilot für interne Dokumentation",
    ownerRole: "Operations Lead",
    toolId: "other",
    toolFreeText: "Acme AI Workspace",
    usageContexts: ["EMPLOYEE_FACING"],
  });

  assert.equal(normalized.toolId, "other");
  assert.equal(normalized.toolFreeText, "Acme AI Workspace");
  assert.deepEqual(normalized.usageContexts, ["EMPLOYEE_FACING"]);
});
