import assert from "node:assert/strict";
import test from "node:test";
import type { RegisterAccessCode, UseCaseCard } from "@/lib/register-first/types";
import {
  resolveOwnedCaptureCode,
  submitOwnedCaptureCode,
} from "./client-fallback";

function createAccessCode(overrides: Partial<RegisterAccessCode> = {}): RegisterAccessCode {
  return {
    code: "AI-ABC123",
    registerId: "reg_1",
    ownerId: "owner_1",
    createdAt: "2026-03-07T10:00:00.000Z",
    expiresAt: null,
    label: "Onboarding",
    usageCount: 0,
    isActive: true,
    ...overrides,
  };
}

function createUseCaseCard(): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: "uc_1",
    globalUseCaseId: "global_uc_1",
    publicHashId: "hash_1",
    createdAt: "2026-03-07T10:00:00.000Z",
    updatedAt: "2026-03-07T10:00:00.000Z",
    purpose: "Testfall",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: "HR Lead",
      contactPersonName: "Jane Doe",
    },
    decisionImpact: "UNSURE",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  };
}

test("resolveOwnedCaptureCode returns owner fallback info for active owned code", async () => {
  const result = await resolveOwnedCaptureCode("AI-ABC123", {
    getCurrentUserId: async () => "owner_1",
    getCodeDoc: async () => createAccessCode(),
    getRegisterSummary: async () => ({ organisationName: "EUKI Test GmbH" }),
    now: () => new Date("2026-03-07T12:00:00.000Z"),
  });

  assert.deepEqual(result, {
    code: "AI-ABC123",
    registerId: "reg_1",
    label: "Onboarding",
    organisationName: "EUKI Test GmbH",
  });
});

test("resolveOwnedCaptureCode rejects expired or foreign codes", async () => {
  const expired = await resolveOwnedCaptureCode("AI-ABC123", {
    getCurrentUserId: async () => "owner_1",
    getCodeDoc: async () =>
      createAccessCode({ expiresAt: "2026-03-06T10:00:00.000Z" }),
    getRegisterSummary: async () => ({ organisationName: "EUKI Test GmbH" }),
    now: () => new Date("2026-03-07T12:00:00.000Z"),
  });
  assert.equal(expired, null);

  const foreign = await resolveOwnedCaptureCode("AI-ABC123", {
    getCurrentUserId: async () => "owner_1",
    getCodeDoc: async () => createAccessCode({ ownerId: "other_owner" }),
    getRegisterSummary: async () => ({ organisationName: "EUKI Test GmbH" }),
    now: () => new Date("2026-03-07T12:00:00.000Z"),
  });
  assert.equal(foreign, null);
});

test("submitOwnedCaptureCode creates a use case and increments usage count", async () => {
  let capturedPayload: unknown = null;
  let incrementedCode: string | null = null;

  const card = await submitOwnedCaptureCode(
    {
      code: "AI-ABC123",
      registerId: "reg_1",
      accessCodeLabel: "Onboarding",
      purpose: "Copilot für HR",
      toolId: "copilot",
      usageContext: "EMPLOYEES",
      dataCategory: "NONE",
      ownerRole: "HR Lead",
      contactPersonName: "Jane Doe",
    },
    {
      createUseCase: async (payload) => {
        capturedPayload = payload;
        return createUseCaseCard();
      },
      incrementUsageCount: async (code) => {
        incrementedCode = code;
      },
    }
  );

  assert.equal(card.useCaseId, "uc_1");
  assert.deepEqual(capturedPayload, {
    purpose: "Copilot für HR",
    usageContexts: ["EMPLOYEES"],
    isCurrentlyResponsible: false,
    responsibleParty: "HR Lead",
    contactPersonName: "Jane Doe",
    decisionImpact: "UNSURE",
    toolId: "copilot",
    toolFreeText: undefined,
    dataCategory: "NONE",
    organisation: undefined,
  });
  assert.equal(incrementedCode, "AI-ABC123");
});
