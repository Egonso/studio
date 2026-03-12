import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccessCodeSubmissionSnapshot,
  buildExternalSubmissionRecord,
  buildUseCaseFromAccessCodeSubmission,
  buildUseCaseFromSupplierSubmission,
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

test("buildUseCaseFromAccessCodeSubmission keeps submission and code provenance", () => {
  const snapshot = buildAccessCodeSubmissionSnapshot({
    purpose: "Copilot fuer HR",
    toolId: "copilot",
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
});
