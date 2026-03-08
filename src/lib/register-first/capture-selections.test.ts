import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDataCategoryLogic,
  toggleMultiSelect,
} from "./capture-selections";

test("toggleMultiSelect fuegt Werte hinzu und entfernt sie wieder", () => {
  assert.deepEqual(toggleMultiSelect(["A"], "B"), ["A", "B"]);
  assert.deepEqual(toggleMultiSelect(["A", "B"], "B"), ["A"]);
});

test("applyDataCategoryLogic entfernt personenbezogene Kategorien bei NO_PERSONAL_DATA", () => {
  const result = applyDataCategoryLogic(
    ["PERSONAL_DATA", "SPECIAL_PERSONAL", "HEALTH_DATA"],
    "NO_PERSONAL_DATA"
  );

  assert.deepEqual(result, ["NO_PERSONAL_DATA"]);
});

test("applyDataCategoryLogic aktiviert Oberkategorien fuer sensible Unterkategorien", () => {
  const result = applyDataCategoryLogic([], "HEALTH_DATA");

  assert.deepEqual(result.sort(), [
    "HEALTH_DATA",
    "PERSONAL_DATA",
    "SPECIAL_PERSONAL",
  ]);
});

test("applyDataCategoryLogic entfernt sensible Unterkategorien beim Abwaehlen von SPECIAL_PERSONAL", () => {
  const result = applyDataCategoryLogic(
    ["PERSONAL_DATA", "SPECIAL_PERSONAL", "HEALTH_DATA"],
    "SPECIAL_PERSONAL"
  );

  assert.deepEqual(result, ["PERSONAL_DATA"]);
});
