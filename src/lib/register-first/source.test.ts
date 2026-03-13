import assert from "node:assert/strict";
import test from "node:test";

import {
  getUseCaseSource,
  getUseCaseSourceBadges,
  getUseCaseSourceLabel,
  getUseCaseSubmitterIdentity,
  matchesUseCaseSourceFilter,
} from "./source";
import type { UseCaseCard } from "./types";

function createBaseCard(overrides: Partial<UseCaseCard> = {}): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: "uc_source_1",
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

test("supplier records expose canonical badges and combined submitter identity", () => {
  const card = createBaseCard({
    status: "REVIEW_RECOMMENDED",
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
      submittedAt: "2026-03-10T08:45:00.000Z",
      registerId: "reg_1",
      submissionId: "sub_123",
      submittedByName: "Vendor GmbH",
      submittedByEmail: "vendor@example.com",
    },
    capturedBy: "SUPPLIER_REQUEST",
  });

  assert.equal(getUseCaseSource(card), "supplier_request");
  assert.equal(
    getUseCaseSubmitterIdentity(card),
    "Vendor GmbH <vendor@example.com>"
  );
  assert.deepEqual(
    getUseCaseSourceBadges(card).map((badge) => badge.key),
    ["EXTERN", "LIEFERANT", "REVIEW_NOETIG"]
  );
  assert.equal(matchesUseCaseSourceFilter(card, "LIEFERANT"), true);
  assert.equal(matchesUseCaseSourceFilter(card, "EXTERN"), true);
  assert.equal(matchesUseCaseSourceFilter(card, "MANUELL"), false);
});

test("manual and access-code records resolve distinct source labels and filters", () => {
  const manualCard = createBaseCard({
    capturedByName: "Anna Team",
    origin: {
      source: "manual",
      submittedByName: null,
      submittedByEmail: null,
      sourceRequestId: null,
      capturedByUserId: "user_anna",
    },
  });
  const accessCodeCard = createBaseCard({
    origin: {
      source: "access_code",
      submittedByName: "Max Mustermann",
      submittedByEmail: "max@example.com",
      sourceRequestId: "code_123",
      capturedByUserId: "user_team",
    },
    externalIntake: {
      source: "ACCESS_CODE",
      sourceType: "access_code",
      submittedAt: "2026-03-10T08:45:00.000Z",
      registerId: "reg_1",
      accessCodeId: "code_123",
      submittedByName: "Max Mustermann",
      submittedByEmail: "max@example.com",
    },
    capturedViaCode: true,
  });

  assert.equal(getUseCaseSourceLabel(getUseCaseSource(manualCard)), "Manuell");
  assert.equal(getUseCaseSubmitterIdentity(manualCard), "Anna Team");
  assert.equal(matchesUseCaseSourceFilter(manualCard, "MANUELL"), true);

  const opaqueManualCard = createBaseCard({
    origin: {
      source: "manual",
      submittedByName: null,
      submittedByEmail: null,
      sourceRequestId: null,
      capturedByUserId: "cnqqywNvMbV5CJH6ZRS29I7yNFl1",
    },
  });

  assert.equal(getUseCaseSubmitterIdentity(opaqueManualCard), null);

  assert.equal(getUseCaseSourceLabel(getUseCaseSource(accessCodeCard)), "Zugangscode");
  assert.equal(
    getUseCaseSubmitterIdentity(accessCodeCard),
    "Max Mustermann <max@example.com>"
  );
  assert.equal(matchesUseCaseSourceFilter(accessCodeCard, "ZUGANGSCODE"), true);
});
