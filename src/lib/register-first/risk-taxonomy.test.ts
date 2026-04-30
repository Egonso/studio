import assert from "node:assert/strict";
import test from "node:test";

import {
  getCanonicalClassFromToolRiskLevel,
  getDisplayedRiskClassLabel,
  getRiskClassEditorValue,
  getRiskClassStoredLabel,
  getRiskClassShortLabel,
  normalizeStoredAiActCategory,
  parseStoredAiActCategory,
  resolveRiskClass,
} from "./risk-taxonomy";

test("parseStoredAiActCategory maps legacy and human-friendly labels to canonical classes", () => {
  assert.equal(parseStoredAiActCategory("Transparenz-Risiko"), "LIMITED");
  assert.equal(parseStoredAiActCategory("Transparenzpflichten"), "LIMITED");
  assert.equal(parseStoredAiActCategory("Begrenztes Risiko"), "LIMITED");
  assert.equal(parseStoredAiActCategory("Hohes Risiko"), "HIGH");
  assert.equal(parseStoredAiActCategory("Hochrisiko"), "HIGH");
  assert.equal(parseStoredAiActCategory("Geringes Risiko"), "MINIMAL");
  assert.equal(parseStoredAiActCategory("Verboten"), "PROHIBITED");
  assert.equal(parseStoredAiActCategory("Unbekannt"), "UNASSESSED");
  assert.equal(parseStoredAiActCategory(""), "UNASSESSED");
});

test("normalizeStoredAiActCategory preserves canonical stored labels for known aliases", () => {
  assert.equal(
    normalizeStoredAiActCategory("Begrenztes Risiko"),
    "Transparenzpflichten"
  );
  assert.equal(
    normalizeStoredAiActCategory("Transparenz-Risiko"),
    "Transparenzpflichten"
  );
  assert.equal(normalizeStoredAiActCategory("Hohes Risiko"), "Hochrisiko");
  assert.equal(normalizeStoredAiActCategory("Verboten"), "Verboten");
  assert.equal(normalizeStoredAiActCategory("Unbekannt"), null);
});

test("normalizeStoredAiActCategory preserves unknown custom strings instead of dropping them", () => {
  assert.equal(
    normalizeStoredAiActCategory("Sonderfall mit Zusatzpruefung"),
    "Sonderfall mit Zusatzpruefung"
  );
});

test("display helpers favor mapped labels, preserve unknown custom strings, and fall back to tool risk", () => {
  assert.equal(
    getDisplayedRiskClassLabel({ aiActCategory: "Transparenzpflichten" }),
    "Begrenztes Risiko (Transparenzpflichten)"
  );
  assert.equal(
    getDisplayedRiskClassLabel({
      aiActCategory: "Sonderfall mit Zusatzpruefung",
      short: true,
    }),
    "Sonderfall mit Zusatzpruefung"
  );
  assert.equal(
    getDisplayedRiskClassLabel({ toolRiskLevel: "limited", short: true }),
    "Begrenztes Risiko"
  );
  assert.equal(
    getDisplayedRiskClassLabel({ toolRiskLevel: "minimal" }),
    "Minimales Risiko"
  );
  assert.equal(
    getDisplayedRiskClassLabel({
      aiActCategory: "Transparenzpflichten",
      locale: "en",
    }),
    "Limited risk (transparency obligations)"
  );
  assert.equal(
    getDisplayedRiskClassLabel({
      toolRiskLevel: "high",
      short: true,
      locale: "en",
    }),
    "High-risk"
  );
});

test("editor values normalize known stored labels but leave unknown custom labels untouched", () => {
  assert.equal(getRiskClassEditorValue("Transparenzpflichten"), "Begrenztes Risiko");
  assert.equal(getRiskClassEditorValue("Hochrisiko"), "Hochrisiko");
  assert.equal(
    getRiskClassEditorValue("Sonderfall mit Zusatzpruefung"),
    "Sonderfall mit Zusatzpruefung"
  );
  assert.equal(getRiskClassEditorValue(null), "");
});

test("tool risk fallback resolves to canonical classes and readable stored labels", () => {
  assert.equal(getCanonicalClassFromToolRiskLevel("limited"), "LIMITED");
  assert.equal(getCanonicalClassFromToolRiskLevel("high"), "HIGH");
  assert.equal(getRiskClassStoredLabel("LIMITED"), "Transparenzpflichten");
  assert.equal(getRiskClassShortLabel("PROHIBITED"), "Verboten");
});

test("resolveRiskClass uses mapped stored values first and tool fallback second", () => {
  assert.equal(
    resolveRiskClass({
      aiActCategory: "Hochrisiko",
      toolRiskLevel: "minimal",
    }),
    "HIGH"
  );
  assert.equal(
    resolveRiskClass({
      aiActCategory: null,
      toolRiskLevel: "unacceptable",
    }),
    "PROHIBITED"
  );
  assert.equal(
    resolveRiskClass({
      aiActCategory: "Sonderfall mit Zusatzpruefung",
      toolRiskLevel: "limited",
    }),
    "UNASSESSED"
  );
});
