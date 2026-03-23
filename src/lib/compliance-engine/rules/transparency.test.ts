import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTransparency } from "./transparency";
import type { EngineContext } from "../types";
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

function createContext(useCases: UseCaseCard[]): EngineContext {
  return {
    useCases,
    orgStatus: {
      hasPolicy: false,
      hasIncidentProcess: false,
      hasRaciDefined: false,
      trustPortalActive: true,
    },
  };
}

test("evaluateTransparency ignores recognized legacy aliases and counts only unassessed use cases", () => {
  const context = createContext([
    createBaseUseCase("uc_limited_legacy", "Begrenztes Risiko"),
    createBaseUseCase("uc_unknown", "Unbekannt"),
    createBaseUseCase("uc_missing", null),
  ]);

  const result = evaluateTransparency(context);

  assert.equal(result.index, 80);
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0]?.type, "use_cases_uncategorized");
  assert.match(result.actions[0]?.title ?? "", /2 Systeme/);
});
