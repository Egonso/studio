import assert from "node:assert/strict";
import test from "node:test";
import {
  getPublicCoverageAssistConfig,
  isCoverageAssistPilotEnabled,
} from "./feature-gate";

test("coverage assist pilot gate only opens when all three flags are on", () => {
  assert.equal(
    isCoverageAssistPilotEnabled({
      coverageAssistPhase1: true,
      coverageAssistExtension: true,
      coverageAssistSeedLibrary: true,
    }),
    true
  );

  assert.equal(
    isCoverageAssistPilotEnabled({
      coverageAssistPhase1: true,
      coverageAssistExtension: false,
      coverageAssistSeedLibrary: true,
    }),
    false
  );
});

test("coverage assist public config mirrors flags and rollout state", () => {
  const config = getPublicCoverageAssistConfig({
    coverageAssistPhase1: true,
    coverageAssistExtension: true,
    coverageAssistSeedLibrary: false,
  });

  assert.deepEqual(config, {
    coverageAssistPhase1: true,
    coverageAssistExtension: true,
    coverageAssistSeedLibrary: false,
    rolloutEnabled: false,
  });
});
