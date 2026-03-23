import assert from "node:assert/strict";
import test from "node:test";

import type { UseCaseCard } from "@/lib/register-first/types";
import {
  buildDraftAssessmentRequestPayload,
  buildRiskReviewAssessmentPayload,
  buildRiskReviewLaunchContext,
  buildRiskReviewLaunchContextFromUseCase,
  createInitialRiskReviewFormState,
  shouldShowGovernanceReviewStep,
} from "./use-case-assessment-wizard-model";

function createBaseUseCase(overrides: Partial<UseCaseCard> = {}): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: "uc_review_flow",
    createdAt: "2026-03-23T10:00:00.000Z",
    updatedAt: "2026-03-23T10:00:00.000Z",
    purpose: "Interne KI-Unterstuetzung",
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: "Ops",
    },
    decisionImpact: "NO",
    decisionInfluence: "ASSISTANCE",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    dataCategories: ["NO_PERSONAL_DATA"],
    toolId: "chatgpt",
    governanceAssessment: {
      core: {
        aiActCategory: null,
      },
      flex: {},
    },
    ...overrides,
  };
}

test("launch context follows the current edit draft and preserves custom classifications", () => {
  const context = buildRiskReviewLaunchContext(
    {
      purpose: "Bewerberkommunikation und Terminabstimmung",
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "PREPARATION",
      dataCategories: ["PERSONAL_DATA", "INTERNAL_CONFIDENTIAL"],
      toolId: "chatgpt",
      toolFreeText: "",
      aiActCategory: "Sonderfall mit Zusatzpruefung",
    },
    "limited",
  );

  assert.equal(context.purpose, "Bewerberkommunikation und Terminabstimmung");
  assert.equal(context.currentRiskDisplayLabel, "Sonderfall mit Zusatzpruefung");
  assert.equal(context.hasCustomRiskValue, true);
  assert.equal(context.currentRiskClass, null);
  assert.equal(context.suggestion.suggestedRiskClass, "LIMITED");
});

test("fallback launch context derives suggestion and existing data from the use case", () => {
  const context = buildRiskReviewLaunchContextFromUseCase(
    createBaseUseCase({
      purpose: "Kundensupport Chatbot fuer haeufige Fragen",
      usageContexts: ["CUSTOMERS"],
      dataCategories: ["PERSONAL_DATA"],
      toolId: "chatgpt",
      governanceAssessment: {
        core: {
          aiActCategory: "Transparenzpflichten",
        },
        flex: {},
      },
    }),
    "limited",
  );

  assert.equal(context.currentRiskDisplayLabel, "Begrenztes Risiko");
  assert.equal(context.currentRiskClass, "LIMITED");
  assert.equal(context.suggestion.suggestedRiskClass, "LIMITED");
  assert.equal(context.suggestion.reviewRecommended, true);
});

test("initial form state and assessment payload preserve existing fields while normalizing known classes", () => {
  const card = createBaseUseCase({
    governanceAssessment: {
      core: {
        aiActCategory: "Sonderfall mit Zusatzpruefung",
        oversightDefined: true,
        reviewCycleDefined: false,
        documentationLevelDefined: true,
        coreVersion: "EUKI-GOV-1.0",
      },
      flex: {
        customAssessmentText: "Bestehender Vermerk",
        customAssessmentSource: "AI_DRAFT",
        oversightModel: "HITL",
      },
    },
  });

  const formState = createInitialRiskReviewFormState(card, null);
  assert.equal(formState.aiActCategory, "Sonderfall mit Zusatzpruefung");
  assert.equal(formState.oversightDefined, "yes");
  assert.equal(formState.reviewCycleDefined, "no");
  assert.equal(formState.documentationLevelDefined, "yes");
  assert.equal(formState.customAssessmentText, "Bestehender Vermerk");
  assert.equal(formState.customAssessmentSource, "AI_DRAFT");

  const payload = buildRiskReviewAssessmentPayload(card, {
    ...formState,
    aiActCategory: "Begrenztes Risiko",
    reviewCycleDefined: "unknown",
    customAssessmentText: "  ",
    customAssessmentSource: null,
  });

  assert.equal(payload.core.aiActCategory, "Transparenzpflichten");
  assert.equal(payload.core.oversightDefined, true);
  assert.equal(payload.core.reviewCycleDefined, undefined);
  assert.equal(payload.core.documentationLevelDefined, true);
  assert.equal(payload.core.coreVersion, "EUKI-GOV-1.0");
  assert.ok(payload.core.assessedAt);
  assert.equal(payload.flex.customAssessmentText, null);
  assert.equal(payload.flex.customAssessmentSource, null);
  assert.equal(payload.flex.oversightModel, "HITL");
});

test("governance follow-up stays optional for calm minimal cases and appears when review is indicated", () => {
  assert.equal(
    shouldShowGovernanceReviewStep({
      suggestion: {
        suggestedRiskClass: "MINIMAL",
        signalStrength: "low",
        reviewRecommended: false,
        reasons: [],
        openQuestions: [],
        sourceSignals: [],
      },
      aiActCategory: "",
      oversightDefined: "unknown",
      reviewCycleDefined: "unknown",
      documentationLevelDefined: "unknown",
    }),
    false,
  );

  assert.equal(
    shouldShowGovernanceReviewStep({
      suggestion: {
        suggestedRiskClass: "LIMITED",
        signalStrength: "medium",
        reviewRecommended: true,
        reasons: [],
        openQuestions: [],
        sourceSignals: [],
      },
      aiActCategory: "",
      oversightDefined: "unknown",
      reviewCycleDefined: "unknown",
      documentationLevelDefined: "unknown",
    }),
    true,
  );
});

test("draft assessment payload carries human and AI context without deciding the class", () => {
  const launchContext = buildRiskReviewLaunchContext(
    {
      purpose: "Bewerberkommunikation und Terminabstimmung",
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "PREPARATION",
      dataCategories: ["PERSONAL_DATA", "INTERNAL_CONFIDENTIAL"],
      toolId: "chatgpt",
      toolFreeText: "",
      aiActCategory: "",
    },
    "limited",
  );

  const payload = buildDraftAssessmentRequestPayload({
    systemName: "ChatGPT",
    vendor: "OpenAI",
    launchContext,
    formState: {
      aiActCategory: "Begrenztes Risiko",
    },
  });

  assert.equal(payload.systemName, "ChatGPT");
  assert.equal(payload.vendor, "OpenAI");
  assert.equal(payload.selectedRiskClass, "Begrenztes Risiko");
  assert.equal(
    payload.suggestedRiskClass,
    "Begrenztes Risiko (Transparenzpflichten)",
  );
  assert.ok(payload.reasons.length > 0);
  assert.ok(payload.openQuestions.length > 0);
});
