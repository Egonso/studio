import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureV1_1Shape,
  normalizeUseCaseCardRecord,
} from "./migration";

test("normalizeUseCaseCardRecord repairs broken legacy supplier records without dropping provenance", () => {
  const normalized = normalizeUseCaseCardRecord({
    cardVersion: "1.2",
    useCaseId: "uc_supplier_legacy",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
    purpose: "Support-Antworten vorbereiten",
    usageContexts: ["EXTERNAL_PUBLIC"],
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: "vendor@example.com",
    },
    status: "draft",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    labels: [{ key: "source", value: "supplier_request" }],
    capturedBy: "SUPPLIER_REQUEST",
    capturedByName: "vendor@example.com",
    toolName: "Vendor Copilot",
    dataCategory: "SENSITIVE",
  }) as Record<string, unknown>;

  assert.equal(normalized.cardVersion, "1.1");
  assert.equal(normalized.status, "UNREVIEWED");
  assert.deepEqual(normalized.usageContexts, ["INTERNAL_ONLY"]);
  assert.equal(normalized.toolId, "other");
  assert.equal(normalized.toolFreeText, "Vendor Copilot");
  assert.equal(normalized.dataCategory, "SPECIAL_PERSONAL");
  assert.deepEqual(normalized.dataCategories, ["SPECIAL_PERSONAL"]);
  assert.deepEqual(normalized.origin, {
    source: "supplier_request",
    submittedByName: "vendor@example.com",
    submittedByEmail: "vendor@example.com",
    sourceRequestId: null,
    capturedByUserId: null,
  });
});

test("ensureV1_1Shape upgrades legacy cards to canonical export-ready shape", () => {
  const shaped = ensureV1_1Shape({
    cardVersion: "1.0",
    useCaseId: "uc_legacy_1",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
    purpose: "Interne Wissenssuche",
    usageContexts: ["CUSTOMER_FACING"],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: null,
      contactPersonName: null,
    },
    decisionImpact: "NO",
    affectedParties: [],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  });

  assert.equal(shaped.cardVersion, "1.1");
  assert.equal(shaped.formatVersion, "v1.1");
  assert.ok(shaped.globalUseCaseId);
  assert.ok(shaped.publicHashId);
  assert.deepEqual(shaped.usageContexts, ["CUSTOMERS"]);
  assert.equal(shaped.dataCategory, "INTERNAL_CONFIDENTIAL");
  assert.deepEqual(shaped.dataCategories, ["INTERNAL_CONFIDENTIAL"]);
  assert.equal(shaped.origin?.source, "manual");
});

test("normalizeUseCaseCardRecord keeps workflow data canonical and ordered", () => {
  const normalized = normalizeUseCaseCardRecord({
    cardVersion: "1.2",
    useCaseId: "uc_workflow_legacy",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
    purpose: "Themen recherchieren und zusammenfassen",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
    },
    decisionImpact: "NO",
    status: "draft",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    toolId: "perplexity_api",
    workflow: {
      additionalSystems: [
        {
          entryId: "step_3",
          position: 8,
          toolFreeText: "Interner Freigabe-Service",
        },
        {
          entryId: "step_2",
          position: 3,
          toolId: "gemini_api",
        },
      ],
      connectionMode: "semi_automated",
      summary: "  Recherche -> Draft -> Review  ",
    },
  }) as Record<string, unknown>;

  assert.deepEqual(normalized.workflow, {
    additionalSystems: [
      {
        entryId: "step_2",
        position: 2,
        toolId: "gemini_api",
        toolFreeText: undefined,
      },
      {
        entryId: "step_3",
        position: 3,
        toolId: "other",
        toolFreeText: "Interner Freigabe-Service",
      },
    ],
    connectionMode: "SEMI_AUTOMATED",
    summary: "Recherche -> Draft -> Review",
  });
});
