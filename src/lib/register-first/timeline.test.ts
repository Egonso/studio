import assert from "node:assert/strict";
import test from "node:test";

import { buildUseCaseTimeline, createManualEditEvent } from "./timeline";
import type { ExternalSubmission, UseCaseCard } from "./types";

function createBaseCard(overrides: Partial<UseCaseCard> = {}): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: "uc_timeline_1",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
    purpose: "Vertragsanalyse",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: "Legal Ops",
      contactPersonName: null,
    },
    decisionImpact: "UNSURE",
    affectedParties: [],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    ...overrides,
  };
}

test("buildUseCaseTimeline merges provenance, edits, reviews, proof and submission decisions", () => {
  const beforeEdit = createBaseCard({
    origin: {
      source: "supplier_request",
      submittedByName: "Vendor GmbH",
      submittedByEmail: "vendor@example.com",
      sourceRequestId: "sub_123",
      capturedByUserId: null,
    },
    externalIntake: {
      source: "SUPPLIER_REQUEST_LINK",
      sourceType: "supplier_request",
      submittedAt: "2026-03-10T08:30:00.000Z",
      registerId: "reg_1",
      submissionId: "sub_123",
      submittedByName: "Vendor GmbH",
      submittedByEmail: "vendor@example.com",
    },
  });

  const afterEdit = createBaseCard({
    ...beforeEdit,
    updatedAt: "2026-03-10T10:00:00.000Z",
    purpose: "Vertragsanalyse mit KI-Vorprüfung",
  });

  const manualEdit = createManualEditEvent({
    before: beforeEdit,
    after: afterEdit,
    editedAt: "2026-03-10T10:00:00.000Z",
    editedBy: "user_editor",
    editedByName: "Lea Review",
  });

  assert.ok(manualEdit);

  const card = createBaseCard({
    ...afterEdit,
    status: "PROOF_READY",
    reviews: [
      {
        reviewId: "review_1",
        reviewedAt: "2026-03-10T11:00:00.000Z",
        reviewedBy: "user_reviewer",
        nextStatus: "REVIEWED",
        notes: "Freigabe nach Sichtung",
      },
    ],
    statusHistory: [
      {
        from: "UNREVIEWED",
        to: "REVIEWED",
        changedAt: "2026-03-10T11:00:00.000Z",
        changedBy: "user_reviewer",
        changedByName: "Lea Review",
        reason: "Freigabe nach Sichtung",
      },
    ],
    manualEdits: [manualEdit!],
    proof: {
      verifyUrl: "https://example.com/verify/uc_timeline_1",
      generatedAt: "2026-03-10T12:00:00.000Z",
      verification: {
        isReal: true,
        isCurrent: true,
        scope: "Lieferantenunterlagen",
      },
    },
    sealedAt: "2026-03-10T13:00:00.000Z",
    sealedBy: "officer_1",
    sealedByName: "EUKI Officer",
    sealHash: "seal_123",
  });

  const submission: ExternalSubmission = {
    submissionId: "sub_123",
    registerId: "reg_1",
    ownerId: "owner_1",
    sourceType: "supplier_request",
    requestTokenId: "token_1",
    accessCodeId: null,
    submittedByName: "Vendor GmbH",
    submittedByEmail: "vendor@example.com",
    submittedAt: "2026-03-10T08:30:00.000Z",
    rawPayloadSnapshot: { purpose: "Vertragsanalyse" },
    status: "approved",
    linkedUseCaseId: "uc_timeline_1",
    reviewedAt: "2026-03-10T14:00:00.000Z",
    reviewedBy: "user_reviewer",
    reviewNote: "Für KMU automatisch übernommen",
  };

  const timeline = buildUseCaseTimeline({ card, submission });

  assert.deepEqual(
    timeline.map((event) => event.kind),
    ["external_submission", "seal", "proof", "review", "manual_edit", "created", "origin"]
  );
  assert.equal(
    timeline.find((event) => event.kind === "origin")?.description,
    "Von Vendor GmbH <vendor@example.com> · Referenz sub_123"
  );
  assert.equal(
    timeline.find((event) => event.kind === "manual_edit")?.description,
    "Zweck"
  );
  assert.equal(
    timeline.find((event) => event.kind === "review")?.actor,
    "Internes Team",
  );
  assert.equal(
    timeline.find((event) => event.kind === "created")?.actor,
    "Lieferanteneinreichung",
  );
  assert.equal(
    timeline.some((event) => event.kind === "status_change"),
    false
  );
});

test("buildUseCaseTimeline tolerates legacy cards without statusHistory", () => {
  const card = createBaseCard({
    origin: {
      source: "manual",
      submittedByName: null,
      submittedByEmail: null,
      sourceRequestId: null,
      capturedByUserId: "user_manual",
    },
  });

  const timeline = buildUseCaseTimeline({ card });

  assert.deepEqual(
    timeline.map((event) => event.kind),
    ["origin", "created"]
  );
  assert.equal(timeline[0]?.actor, "Internes Team");
});

test("manual edit labels stay customer-friendly and deduplicated", () => {
  const beforeEdit = createBaseCard({
    decisionImpact: "UNSURE",
    decisionInfluence: "PREPARATION",
    governanceAssessment: {
      core: {},
      flex: {},
    },
  });

  const afterEdit = createBaseCard({
    ...beforeEdit,
    decisionImpact: "YES",
    decisionInfluence: "AUTOMATED",
    governanceAssessment: {
      core: {
        aiActCategory: "hochrisiko",
      },
      flex: {},
    },
  });

  const manualEdit = createManualEditEvent({
    before: beforeEdit,
    after: afterEdit,
    editedAt: "2026-03-10T10:00:00.000Z",
    editedBy: "user_editor",
  });

  const timeline = buildUseCaseTimeline({
    card: createBaseCard({
      ...afterEdit,
      manualEdits: manualEdit ? [manualEdit] : [],
    }),
  });

  assert.equal(
    timeline.find((event) => event.kind === "manual_edit")?.description,
    "Entscheidungsrelevanz, Entscheidungseinfluss, KI-Risikoklasse",
  );
});
