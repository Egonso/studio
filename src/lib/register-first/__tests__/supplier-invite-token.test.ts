import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseSupplierInviteToken,
  verifySupplierInviteSecret,
  issueSupplierInvite,
} from '../supplier-invites';

// ── Token Parsing ───────────────────────────────────────────────────────────

describe('parseSupplierInviteToken', () => {
  it('parses a valid sinv1 token', () => {
    const result = parseSupplierInviteToken('sinv1.inv_abc123.secretXYZ');
    assert.ok(result);
    assert.equal(result.inviteId, 'inv_abc123');
    assert.equal(result.secret, 'secretXYZ');
  });

  it('returns null for wrong prefix', () => {
    assert.equal(parseSupplierInviteToken('sinv2.inv_abc.secret'), null);
  });

  it('returns null for too few parts', () => {
    assert.equal(parseSupplierInviteToken('sinv1.onlyonepart'), null);
  });

  it('returns null for empty string', () => {
    assert.equal(parseSupplierInviteToken(''), null);
  });

  it('returns null for null/undefined', () => {
    assert.equal(parseSupplierInviteToken(null), null);
    assert.equal(parseSupplierInviteToken(undefined), null);
  });
});

// ── Secret Verification ─────────────────────────────────────────────────────

describe('verifySupplierInviteSecret', () => {
  it('validates correct secret against issued invite', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'supplier@example.com',
    });

    const parsed = parseSupplierInviteToken(issued.token);
    assert.ok(parsed);

    const result = verifySupplierInviteSecret(parsed.secret, issued.record);
    assert.equal(result.valid, true);
  });

  it('rejects wrong secret', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'supplier@example.com',
    });

    const result = verifySupplierInviteSecret('wrong_secret', issued.record);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'hash_mismatch');
  });

  it('rejects revoked invite', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'supplier@example.com',
    });
    const parsed = parseSupplierInviteToken(issued.token);
    assert.ok(parsed);

    const revokedRecord = {
      ...issued.record,
      revokedAt: new Date().toISOString(),
    };

    const result = verifySupplierInviteSecret(parsed.secret, revokedRecord);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'revoked');
  });

  it('rejects expired invite', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'supplier@example.com',
      expiresInDays: 1,
      now: new Date('2025-01-01'),
    });
    const parsed = parseSupplierInviteToken(issued.token);
    assert.ok(parsed);

    // Validate at a time past expiry
    const futureDate = new Date('2025-01-10');
    const result = verifySupplierInviteSecret(parsed.secret, issued.record, futureDate);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'expired');
  });

  it('rejects already submitted invite at max submissions', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'supplier@example.com',
      maxSubmissions: 1,
    });
    const parsed = parseSupplierInviteToken(issued.token);
    assert.ok(parsed);

    const submittedRecord = {
      ...issued.record,
      status: 'submitted' as const,
      submissionCount: 1,
    };

    const result = verifySupplierInviteSecret(parsed.secret, submittedRecord);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, 'already_submitted');
  });
});

// ── Issue Invite ────────────────────────────────────────────────────────────

describe('issueSupplierInvite', () => {
  it('creates invite with correct defaults', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'Test@Example.COM',
    });

    assert.ok(issued.token.startsWith('sinv1.'));
    assert.ok(issued.inviteId.startsWith('sinv_'));
    assert.ok(issued.publicUrl.includes('/request/'));
    assert.equal(issued.record.intendedEmail, 'test@example.com');
    assert.equal(issued.record.intendedDomain, 'example.com');
    assert.equal(issued.record.status, 'active');
    assert.equal(issued.record.senderPolicy, 'exact_email');
    assert.equal(issued.record.verificationMode, 'email_otp');
    assert.equal(issued.record.maxSubmissions, 1);
    assert.equal(issued.record.submissionCount, 0);
    assert.equal(issued.record.deliveryFailed, false);
    assert.deepEqual(issued.record.riskFlags, []);
  });

  it('respects custom maxSubmissions', () => {
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'test@example.com',
      maxSubmissions: 5,
    });

    assert.equal(issued.record.maxSubmissions, 5);
  });

  it('respects custom expiresInDays', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const issued = issueSupplierInvite({
      registerId: 'reg_1',
      ownerId: 'owner_1',
      createdBy: 'owner_1',
      intendedEmail: 'test@example.com',
      expiresInDays: 3,
      now,
    });

    const expiresAt = new Date(issued.record.expiresAt);
    const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    assert.equal(diffDays, 3);
  });
});
