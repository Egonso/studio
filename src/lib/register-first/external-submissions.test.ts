import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccessCodeSubmissionSnapshot,
  buildExternalSubmissionRecord,
  buildUseCaseFromAccessCodeSubmission,
  buildUseCaseFromSupplierSubmission,
  getExternalSubmissionTitle,
} from "./external-submissions";

test("buildExternalSubmissionRecord keeps immutable provenance fields", () => {
  const submission = buildExternalSubmissionRecord({
    submissionId: "extsub_1",
    registerId: "reg_123",
    ownerId: "owner_456",
    sourceType: "supplier_request",
    requestTokenId: "srt_abc123",
    submittedByName: "vendor@example.com",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-12T10:00:00.000Z",
    rawPayloadSnapshot: {
      supplierEmail: "vendor@example.com",
      toolName: "SuperAgent AI",
      purpose: "First-level support",
      dataCategory: "PERSONAL_DATA",
    },
  });

  assert.equal(submission.submissionId, "extsub_1");
  assert.equal(submission.sourceType, "supplier_request");
  assert.equal(submission.requestTokenId, "srt_abc123");
  assert.equal(submission.status, "submitted");
});

test("buildUseCaseFromSupplierSubmission links back to immutable submission", () => {
  const submission = buildExternalSubmissionRecord({
    submissionId: "extsub_2",
    registerId: "reg_123",
    ownerId: "owner_456",
    sourceType: "supplier_request",
    requestTokenId: "srt_abc123",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-12T10:00:00.000Z",
    rawPayloadSnapshot: {
      supplierEmail: "vendor@example.com",
      toolName: "SuperAgent AI",
      purpose: "First-level support",
      dataCategory: "PERSONAL_DATA",
      aiActCategory: "Geringes Risiko",
    },
  });

  const card = buildUseCaseFromSupplierSubmission({
    useCaseId: "uc_supplier_1",
    registerId: "reg_123",
    ownerId: "owner_456",
    organisationName: "Muster GmbH",
    requestTokenId: "srt_abc123",
    submission,
    now: new Date("2026-03-12T10:00:00.000Z"),
  });

  assert.equal(card.externalIntake?.submissionId, "extsub_2");
  assert.equal(card.externalIntake?.requestTokenId, "srt_abc123");
  assert.equal(card.externalIntake?.sourceType, "supplier_request");
  assert.equal(card.origin?.source, "supplier_request");
  assert.equal(card.origin?.submittedByEmail, "vendor@example.com");
  assert.equal(card.origin?.sourceRequestId, "extsub_2");
});

test("buildUseCaseFromSupplierSubmission preserves multisystem supplier snapshots", () => {
  const submission = buildExternalSubmissionRecord({
    submissionId: "extsub_supplier_multi",
    registerId: "reg_123",
    ownerId: "owner_456",
    sourceType: "supplier_request",
    requestTokenId: "srt_abc123",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-12T10:00:00.000Z",
    rawPayloadSnapshot: {
      supplierEmail: "vendor@example.com",
      toolName: "Perplexity API",
      purpose: "Marketing-Newsletter vorbereiten",
      dataCategory: "PERSONAL_DATA",
      workflow: {
        additionalSystems: [
          {
            entryId: "supplier_system_2",
            position: 2,
            toolId: "other",
            toolFreeText: "Gemini API",
          },
          {
            entryId: "supplier_system_3",
            position: 3,
            toolId: "other",
            toolFreeText: "Sora",
          },
        ],
        connectionMode: "SEMI_AUTOMATED",
        summary: "Recherche -> Text -> Bild",
      },
    },
  });

  const card = buildUseCaseFromSupplierSubmission({
    useCaseId: "uc_supplier_multi",
    registerId: "reg_123",
    ownerId: "owner_456",
    organisationName: "Muster GmbH",
    requestTokenId: "srt_abc123",
    submission,
    now: new Date("2026-03-12T10:00:00.000Z"),
  });

  assert.equal(card.toolFreeText, "Perplexity API");
  assert.equal(card.workflow?.connectionMode, "SEMI_AUTOMATED");
  assert.equal(card.workflow?.additionalSystems.length, 2);
  assert.equal(card.workflow?.additionalSystems[1].toolFreeText, "Sora");
});

