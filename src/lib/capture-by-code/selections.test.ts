import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCaptureByCodeSelections } from "./selections";

test("normalizeCaptureByCodeSelections bevorzugt neue Mehrfachauswahlen", () => {
  assert.deepEqual(
    normalizeCaptureByCodeSelections({
      usageContext: "INTERNAL_ONLY",
      usageContexts: ["EMPLOYEES", "APPLICANTS", "EMPLOYEES"],
      dataCategory: "NONE",
      dataCategories: ["PERSONAL_DATA", "SPECIAL_PERSONAL", "HEALTH_DATA"],
      decisionInfluence: "PREPARATION",
    }),
    {
      usageContexts: ["EMPLOYEES", "APPLICANTS"],
      dataCategory: "PERSONAL_DATA",
      dataCategories: ["PERSONAL_DATA", "SPECIAL_PERSONAL", "HEALTH_DATA"],
      decisionInfluence: "PREPARATION",
    }
  );
});

test("normalizeCaptureByCodeSelections faellt rueckwaerts-kompatibel auf Single-Select zurueck", () => {
  assert.deepEqual(
    normalizeCaptureByCodeSelections({
      usageContext: "PUBLIC",
      dataCategory: "NO_PERSONAL_DATA",
    }),
    {
      usageContexts: ["PUBLIC"],
      dataCategory: "NO_PERSONAL_DATA",
      dataCategories: ["NO_PERSONAL_DATA"],
      decisionInfluence: undefined,
    }
  );
});

test("normalizeCaptureByCodeSelections setzt INTERNAL_ONLY wenn nichts gewaehlt wurde", () => {
  assert.deepEqual(normalizeCaptureByCodeSelections({}), {
    usageContexts: ["INTERNAL_ONLY"],
    dataCategory: undefined,
    dataCategories: undefined,
    decisionInfluence: undefined,
  });
});
