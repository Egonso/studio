import assert from "node:assert/strict";
import test from "node:test";

import {
  CUSTOM_RISK_SELECTION,
  applyRiskManualSelection,
  buildRiskSuggestionForEditDraft,
  getRiskAssistCurrentDisplayLabel,
  getRiskManualSelectionValue,
  hasCustomRiskSelection,
} from "./risk-class-assist-model";

test("manual selection maps canonical and legacy labels while preserving custom text", () => {
  assert.equal(getRiskManualSelectionValue("Hochrisiko"), "HIGH");
  assert.equal(getRiskManualSelectionValue("Begrenztes Risiko"), "LIMITED");
  assert.equal(
    getRiskManualSelectionValue("Sonderfall mit Zusatzpruefung"),
    CUSTOM_RISK_SELECTION,
  );
  assert.equal(hasCustomRiskSelection("Sonderfall mit Zusatzpruefung"), true);
  assert.equal(getRiskAssistCurrentDisplayLabel("Sonderfall mit Zusatzpruefung"), "Sonderfall mit Zusatzpruefung");
});

test("manual selection writes back short labels for canonical UI choices", () => {
  assert.equal(applyRiskManualSelection("UNASSESSED"), "");
  assert.equal(applyRiskManualSelection("LIMITED"), "Begrenztes Risiko");
  assert.equal(applyRiskManualSelection("HIGH"), "Hochrisiko");
});

test("draft-based suggestion stays conservative for applicant communication", () => {
  const result = buildRiskSuggestionForEditDraft(
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

  assert.equal(result.suggestedRiskClass, "LIMITED");
  assert.equal(result.reviewRecommended, true);
  assert.notEqual(result.suggestedRiskClass, "HIGH");
});