test("buildUseCaseFromSupplierSubmission keeps new supplier dataCategories snapshots readable", () => {
  const submission = buildExternalSubmissionRecord({
    submissionId: "extsub_supplier_data_categories",
    registerId: "reg_123",
    ownerId: "owner_456",
    sourceType: "supplier_request",
    requestTokenId: "srt_abc123",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-12T10:00:00.000Z",
    rawPayloadSnapshot: {
      supplierEmail: "vendor@example.com",
      toolName: "Perplexity API",
      purpose: "Marketing-Newsletter vorbereiten",
      dataCategories: ["SPECIAL_PERSONAL"],
      aiActCategory: "Geringes Risiko",
    },
  });

  const card = buildUseCaseFromSupplierSubmission({
    useCaseId: "uc_supplier_data_categories",
    registerId: "reg_123",
    ownerId: "owner_456",
    organisationName: "Muster GmbH",
    requestTokenId: "srt_abc123",
    submission,
    now: new Date("2026-03-12T10:00:00.000Z"),
  });

  assert.equal(card.dataCategory, "SPECIAL_PERSONAL");
  assert.deepEqual(card.dataCategories, [
    "SPECIAL_PERSONAL",
    "PERSONAL_DATA",
  ]);
});

test("getExternalSubmissionTitle fasst Mehrsystem-Einreichungen kompakt zusammen", () => {
  const submission = buildExternalSubmissionRecord({
    submissionId: "extsub_title_1",
    registerId: "reg_123",
    ownerId: "owner_456",
    sourceType: "supplier_request",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-12T10:00:00.000Z",
    rawPayloadSnapshot: {
      supplierEmail: "vendor@example.com",
      toolName: "Perplexity API",
      purpose: "Marketing-Newsletter vorbereiten",
      dataCategory: "PERSONAL_DATA",
      workflow: {
        additionalSystems: [
          {
            entryId: "supplier_system_2",
            position: 2,
            toolId: "other",
            toolFreeText: "Gemini API",
          },
          {
            entryId: "supplier_system_3",
            position: 3,
            toolId: "other",
            toolFreeText: "Sora",
          },
        ],
      },
    },
  });

  assert.equal(
    getExternalSubmissionTitle(submission),
    "Perplexity API +2: Marketing-Newsletter vorbereiten"
  );
});

test("buildUseCaseFromAccessCodeSubmission keeps submission and code provenance", () => {
  const snapshot = buildAccessCodeSubmissionSnapshot({
    purpose: "Copilot fuer HR",
    toolId: "copilot",
    workflow: {
      additionalSystems: [
        {
          entryId: "step_2",
          position: 2,
          toolId: "Gemini API",
        },
      ],
      connectionMode: "SEMI_AUTOMATED",
      summary: "Copilot -> Gemini API",
    },
    usageContexts: ["EMPLOYEES", "APPLICANTS"],
    dataCategories: ["PERSONAL_DATA", "SPECIAL_PERSONAL", "HEALTH_DATA"],
    decisionInfluence: "PREPARATION",
    ownerRole: "HR Lead",
    contactPersonName: "Jane Doe",
  });

  const card = buildUseCaseFromAccessCodeSubmission({
    useCaseId: "uc_access_1",
    registerId: "reg_123",
    ownerId: "owner_456",
    accessCode: "AI-ABC123",
    accessCodeLabel: "Onboarding",
    submissionId: "extsub_3",
    snapshot,
    now: new Date("2026-03-12T10:00:00.000Z"),
  });

  assert.equal(card.externalIntake?.submissionId, "extsub_3");
  assert.equal(card.externalIntake?.accessCodeId, "AI-ABC123");
  assert.equal(card.externalIntake?.sourceType, "access_code");
  assert.equal(card.origin?.source, "access_code");
  assert.equal(card.origin?.submittedByName, "Jane Doe");
  assert.equal(card.origin?.sourceRequestId, "extsub_3");
  assert.equal(card.workflow?.connectionMode, "SEMI_AUTOMATED");
  assert.equal(card.workflow?.additionalSystems.length, 1);
});
