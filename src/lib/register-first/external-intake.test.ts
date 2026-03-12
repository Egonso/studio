import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccessCodeTrace,
  buildSupplierRequestTrace,
  formatExternalIntakeTrace,
} from "./external-intake";

test("buildSupplierRequestTrace keeps supplier link provenance", () => {
  const trace = buildSupplierRequestTrace({
    submittedAt: "2026-03-12T08:15:00.000Z",
    registerId: "reg_123",
    ownerId: "owner_456",
    supplierEmail: "vendor@example.com",
    submissionId: "extsub_1",
    requestTokenId: "srt_abc123",
  });

  assert.deepEqual(trace, {
    source: "SUPPLIER_REQUEST_LINK",
    submittedAt: "2026-03-12T08:15:00.000Z",
    registerId: "reg_123",
    ownerId: "owner_456",
    submissionId: "extsub_1",
    sourceType: "supplier_request",
    submittedByName: "vendor@example.com",
    submittedByEmail: "vendor@example.com",
    requestPath: "/request/[signed-token]",
    requestTokenId: "srt_abc123",
    requestCode: null,
    accessCodeId: null,
    accessCode: null,
    accessCodeLabel: null,
  });
  assert.equal(
    formatExternalIntakeTrace(trace),
    "vendor@example.com via Lieferanten-Link (Token srt_abc123) (/request/[signed-token])"
  );
});

test("buildAccessCodeTrace keeps access-code provenance", () => {
  const trace = buildAccessCodeTrace({
    submittedAt: new Date("2026-03-12T09:30:00.000Z"),
    registerId: "reg_987",
    accessCode: "ai-ab12cd",
    accessCodeLabel: "Team Capture",
    submittedByName: "Max Mustermann",
    submittedByRole: "HR",
  });

  assert.deepEqual(trace, {
    source: "ACCESS_CODE",
    submittedAt: "2026-03-12T09:30:00.000Z",
    registerId: "reg_987",
    ownerId: null,
    submissionId: null,
    sourceType: "access_code",
    submittedByName: "Max Mustermann",
    submittedByEmail: null,
    submittedByRole: "HR",
    requestPath: "/erfassen?code=AI-AB12CD",
    requestTokenId: null,
    requestCode: null,
    accessCodeId: "AI-AB12CD",
    accessCode: "AI-AB12CD",
    accessCodeLabel: "Team Capture",
  });
  assert.equal(
    formatExternalIntakeTrace(trace),
    'Max Mustermann via Erfassungslink "Team Capture" Code AI-AB12CD'
  );
});
