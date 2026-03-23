import assert from "node:assert/strict";
import test from "node:test";

import { highRiskSection } from "./10-highRisk";
import { transparencySection } from "./11-transparency";
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
      registerId: "reg_risk_sections",
      name: "Risk Sections",
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
    level: 3,
  };
}

test("highRiskSection includes legacy high-risk labels and normalizes category display", () => {
  const context = createContext([
    createBaseUseCase("uc_high_section", "Hohes Risiko"),
  ]);

  assert.equal(highRiskSection.shouldInclude(context), true);

  const content = highRiskSection.buildContent(context);
  assert.match(content, /Kategorie: Hochrisiko/);
});

test("transparencySection includes limited-risk aliases and normalizes category display", () => {
  const context = createContext([
    createBaseUseCase("uc_limited_section", "Begrenztes Risiko"),
  ]);

  assert.equal(transparencySection.shouldInclude(context), true);

  const content = transparencySection.buildContent(context);
  assert.match(content, /Kategorie: Begrenztes Risiko/);
});
