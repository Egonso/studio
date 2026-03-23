import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRegulatoryExposure } from "./ai-act-exposure";
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
        oversightDefined: false,
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
      trustPortalActive: false,
    },
  };
}

test("evaluateRegulatoryExposure recognizes legacy high-risk labels via taxonomy", () => {
  const context = createContext([
    createBaseUseCase("uc_high_legacy", "Hohes Risiko"),
  ]);

  const result = evaluateRegulatoryExposure(context);

  assert.equal(result.index, 60);
  assert.equal(result.actions.length, 2);
  assert.equal(result.actions[0]?.severity, "critical");
  assert.equal(result.actions[1]?.type, "human_oversight_missing");
});

test("evaluateRegulatoryExposure recognizes prohibited legacy labels via taxonomy", () => {
  const context = createContext([
    createBaseUseCase("uc_prohibited_legacy", "Unannehmbares Risiko"),
  ]);

  const result = evaluateRegulatoryExposure(context);

  assert.equal(result.index, 100);
  assert.equal(result.actions.length, 1);
  assert.match(result.actions[0]?.title ?? "", /Verbotenes KI-System erkannt/);
  assert.equal(result.actions[0]?.severity, "critical");
});
