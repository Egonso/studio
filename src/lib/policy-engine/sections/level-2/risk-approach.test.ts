import assert from "node:assert/strict";
import test from "node:test";

import { riskApproachSection } from "./05-risk-approach";
import type { PolicyContext } from "../../types";
import type { UseCaseCard } from "@/lib/register-first/types";

function createBaseUseCase(
  useCaseId: string,
  aiActCategory: string | null
): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId,
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    purpose: `Use Case ${useCaseId}`,
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: "Ops",
    },
    decisionImpact: "YES",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    governanceAssessment: {
      core: {
        aiActCategory,
      },
      flex: {},
    },
  };
}

function createContext(useCases: UseCaseCard[]): PolicyContext {
  return {
    register: {
      registerId: "reg_risk_approach",
      name: "Risk Approach",
      createdAt: "2026-02-20T10:00:00.000Z",
      organisationName: "EUKI Test Organisation",
      orgSettings: {
        organisationName: "EUKI Test Organisation",
        industry: "Software",
        contactPerson: {
          name: "Test Owner",
          email: "owner@example.com",
        },
      },
    },
    useCases,
    orgSettings: {
      organisationName: "EUKI Test Organisation",
      industry: "Software",
      contactPerson: {
        name: "Test Owner",
        email: "owner@example.com",
      },
    },
    level: 2,
  };
}

test("riskApproachSection normalizes legacy labels into canonical risk categories", () => {
  const context = createContext([
    createBaseUseCase("uc_high", "Hohes Risiko"),
    createBaseUseCase("uc_limited", "Begrenztes Risiko"),
    createBaseUseCase("uc_minimal", "Minimales Risiko"),
    createBaseUseCase("uc_unassessed", null),
  ]);

  const content = riskApproachSection.buildContent(context);

  assert.match(content, /\| Hochrisiko \| 1 \|/);
  assert.match(content, /\| Begrenztes Risiko \(Transparenzpflichten\) \| 1 \|/);
  assert.match(content, /\| Minimales Risiko \| 1 \|/);
  assert.match(content, /\| Noch nicht eingestuft \| 1 \|/);
  assert.match(content, /mit begrenztem Risiko \(Transparenzpflichten\)/);
});
