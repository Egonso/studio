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

test("normalizeSharedCaptureFields resolves multiple systems into primary tool plus workflow when enabled", () => {
  const normalized = normalizeSharedCaptureFields(
    {
      purpose: "Newsletter vorbereiten",
      ownerRole: "Marketing Lead",
      systems: [
        {
          entryId: "s1",
          toolId: "Perplexity API",
        },
        {
          entryId: "s2",
          toolId: "Gemini API",
        },
        {
          entryId: "s3",
          toolFreeText: "Interner Bild-Webhook",
        },
      ],
      workflowConnectionMode: "SEMI_AUTOMATED",
      workflowSummary: "Recherche -> Text -> Bild",
      usageContexts: ["INTERNAL_ONLY"],
    },
    {
      multisystemEnabled: true,
    }
  );

  assert.equal(normalized.toolId, "Perplexity API");
  assert.equal(normalized.toolFreeText, undefined);
  assert.equal(normalized.orderedSystems.length, 3);
  assert.equal(normalized.workflow?.connectionMode, "SEMI_AUTOMATED");
  assert.equal(normalized.workflow?.summary, "Recherche -> Text -> Bild");
  assert.deepEqual(normalized.workflow?.additionalSystems, [
    {
      entryId: "s2",
      position: 2,
      toolId: "Gemini API",
      toolFreeText: undefined,
    },
    {
      entryId: "s3",
      position: 3,
      toolId: "other",
      toolFreeText: "Interner Bild-Webhook",
    },
  ]);
});

test("normalizeSharedCaptureFields ignores workflow metadata when multisystem capture is disabled", () => {
  const normalized = normalizeSharedCaptureFields({
    purpose: "Newsletter vorbereiten",
    ownerRole: "Marketing Lead",
    systems: [
      {
        entryId: "s1",
        toolId: "Perplexity API",
      },
      {
        entryId: "s2",
        toolId: "Gemini API",
      },
    ],
    workflowConnectionMode: "FULLY_AUTOMATED",
    workflowSummary: "Soll ignoriert werden",
    usageContexts: ["INTERNAL_ONLY"],
  });

  assert.equal(normalized.toolId, undefined);
  assert.equal(normalized.workflow, undefined);
  assert.deepEqual(normalized.orderedSystems, []);
});
