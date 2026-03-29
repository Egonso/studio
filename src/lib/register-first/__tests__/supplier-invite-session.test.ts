import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createSupplierSessionCookie,
  validateSupplierSession,
  SUPPLIER_SESSION_COOKIE_NAME,
} from '../supplier-invite-session';

// ── Helpers ─────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-session-secret-32bytes-ok!!';
const TEST_SECRET_PREVIOUS = 'old-session-secret-32bytes-ok!!!';

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

let savedSecret: string | undefined;
let savedPreviousSecret: string | undefined;

beforeEach(() => {
  savedSecret = process.env.SUPPLIER_SESSION_SECRET;
  savedPreviousSecret = process.env.SUPPLIER_SESSION_SECRET_PREVIOUS;
  setEnv('SUPPLIER_SESSION_SECRET', TEST_SECRET);
  setEnv('SUPPLIER_SESSION_SECRET_PREVIOUS', undefined);
});

afterEach(() => {
  setEnv('SUPPLIER_SESSION_SECRET', savedSecret);
  setEnv('SUPPLIER_SESSION_SECRET_PREVIOUS', savedPreviousSecret);
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SupplierInviteSession', () => {
  it('cookie name is __supplier_session', () => {
    assert.equal(SUPPLIER_SESSION_COOKIE_NAME, '__supplier_session');
  });

  it('creates and validates a session cookie', () => {
    const cookie = createSupplierSessionCookie('inv_123', 'test@example.com');

    assert.equal(cookie.name, '__supplier_session');
    assert.equal(cookie.options.httpOnly, true);
    assert.equal(cookie.options.secure, true);
    assert.equal(cookie.options.sameSite, 'strict');
    assert.equal(cookie.options.path, '/request');
    assert.ok(typeof cookie.value === 'string');

    const result = validateSupplierSession(cookie.value, 'inv_123');
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.payload.inviteId, 'inv_123');
      assert.equal(result.payload.verifiedEmail, 'test@example.com');
      assert.ok(result.payload.verifiedAt);
      assert.ok(result.payload.exp > 0);
    }
  });

  it('rejects missing cookie', () => {
    const result = validateSupplierSession(undefined, 'inv_123');
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'missing');
  });

  it('rejects malformed cookie (no dot)', () => {
    const result = validateSupplierSession('no-dot-here', 'inv_123');
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'malformed');
  });

  it('rejects tampered signature', () => {
    const cookie = createSupplierSessionCookie('inv_123', 'test@example.com');
    const tampered = cookie.value.slice(0, -4) + 'XXXX';
    const result = validateSupplierSession(tampered, 'inv_123');
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'invalid_signature');
  });

  it('rejects expired session', () => {
    const cookie = createSupplierSessionCookie('inv_123', 'test@example.com');
    // Parse and manually expire
    const dotIdx = cookie.value.lastIndexOf('.');
    const payloadB64 = cookie.value.slice(0, dotIdx);
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );
    payload.exp = Math.floor(Date.now() / 1000) - 10; // expired 10s ago
    const expiredB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Re-sign with correct secret
    const { createHmac } = require('node:crypto');
    const sig = createHmac('sha256', TEST_SECRET).update(expiredB64).digest('base64url');
    const expiredCookie = `${expiredB64}.${sig}`;

    const result = validateSupplierSession(expiredCookie, 'inv_123');
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'expired');
  });

  it('rejects invite mismatch', () => {
    const cookie = createSupplierSessionCookie('inv_123', 'test@example.com');
    const result = validateSupplierSession(cookie.value, 'inv_OTHER');
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'invite_mismatch');
  });

  it('supports key rotation (previous secret)', () => {
    // Create cookie with current secret
    const cookie = createSupplierSessionCookie('inv_123', 'test@example.com');

    // Rotate: current becomes previous, new secret is set
    setEnv('SUPPLIER_SESSION_SECRET', 'brand-new-secret-32bytes-ok!!!!');
    setEnv('SUPPLIER_SESSION_SECRET_PREVIOUS', TEST_SECRET);

    // Old cookie should still validate via previous secret
    const result = validateSupplierSession(cookie.value, 'inv_123');
    assert.equal(result.valid, true);
  });

  it('rejects when no SUPPLIER_SESSION_SECRET is set', () => {
    setEnv('SUPPLIER_SESSION_SECRET', undefined);
    assert.throws(
      () => createSupplierSessionCookie('inv_123', 'test@example.com'),
      /SUPPLIER_SESSION_SECRET/
    );
  });
});
