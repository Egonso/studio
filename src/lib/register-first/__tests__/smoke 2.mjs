import assert from "node:assert/strict";
import {
  assertManualGovernanceDecision,
  createUseCaseCardDraft,
  parseCaptureInput,
} from "../schema.ts";
import {
  getRegisterFirstFeatureFlags,
  registerFirstDefaultFlags,
} from "../flags.ts";

const parsed = parseCaptureInput({
  purpose: "Support-Anfragen priorisieren",
  usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
  isCurrentlyResponsible: true,
  decisionImpact: "UNSURE",
  affectedParties: ["GROUPS_OR_TEAMS"],
});

assert.equal(parsed.purpose, "Support-Anfragen priorisieren");
assert.deepEqual(parsed.usageContexts, ["INTERNAL_ONLY", "EMPLOYEES"]);

assert.throws(() =>
  parseCaptureInput({
    purpose: "Bewerbungen vorsortieren",
    usageContexts: ["INTERNAL_ONLY"],
    isCurrentlyResponsible: false,
    decisionImpact: "YES",
    affectedParties: ["INDIVIDUALS"],
  })
);

const card = createUseCaseCardDraft(
  {
    purpose: "Marketing-Texte erstellen",
    usageContexts: ["CUSTOMER_FACING"],
    isCurrentlyResponsible: true,
    decisionImpact: "NO",
  },
  {
    useCaseId: "uc_001",
    now: new Date("2026-02-07T12:00:00.000Z"),
  }
);

assert.equal(card.status, "UNREVIEWED");
assert.equal(card.cardVersion, "1.1");

assert.doesNotThrow(() => assertManualGovernanceDecision("HUMAN"));
assert.throws(() => assertManualGovernanceDecision("AUTOMATION"));

const defaultFlags = getRegisterFirstFeatureFlags({});
assert.deepEqual(defaultFlags, registerFirstDefaultFlags);

const envFlags = getRegisterFirstFeatureFlags({
  NEXT_PUBLIC_REGISTER_FIRST_ENABLED: "true",
  NEXT_PUBLIC_REGISTER_FIRST_HYBRID_ENTRY: "1",
  NEXT_PUBLIC_REGISTER_FIRST_PROOF_GATE: "yes",
});
assert.equal(envFlags.enabled, true);
assert.equal(envFlags.hybridEntry, true);
assert.equal(envFlags.proofGate, true);

console.log("Register-First smoke tests passed.");
