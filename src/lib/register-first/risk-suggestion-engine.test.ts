import assert from "node:assert/strict";
import test from "node:test";

import {
  suggestRiskClass,
  suggestRiskClassForUseCase,
  type RiskSuggestionInput,
} from "./risk-suggestion-engine";
import type { UseCaseCard } from "./types";

function createBaseInput(
  overrides: Partial<RiskSuggestionInput> = {},
): RiskSuggestionInput {
  return {
    purpose: "Interne KI-Unterstuetzung",
    usageContexts: ["INTERNAL_ONLY"],
    decisionInfluence: "ASSISTANCE",
    dataCategories: ["NO_PERSONAL_DATA"],
    toolId: null,
    toolFreeText: null,
    toolRiskLevel: null,
    aiActCategory: null,
    ...overrides,
  };
}

function createBaseUseCase(
  overrides: Partial<UseCaseCard> = {},
): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId: "uc_risk_suggestion",
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

test("internal assistive use cases stay conservative even with a limited-risk tool", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "Interne Zusammenfassung von Meeting-Notizen",
      toolId: "chatgpt",
      toolRiskLevel: "limited",
    }),
  );

  assert.equal(result.suggestedRiskClass, "MINIMAL");
  assert.equal(result.reviewRecommended, false);
  assert.equal(result.signalStrength, "medium");
  assert.ok(result.reasons.some((reason) => reason.includes("rein intern und assistiv")));
  assert.ok(result.sourceSignals.includes("tool-risk:limited"));
});

test("customer-facing chatbots suggest LIMITED and recommend review", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "Kundensupport Chatbot fuer haeufige Fragen",
      usageContexts: ["CUSTOMERS"],
      decisionInfluence: "ASSISTANCE",
      dataCategories: ["PERSONAL_DATA"],
      toolId: "chatgpt",
      toolRiskLevel: "limited",
    }),
  );

  assert.equal(result.suggestedRiskClass, "LIMITED");
  assert.equal(result.reviewRecommended, true);
  assert.ok(
    result.reasons.some((reason) => reason.includes("Chatbot") || reason.includes("Assistenzfall")),
  );
});

test("applicant communication does not automatically escalate to HIGH", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "Bewerberkommunikation und Terminabstimmung",
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "PREPARATION",
      dataCategories: ["PERSONAL_DATA", "INTERNAL_CONFIDENTIAL"],
      toolId: "chatgpt",
      toolRiskLevel: "limited",
    }),
  );

  assert.notEqual(result.suggestedRiskClass, "HIGH");
  assert.equal(result.suggestedRiskClass, "LIMITED");
  assert.equal(result.reviewRecommended, true);
  assert.ok(
    result.openQuestions.some((question) => question.includes("Auswahl") || question.includes("Ranking")),
  );
});

test("applicant scoring and selection suggest HIGH with strong signal", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "Automatisiertes Bewerber-Scoring und Ranking fuer die Vorauswahl",
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "AUTOMATED",
      dataCategories: ["PERSONAL_DATA", "SPECIAL_PERSONAL"],
    }),
  );

  assert.equal(result.suggestedRiskClass, "HIGH");
  assert.equal(result.reviewRecommended, true);
  assert.equal(result.signalStrength, "high");
  assert.ok(result.sourceSignals.includes("purpose:DECISION_EFFECT"));
});

test("obviously prohibited patterns suggest PROHIBITED", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "Social Scoring fuer Mitarbeitende und Bewerber",
      usageContexts: ["EMPLOYEES", "APPLICANTS"],
      decisionInfluence: "AUTOMATED",
      dataCategories: ["PERSONAL_DATA"],
    }),
  );

  assert.equal(result.suggestedRiskClass, "PROHIBITED");
  assert.equal(result.reviewRecommended, true);
  assert.equal(result.signalStrength, "high");
});

test("too little data stays UNASSESSED and asks explicit questions", () => {
  const result = suggestRiskClass(
    createBaseInput({
      purpose: "KI-Unterstuetzung",
      usageContexts: [],
      decisionInfluence: null,
      dataCategories: [],
      toolId: null,
      toolRiskLevel: null,
    }),
  );

  assert.equal(result.suggestedRiskClass, "UNASSESSED");
  assert.equal(result.signalStrength, "low");
  assert.equal(result.reviewRecommended, false);
  assert.ok(result.openQuestions.length >= 3);
});

test("existing aiActCategory is informational only and does not dominate the suggestion", () => {
  const result = suggestRiskClassForUseCase(
    createBaseUseCase({
      purpose: "Interne Zusammenfassung von Meeting-Notizen",
      governanceAssessment: {
        core: {
          aiActCategory: "Hochrisiko",
        },
        flex: {},
      },
    }),
    {
      resolveToolRiskLevel: (toolId) =>
        toolId === "chatgpt" ? "limited" : null,
    },
  );

  assert.equal(result.suggestedRiskClass, "MINIMAL");
  assert.ok(result.sourceSignals.includes("existing-category:HIGH"));
  assert.ok(result.sourceSignals.includes("tool-risk:limited"));
});
