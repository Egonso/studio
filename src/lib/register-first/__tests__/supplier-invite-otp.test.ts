import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { verifyOtpHash } from '../supplier-invite-otp';

// ── OTP Hash Tests (pure functions, no Firestore) ───────────────────────────

describe('verifyOtpHash', () => {
  it('returns true for matching OTP', () => {
    const hash = createHash('sha256').update('123456', 'utf8').digest('hex');
    assert.equal(verifyOtpHash('123456', hash), true);
  });

  it('returns false for non-matching OTP', () => {
    const hash = createHash('sha256').update('123456', 'utf8').digest('hex');
    assert.equal(verifyOtpHash('654321', hash), false);
  });

  it('returns false for empty OTP', () => {
    const hash = createHash('sha256').update('123456', 'utf8').digest('hex');
    assert.equal(verifyOtpHash('', hash), false);
  });

  it('handles timing-safe comparison (no throw on length mismatch)', () => {
    assert.equal(verifyOtpHash('123456', 'short'), false);
  });
});
