import assert from "node:assert/strict";
import test from "node:test";

import {
  issueSupplierRequestToken,
  parseSupplierRequestToken,
  verifySupplierRequestToken,
} from "./request-tokens";

test("issueSupplierRequestToken creates a public URL and verifiable token", () => {
  const issued = issueSupplierRequestToken({
    registerId: "reg_123",
    ownerId: "owner_456",
    createdBy: "owner_456",
    createdByEmail: "owner@example.com",
    now: new Date("2026-03-12T10:00:00.000Z"),
    expiresInDays: 14,
  });

  const parsed = parseSupplierRequestToken(issued.token);
  assert.ok(parsed);
  assert.equal(parsed?.tokenId, issued.tokenId);
  assert.equal(
    issued.publicUrl.startsWith("https://kiregister.com/request/"),
    true
  );

  assert.deepEqual(
    verifySupplierRequestToken(
      issued.token,
      issued.record,
      new Date("2026-03-20T10:00:00.000Z")
    ),
    {
      valid: true,
      parsed: parsed!,
    }
  );
});

test("verifySupplierRequestToken rejects tampered and expired tokens", () => {
  const issued = issueSupplierRequestToken({
    registerId: "reg_123",
    ownerId: "owner_456",
    createdBy: "owner_456",
    now: new Date("2026-03-12T10:00:00.000Z"),
    expiresInDays: 1,
  });

  const tampered = issued.token.replace(/\.[^.]+$/, ".tampered");
  assert.deepEqual(
    verifySupplierRequestToken(
      tampered,
      issued.record,
      new Date("2026-03-12T12:00:00.000Z")
    ),
    {
      valid: false,
      reason: "hash_mismatch",
    }
  );

  assert.deepEqual(
    verifySupplierRequestToken(
      issued.token,
      issued.record,
      new Date("2026-03-20T10:00:00.000Z")
    ),
    {
      valid: false,
      reason: "expired",
    }
  );
});
