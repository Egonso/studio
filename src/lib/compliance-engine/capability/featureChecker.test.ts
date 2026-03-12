import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequiredPlan,
  hasCapability,
} from "./featureChecker";

test("free plan keeps core register capabilities", () => {
  assert.equal(hasCapability("free", "editUseCase"), true);
  assert.equal(hasCapability("free", "assessmentWizard"), true);
  assert.equal(hasCapability("free", "reviewWorkflow"), false);
  assert.equal(hasCapability("free", "trustPortal"), false);
});

test("trust portal is part of the paid governance tier", () => {
  assert.equal(hasCapability("pro", "trustPortal"), true);
  assert.equal(hasCapability("enterprise", "trustPortal"), true);
  assert.equal(getRequiredPlan("trustPortal"), "pro");
});
