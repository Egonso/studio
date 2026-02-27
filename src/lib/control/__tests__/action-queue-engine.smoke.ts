import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import type { UseCaseCard } from "@/lib/register-first/types";
import { isControlFocusTarget } from "@/lib/control/deep-link";
import { buildControlActionQueue } from "../action-queue-engine";

function createBaseUseCase(useCaseId: string): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId,
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    purpose: "Einsatzfall fuer Action Queue",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
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

export function runActionQueueEngineSmoke() {
  const now = new Date("2026-02-26T12:00:00.000Z");

  const highRiskGap: UseCaseCard = {
    ...createBaseUseCase("uc_high_risk_gap"),
    purpose: "Hochrisiko-System ohne Aufsicht",
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: null,
    },
    governanceAssessment: {
      core: {
        aiActCategory: "Hochrisiko",
        oversightDefined: false,
        reviewCycleDefined: false,
      },
      flex: {
        policyLinks: [],
        iso: {
          reviewCycle: "unknown",
          oversightModel: "unknown",
          documentationLevel: "unknown",
          lifecycleStatus: "active",
          nextReviewAt: "2026-02-01T10:00:00.000Z",
        },
      },
    },
  };

  const policyGap: UseCaseCard = {
    ...createBaseUseCase("uc_policy_gap"),
    purpose: "System ohne Policy-Mapping",
    updatedAt: "2026-02-15T10:00:00.000Z",
    governanceAssessment: {
      core: {
        aiActCategory: "Minimales Risiko",
        oversightDefined: true,
        reviewCycleDefined: true,
      },
      flex: {
        policyLinks: [],
        iso: {
          reviewCycle: "quarterly",
          oversightModel: "HITL",
          documentationLevel: "standard",
          lifecycleStatus: "active",
          nextReviewAt: "2026-03-05T10:00:00.000Z",
        },
      },
    },
    reviews: [
      {
        reviewId: "review-1",
        reviewedAt: "2026-02-20T10:00:00.000Z",
        reviewedBy: "owner-1",
        nextStatus: "REVIEWED",
      },
    ],
  };

  const queue = buildControlActionQueue([highRiskGap, policyGap], now);

  assert.ok(queue.length >= 5, "Queue should provide at least five items with fallback.");
  assert.ok(queue.length <= 10, "Queue must not exceed ten items.");
  assert.equal(queue[0]?.focus, "oversight");
  assert.match(queue[0]?.deepLink ?? "", /^\/my-register\/[^?]+\?focus=oversight$/);

  for (const recommendation of queue) {
    assert.ok(isControlFocusTarget(recommendation.focus));
    assert.match(
      recommendation.deepLink,
      /^\/my-register\/[^?]+\?focus=(owner|review|oversight|policy|audit)$/
    );
    assert.ok(recommendation.problem.length > 0);
    assert.ok(recommendation.impact.length > 0);
    assert.ok(recommendation.recommendedAction.length > 0);
  }

  console.log("Control action-queue engine smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runActionQueueEngineSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

