import type { ExternalSubmission } from './types';

// ── Submission Trust Tiers ──────────────────────────────────────────────────
//
// Quiet, factual classification for inbox sorting and visual hints.
// These are signals, never automatic blockers.

export type SubmissionTrustTier = 'verified' | 'legacy' | 'flagged';

export type SubmissionRiskFlag =
  | 'highOtpAttempts'
  | 'ipMismatch'
  | 'rapidSubmission'
  | 'deliveryBounced';

const RISK_FLAG_LABELS: Record<SubmissionRiskFlag, string> = {
  highOtpAttempts: 'Mehrere OTP-Fehlversuche',
  ipMismatch: 'IP-Wechsel zwischen Verifikation und Einreichung',
  rapidSubmission: 'Einreichung unter 30 Sekunden nach Verifikation',
  deliveryBounced: 'E-Mail-Zustellung fehlgeschlagen',
};

export function getRiskFlagLabel(flag: SubmissionRiskFlag): string {
  return RISK_FLAG_LABELS[flag] ?? flag;
}

// ── Tier Resolution ─────────────────────────────────────────────────────────

export function resolveSubmissionTrustTier(
  submission: Pick<ExternalSubmission, 'rawPayloadSnapshot'>
): SubmissionTrustTier {
  const snapshot = submission.rawPayloadSnapshot;
  const riskFlags = extractRiskFlags(snapshot);

  if (riskFlags.length > 0) return 'flagged';
  if (isVerifiedSubmission(snapshot)) return 'verified';
  return 'legacy';
}

function isVerifiedSubmission(snapshot: Record<string, unknown>): boolean {
  return (
    typeof snapshot.verificationMethod === 'string' &&
    snapshot.verificationMethod.length > 0
  );
}

// ── Risk Flag Extraction ────────────────────────────────────────────────────

function extractRiskFlags(snapshot: Record<string, unknown>): SubmissionRiskFlag[] {
  const flags: SubmissionRiskFlag[] = [];

  // Flags stored on the submission snapshot by the submit route
  if (Array.isArray(snapshot.riskFlags)) {
    for (const flag of snapshot.riskFlags) {
      if (typeof flag === 'string' && isValidRiskFlag(flag)) {
        flags.push(flag);
      }
    }
  }

  return flags;
}

function isValidRiskFlag(flag: string): flag is SubmissionRiskFlag {
  return flag in RISK_FLAG_LABELS;
}

export function getSubmissionRiskFlags(
  submission: Pick<ExternalSubmission, 'rawPayloadSnapshot'>
): SubmissionRiskFlag[] {
  return extractRiskFlags(submission.rawPayloadSnapshot);
}

// ── Tier Labels ─────────────────────────────────────────────────────────────

const TIER_LABELS: Record<SubmissionTrustTier, string> = {
  verified: 'Verifiziert',
  legacy: 'Legacy',
  flagged: 'Auffaellig',
};

export function getTrustTierLabel(tier: SubmissionTrustTier): string {
  return TIER_LABELS[tier];
}

// ── Inbox Sort ──────────────────────────────────────────────────────────────

const TIER_SORT_ORDER: Record<SubmissionTrustTier, number> = {
  flagged: 0,
  legacy: 1,
  verified: 2,
};

export function compareSubmissionsByTrust(
  a: ExternalSubmission,
  b: ExternalSubmission
): number {
  const tierA = resolveSubmissionTrustTier(a);
  const tierB = resolveSubmissionTrustTier(b);

  const tierDiff = TIER_SORT_ORDER[tierA] - TIER_SORT_ORDER[tierB];
  if (tierDiff !== 0) return tierDiff;

  // Within the same tier: newest first
  return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
}
