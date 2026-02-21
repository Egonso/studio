import { describe, it, expect } from "vitest";
import {
  evaluateMaturityCompliance,
  determineCurrentMaturityLevel,
  type MaturityLevel,
} from "./maturity-engine";
import type { Register, UseCaseCard } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRegister(overrides: Partial<Register> = {}): Register {
  return {
    registerId: "reg_test",
    name: "Test Register",
    createdAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeUseCase(overrides: Partial<UseCaseCard> = {}): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: `uc_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    purpose: "AI-gestützter Chatbot",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: { isCurrentlyResponsible: true },
    decisionImpact: "NO",
    affectedParties: [],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    toolId: "chatgpt",
    dataCategory: "INTERNAL",
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("maturity-engine", () => {
  const register = makeRegister();

  describe("Level 1 – Basis-Dokumentation", () => {
    it("fails when no use cases exist", () => {
      const result = evaluateMaturityCompliance(register, [], 1);
      expect(result.levelMet).toBe(false);
      expect(result.currentLevel).toBe(0);
      expect(result.actionItems.length).toBeGreaterThan(0);
    });

    it("passes with a complete use case", () => {
      const uc = makeUseCase();
      const result = evaluateMaturityCompliance(register, [uc], 1);
      expect(result.levelMet).toBe(true);
      expect(result.currentLevel).toBe(1);
    });

    it("fails when purpose is missing", () => {
      const uc = makeUseCase({ purpose: "" });
      const result = evaluateMaturityCompliance(register, [uc], 1);
      expect(result.levelMet).toBe(false);
      const gap = result.actionItems.find((c) => c.id === "L1_PURPOSE_COMPLETE");
      expect(gap).toBeDefined();
      expect(gap?.violatingUseCaseIds).toContain(uc.useCaseId);
    });

    it("fails when responsibility is missing", () => {
      const uc = makeUseCase({
        responsibility: { isCurrentlyResponsible: false, responsibleParty: "" },
      });
      const result = evaluateMaturityCompliance(register, [uc], 1);
      expect(result.levelMet).toBe(false);
    });

    it("ignores deleted use cases", () => {
      const uc = makeUseCase({ isDeleted: true });
      const result = evaluateMaturityCompliance(register, [uc], 1);
      expect(result.kpis.activeUseCases).toBe(0);
      expect(result.levelMet).toBe(false); // 0 active = not met
    });
  });

  describe("Level 2 – Erweiterte Governance", () => {
    it("fails when use cases are not reviewed", () => {
      const uc = makeUseCase({ status: "UNREVIEWED" });
      const result = evaluateMaturityCompliance(register, [uc], 2);
      expect(result.currentLevel).toBe(1); // L1 met, L2 not
      const gap = result.actionItems.find((c) => c.id === "L2_ALL_REVIEWED");
      expect(gap).toBeDefined();
    });

    it("passes when all Level 2 criteria met", () => {
      const uc = makeUseCase({
        status: "REVIEWED",
        toolId: "chatgpt",
        dataCategory: "PERSONAL",
      });
      const result = evaluateMaturityCompliance(register, [uc], 2);
      expect(result.currentLevel).toBe(2);
      expect(result.levelMet).toBe(true);
    });

    it("fails when tool info is missing", () => {
      const uc = makeUseCase({
        status: "REVIEWED",
        toolId: undefined,
        toolFreeText: undefined,
        dataCategory: "INTERNAL",
      });
      const result = evaluateMaturityCompliance(register, [uc], 2);
      expect(result.currentLevel).toBeLessThan(2);
    });

    it("flags high-impact unreviewed use cases", () => {
      const uc = makeUseCase({
        decisionImpact: "YES",
        status: "UNREVIEWED",
      });
      const result = evaluateMaturityCompliance(register, [uc], 2);
      const gap = result.actionItems.find((c) => c.id === "L2_HIGH_IMPACT_REVIEWED");
      expect(gap).toBeDefined();
      expect(gap?.violatingUseCaseIds).toContain(uc.useCaseId);
    });
  });

  describe("Level 3 – Audit-Ready", () => {
    it("fails when use cases are not PROOF_READY", () => {
      const uc = makeUseCase({ status: "REVIEWED" });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      expect(result.currentLevel).toBeLessThan(3);
    });

    it("passes when all Level 3 criteria met", () => {
      const uc = makeUseCase({
        status: "PROOF_READY",
        proof: {
          verifyUrl: "https://example.com",
          generatedAt: "2025-01-01T00:00:00Z",
          verification: { isReal: true, isCurrent: true, scope: "full" },
        },
        isPublicVisible: true,
      });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      expect(result.currentLevel).toBe(3);
      expect(result.levelMet).toBe(true);
    });

    it("flags external-facing without proof", () => {
      const uc = makeUseCase({
        status: "REVIEWED",
        usageContexts: ["CUSTOMER_FACING"],
      });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      const gap = result.actionItems.find((c) => c.id === "L3_EXTERNAL_PROOF");
      expect(gap).toBeDefined();
    });

    it("flags v1.1 cards without visibility config", () => {
      const uc = makeUseCase({
        cardVersion: "1.1",
        status: "PROOF_READY",
        proof: {
          verifyUrl: "https://example.com",
          generatedAt: "2025-01-01T00:00:00Z",
          verification: { isReal: true, isCurrent: true, scope: "full" },
        },
        isPublicVisible: undefined,
      });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      const gap = result.actionItems.find((c) => c.id === "L3_VISIBILITY_CONFIGURED");
      expect(gap).toBeDefined();
    });
  });

  describe("KPIs", () => {
    it("computes correct status distribution", () => {
      const ucs = [
        makeUseCase({ status: "UNREVIEWED" }),
        makeUseCase({ status: "UNREVIEWED" }),
        makeUseCase({ status: "REVIEWED" }),
        makeUseCase({ status: "PROOF_READY" }),
      ];
      const result = evaluateMaturityCompliance(register, ucs, 1);
      expect(result.kpis.statusDistribution.UNREVIEWED).toBe(2);
      expect(result.kpis.statusDistribution.REVIEWED).toBe(1);
      expect(result.kpis.statusDistribution.PROOF_READY).toBe(1);
      expect(result.kpis.reviewedCount).toBe(2);
      expect(result.kpis.reviewRate).toBe(0.5);
    });

    it("computes core field coverage", () => {
      const complete = makeUseCase();
      const incomplete = makeUseCase({ purpose: "" });
      const result = evaluateMaturityCompliance(register, [complete, incomplete], 1);
      expect(result.kpis.coreFieldCoverage).toBe(0.5);
    });

    it("counts high impact without review", () => {
      const uc = makeUseCase({ decisionImpact: "YES", status: "UNREVIEWED" });
      const result = evaluateMaturityCompliance(register, [uc], 2);
      expect(result.kpis.highImpactWithoutReview).toBe(1);
    });
  });

  describe("determineCurrentMaturityLevel", () => {
    it("returns 0 for empty register", () => {
      expect(determineCurrentMaturityLevel(register, [])).toBe(0);
    });

    it("returns 3 for fully audit-ready register", () => {
      const uc = makeUseCase({
        status: "PROOF_READY",
        proof: {
          verifyUrl: "https://example.com",
          generatedAt: "2025-01-01T00:00:00Z",
          verification: { isReal: true, isCurrent: true, scope: "full" },
        },
        isPublicVisible: true,
      });
      expect(determineCurrentMaturityLevel(register, [uc])).toBe(3);
    });
  });

  describe("fulfilmentRatio", () => {
    it("is 1.0 when all criteria are met", () => {
      const uc = makeUseCase({
        status: "PROOF_READY",
        proof: {
          verifyUrl: "https://example.com",
          generatedAt: "2025-01-01T00:00:00Z",
          verification: { isReal: true, isCurrent: true, scope: "full" },
        },
        isPublicVisible: true,
      });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      expect(result.fulfilmentRatio).toBe(1);
    });

    it("is between 0 and 1 for partial fulfilment", () => {
      const uc = makeUseCase({ status: "UNREVIEWED" });
      const result = evaluateMaturityCompliance(register, [uc], 3);
      expect(result.fulfilmentRatio).toBeGreaterThan(0);
      expect(result.fulfilmentRatio).toBeLessThan(1);
    });
  });
});
