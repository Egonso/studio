import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeCaptureUsageContexts,
  normalizeCardVersion,
  normalizeDataCategories,
  normalizeRegisterUseCaseStatus,
  normalizeUseCaseOriginSource,
} from "./card-model";

test("canonical status and version normalization maps legacy aliases safely", () => {
  assert.equal(normalizeRegisterUseCaseStatus("draft"), "UNREVIEWED");
  assert.equal(
    normalizeRegisterUseCaseStatus("ready_for_proof"),
    "PROOF_READY"
  );
  assert.equal(normalizeCardVersion("1.2"), "1.1");
  assert.equal(normalizeCardVersion("v1.0"), "1.1");
});

test("usage contexts and data categories normalize legacy aliases to canonical values", () => {
  assert.deepEqual(normalizeCaptureUsageContexts(["CUSTOMER_FACING"]), [
    "CUSTOMERS",
  ]);
  assert.deepEqual(
    normalizeCaptureUsageContexts(["EMPLOYEE_FACING", "EXTERNAL_PUBLIC"]),
    ["EMPLOYEES", "PUBLIC"]
  );
  assert.deepEqual(normalizeDataCategories(["INTERNAL", "SENSITIVE"]), [
    "INTERNAL_CONFIDENTIAL",
    "SPECIAL_PERSONAL",
  ]);
  assert.deepEqual(
    normalizeDataCategories(["NO_PERSONAL_DATA", "PERSONAL"]),
    ["PERSONAL_DATA"]
  );
});

test("origin aliases normalize to canonical source names", () => {
  assert.equal(normalizeUseCaseOriginSource("manual_import"), "import");
  assert.equal(normalizeUseCaseOriginSource("supplier-request"), "supplier_request");
  assert.equal(normalizeUseCaseOriginSource("access-code"), "access_code");
});
