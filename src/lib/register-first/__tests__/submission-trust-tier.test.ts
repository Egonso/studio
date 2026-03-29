import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSubmissionTrustTier,
  getSubmissionRiskFlags,
  getTrustTierLabel,
  getRiskFlagLabel,
  compareSubmissionsByTrust,
} from '../submission-trust-tier';

import type { ExternalSubmission } from '../types';

function makeSubmission(
  overrides: Partial<ExternalSubmission> & { rawPayloadSnapshot: Record<string, unknown> }
): ExternalSubmission {
  return {
    submissionId: 'sub_1',
    registerId: 'reg_1',
    ownerId: 'owner_1',
    sourceType: 'supplier_request',
    submittedAt: new Date().toISOString(),
    status: 'submitted',
    ...overrides,
  } as ExternalSubmission;
}

// ── Trust Tier Resolution ───────────────────────────────────────────────────

describe('resolveSubmissionTrustTier', () => {
  it('returns "verified" for V2 submissions with verificationMethod', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: { verificationMethod: 'email_otp' },
    });
    assert.equal(resolveSubmissionTrustTier(s), 'verified');
  });

  it('returns "legacy" for V1 submissions without verificationMethod', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: { toolName: 'ChatGPT' },
    });
    assert.equal(resolveSubmissionTrustTier(s), 'legacy');
  });

  it('returns "flagged" when riskFlags are present', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: {
        verificationMethod: 'email_otp',
        riskFlags: ['ipMismatch'],
      },
    });
    assert.equal(resolveSubmissionTrustTier(s), 'flagged');
  });

  it('flagged takes precedence over verified', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: {
        verificationMethod: 'email_otp',
        riskFlags: ['rapidSubmission'],
      },
    });
    assert.equal(resolveSubmissionTrustTier(s), 'flagged');
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe('getSubmissionRiskFlags', () => {
  it('extracts valid risk flags', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: {
        riskFlags: ['highOtpAttempts', 'ipMismatch'],
      },
    });
    assert.deepEqual(getSubmissionRiskFlags(s), ['highOtpAttempts', 'ipMismatch']);
  });

  it('ignores unknown flags', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: {
        riskFlags: ['unknownFlag', 'ipMismatch'],
      },
    });
    assert.deepEqual(getSubmissionRiskFlags(s), ['ipMismatch']);
  });

  it('returns empty array when no riskFlags', () => {
    const s = makeSubmission({
      rawPayloadSnapshot: {},
    });
    assert.deepEqual(getSubmissionRiskFlags(s), []);
  });
});

// ── Labels ──────────────────────────────────────────────────────────────────

describe('getTrustTierLabel', () => {
  it('returns German labels', () => {
    assert.equal(getTrustTierLabel('verified'), 'Verifiziert');
    assert.equal(getTrustTierLabel('legacy'), 'Legacy');
    assert.equal(getTrustTierLabel('flagged'), 'Auffaellig');
  });
});

describe('getRiskFlagLabel', () => {
  it('returns human-readable label for known flag', () => {
    assert.ok(getRiskFlagLabel('highOtpAttempts').length > 0);
    assert.ok(getRiskFlagLabel('ipMismatch').length > 0);
    assert.ok(getRiskFlagLabel('rapidSubmission').length > 0);
    assert.ok(getRiskFlagLabel('deliveryBounced').length > 0);
  });
});

// ── Sorting ─────────────────────────────────────────────────────────────────

describe('compareSubmissionsByTrust', () => {
  it('sorts flagged before legacy before verified', () => {
    const flagged = makeSubmission({
      submissionId: 'flagged',
      submittedAt: '2026-03-01T10:00:00Z',
      rawPayloadSnapshot: { riskFlags: ['ipMismatch'] },
    });
    const legacy = makeSubmission({
      submissionId: 'legacy',
      submittedAt: '2026-03-01T10:00:00Z',
      rawPayloadSnapshot: {},
    });
    const verified = makeSubmission({
      submissionId: 'verified',
      submittedAt: '2026-03-01T10:00:00Z',
      rawPayloadSnapshot: { verificationMethod: 'email_otp' },
    });

    const sorted = [verified, legacy, flagged].sort(compareSubmissionsByTrust);
    assert.equal(sorted[0].submissionId, 'flagged');
    assert.equal(sorted[1].submissionId, 'legacy');
    assert.equal(sorted[2].submissionId, 'verified');
  });

  it('within same tier, sorts newest first', () => {
    const older = makeSubmission({
      submissionId: 'older',
      submittedAt: '2026-03-01T10:00:00Z',
      rawPayloadSnapshot: {},
    });
    const newer = makeSubmission({
      submissionId: 'newer',
      submittedAt: '2026-03-02T10:00:00Z',
      rawPayloadSnapshot: {},
    });

    const sorted = [older, newer].sort(compareSubmissionsByTrust);
    assert.equal(sorted[0].submissionId, 'newer');
    assert.equal(sorted[1].submissionId, 'older');
  });
});
