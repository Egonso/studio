import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { evaluateControlUpgradeTriggers } from "@/lib/control/triggers";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

function createBaseUseCase(useCaseId: string): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId,
    createdAt: "2025-01-10T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    purpose: `Use Case ${useCaseId}`,
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: null,
    },
    decisionImpact: "YES",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  };
}

function createOrgSettings(): OrgSettings {
  return {
    organisationName: "EUKI Test Organisation",
    industry: "Education",
    contactPerson: {
      name: "Test",
      email: "test@example.com",
    },
  };
}

export function runTriggersSmoke() {
  const now = new Date("2026-02-27T12:00:00.000Z");

  const useCases: UseCaseCard[] = Array.from({ length: 11 }).map((_, index) => ({
    ...createBaseUseCase(`uc_trigger_${index + 1}`),
    governanceAssessment: {
      core: {
        aiActCategory: index === 0 ? "Hohes Risiko" : "Minimales Risiko",
      },
      flex: {
        iso: {
          reviewCycle: "monthly",
          oversightModel: index === 0 ? "unknown" : "HITL",
          documentationLevel: "unknown",
          lifecycleStatus: "active",
          lastReviewedAt: "2025-01-10T10:00:00.000Z",
        },
      },
    },
    usageContexts:
      index < 2
        ? ["CUSTOMERS"]
        : index < 4
          ? ["PUBLIC"]
          : ["INTERNAL_ONLY"],
  }));

  const decision = evaluateControlUpgradeTriggers(useCases, createOrgSettings(), now);

  assert.equal(decision.shouldPrompt, true);
  assert.equal(decision.message, "Sie dokumentieren. Jetzt sollten Sie steuern.");
  assert.equal(decision.ctaLabel, "Governance professionalisieren");

  const ids = decision.triggers.map((trigger) => trigger.id);
  assert.ok(ids.includes("use_cases_over_ten"));
  assert.ok(ids.includes("review_overdue"));
  assert.ok(ids.includes("high_risk_without_oversight"));
  assert.ok(ids.includes("iso_readiness_below_70"));
  assert.ok(ids.includes("external_stakeholder_proof_needed"));

  console.log("Control trigger-engine smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runTriggersSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
