import '@/lib/server-only-guard';

import { randomBytes } from 'node:crypto';

import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import {
  isPersonalAgentKitScope,
  type AgentKitApiKeyRecord,
} from '@/lib/agent-kit/api-keys';
import {
  resolveAgentOperatorRegisterLocation,
  toAgentOperatorRegisterView,
  toAgentOperatorRegisterViewForLocation,
  type AgentOperatorRegisterView,
} from '@/lib/agent-kit/operator';
import {
  buildRegisterUseCaseFromManifest,
  parseStudioUseCaseManifest,
  type StudioUseCaseManifest,
} from '@/lib/agent-kit/manifest';
import { sanitizeFirestorePayload } from '@/lib/register-first/firestore-sanitize';
import type { ServerRegisterLocation } from '@/lib/register-first/register-admin';
import {
  parseUseCaseCard,
} from '@/lib/register-first/schema';
import type { UseCaseCard } from '@/lib/register-first/types';

export const AGENT_OPERATOR_CANDIDATE_STATUS_VALUES = [
  'needs_review',
  'accepted',
  'rejected',
  'merged',
] as const;

export type AgentOperatorCandidateStatus =
  (typeof AGENT_OPERATOR_CANDIDATE_STATUS_VALUES)[number];

export const AGENT_OPERATOR_CANDIDATE_REVIEW_STATUS_VALUES = [
  'accepted',
  'rejected',
] as const;

export type AgentOperatorCandidateReviewStatus =
  (typeof AGENT_OPERATOR_CANDIDATE_REVIEW_STATUS_VALUES)[number];

export interface AgentOperatorEvidenceItem {
  evidenceId: string;
  source: string;
  sourceRef: string | null;
  observedAt: string;
  claim: string;
  confidence: number | null;
  excerpt: string | null;
  sensitive: boolean;
}

export interface AgentOperatorReviewQuestion {
  questionId: string;
  reason: string;
  question: string;
  blocks: string;
}

export interface AgentOperatorDuplicateHint {
  useCaseId: string;
  purpose: string;
  score: number;
  reason: string;
}

export interface AgentOperatorCandidateSource {
  agent: string;
  runId: string | null;
  localCandidateId: string | null;
}

export interface AgentOperatorCandidateReviewDecision {
  status: AgentOperatorCandidateReviewStatus;
  note: string | null;
  decidedAt: string;
  decidedByUserId: string;
  decidedByEmail: string | null;
}

export interface AgentOperatorCandidateMergeResult {
  useCaseId: string;
  mergedAt: string;
  mergedByUserId: string;
  mergedByEmail: string | null;
}

export interface AgentOperatorCandidateRecord {
  candidateId: string;
  registerId: string;
  ownerId: string;
  workspaceId: string | null;
  status: AgentOperatorCandidateStatus;
  title: string;
  purpose: string;
  systemSummary: string;
  confidence: number | null;
  blockedBy: string[];
  reviewQuestions: AgentOperatorReviewQuestion[];
  evidence: AgentOperatorEvidenceItem[];
  duplicateHints: AgentOperatorDuplicateHint[];
  manifest: StudioUseCaseManifest;
  source: AgentOperatorCandidateSource;
  reviewDecision: AgentOperatorCandidateReviewDecision | null;
  mergeResult: AgentOperatorCandidateMergeResult | null;
  createdAt: string;
  updatedAt: string;
  createdByKeyId: string;
  createdByUserId: string;
  createdByEmail: string | null;
}

export interface AgentOperatorCandidateSummary {
  candidateId: string;
  registerId: string;
  status: AgentOperatorCandidateStatus;
  title: string;
  purpose: string;
  systemSummary: string;
  confidence: number | null;
  blockedBy: string[];
  reviewQuestionCount: number;
  evidenceCount: number;
  duplicateHintCount: number;
  createdAt: string;
  updatedAt: string;
  source: AgentOperatorCandidateSource;
}

export interface AgentOperatorCandidateListResult {
  register: AgentOperatorRegisterView;
  candidates: AgentOperatorCandidateSummary[];
  count: number;
  limit: number;
}

export interface AgentOperatorCandidateDetailResult {
  register: AgentOperatorRegisterView;
  candidate: AgentOperatorCandidateRecord;
}

export interface AgentOperatorCandidateMergeDetailResult
  extends AgentOperatorCandidateDetailResult {
  useCase: UseCaseCard;
}

const DEFAULT_CANDIDATE_LIMIT = 50;
const MAX_CANDIDATE_LIMIT = 200;

const candidateEvidenceSchema = z.object({
  evidenceId: z.string().trim().min(1).max(120).optional(),
  source: z.string().trim().min(1).max(120).default('agent'),
  sourceRef: z.string().trim().min(1).max(500).optional().nullable(),
  observedAt: z.string().datetime().optional(),
  claim: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1).optional().nullable(),
  excerpt: z.string().trim().min(1).max(1000).optional().nullable(),
  sensitive: z.boolean().optional().default(false),
});

const candidateReviewQuestionSchema = z.object({
  questionId: z.string().trim().min(1).max(120).optional(),
  reason: z.string().trim().min(1).max(120),
  question: z.string().trim().min(1).max(500),
  blocks: z.string().trim().min(1).max(120).default('submission'),
});

const candidateDuplicateHintSchema = z.object({
  useCaseId: z.string().trim().min(1).max(200),
  purpose: z.string().trim().min(1).max(500),
  score: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(300),
});

const candidateSourceSchema = z.object({
  agent: z.string().trim().min(1).max(120).default('studio-agent'),
  runId: z.string().trim().min(1).max(200).optional().nullable(),
  localCandidateId: z.string().trim().min(1).max(200).optional().nullable(),
});

const candidateReviewDecisionSchema = z.object({
  status: z.enum(AGENT_OPERATOR_CANDIDATE_REVIEW_STATUS_VALUES),
  note: z.string().trim().min(1).max(1000).nullable(),
  decidedAt: z.string().datetime(),
  decidedByUserId: z.string().trim().min(1),
  decidedByEmail: z.string().trim().min(1).nullable(),
});

const candidateMergeResultSchema = z.object({
  useCaseId: z.string().trim().min(1),
  mergedAt: z.string().datetime(),
  mergedByUserId: z.string().trim().min(1),
  mergedByEmail: z.string().trim().min(1).nullable(),
});

export class AgentOperatorCandidateMergeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentOperatorCandidateMergeStateError';
  }
}

export const agentOperatorCandidatePayloadSchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  manifest: z.unknown(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  blockedBy: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  reviewQuestions: z.array(candidateReviewQuestionSchema).max(20).optional(),
  evidence: z.array(candidateEvidenceSchema).max(50).optional(),
  duplicateHints: z.array(candidateDuplicateHintSchema).max(20).optional(),
  source: candidateSourceSchema.optional(),
});

export type AgentOperatorCandidatePayload = z.infer<
  typeof agentOperatorCandidatePayloadSchema
>;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function createCandidateId(now: Date): string {
  return `cand_${now.getTime().toString(36)}_${randomBytes(6).toString('hex')}`;
}

function createGeneratedId(prefix: string, index: number): string {
  return `${prefix}_${index + 1}`;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN) || !value || value <= 0) {
    return DEFAULT_CANDIDATE_LIMIT;
  }

  return Math.min(Math.floor(value), MAX_CANDIDATE_LIMIT);
}

function buildSystemSummary(manifest: StudioUseCaseManifest): string {
  const [primarySystem, ...additionalSystems] = manifest.systems;
  if (!primarySystem) {
    return 'Kein System';
  }

  return additionalSystems.length > 0
    ? `${primarySystem.name} +${additionalSystems.length}`
    : primarySystem.name;
}

function toSummary(
  candidate: AgentOperatorCandidateRecord,
): AgentOperatorCandidateSummary {
  return {
    candidateId: candidate.candidateId,
    registerId: candidate.registerId,
    status: candidate.status,
    title: candidate.title,
    purpose: candidate.purpose,
    systemSummary: candidate.systemSummary,
    confidence: candidate.confidence,
    blockedBy: candidate.blockedBy,
    reviewQuestionCount: candidate.reviewQuestions.length,
    evidenceCount: candidate.evidence.length,
    duplicateHintCount: candidate.duplicateHints.length,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    source: candidate.source,
  };
}

function getCandidateScopeTypeForRecord(
  record: AgentKitApiKeyRecord,
): AgentOperatorRegisterView['scopeType'] {
  return isPersonalAgentKitScope(record.orgId, record.createdByUserId)
    ? 'personal'
    : 'workspace';
}

export function buildAgentOperatorCandidateRecord(input: {
  payload: AgentOperatorCandidatePayload;
  location: ServerRegisterLocation;
  record: AgentKitApiKeyRecord;
  now?: Date;
  candidateId?: string;
}): AgentOperatorCandidateRecord {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const manifest = parseStudioUseCaseManifest(input.payload.manifest);

  return {
    candidateId: input.candidateId ?? createCandidateId(now),
    registerId: input.location.registerId,
    ownerId: input.location.ownerId,
    workspaceId: input.location.register.workspaceId ?? null,
    status: 'needs_review',
    title: manifest.title,
    purpose: manifest.purpose,
    systemSummary: buildSystemSummary(manifest),
    confidence: input.payload.confidence ?? null,
    blockedBy: [...new Set(input.payload.blockedBy ?? [])],
    reviewQuestions: (input.payload.reviewQuestions ?? []).map(
      (question, index) => ({
        questionId: question.questionId ?? createGeneratedId('rq', index),
        reason: question.reason,
        question: question.question,
        blocks: question.blocks,
      }),
    ),
    evidence: (input.payload.evidence ?? []).map((evidence, index) => ({
      evidenceId: evidence.evidenceId ?? createGeneratedId('ev', index),
      source: evidence.source,
      sourceRef: normalizeOptionalText(evidence.sourceRef ?? null),
      observedAt: evidence.observedAt ?? nowIso,
      claim: evidence.claim,
      confidence: evidence.confidence ?? null,
      excerpt: normalizeOptionalText(evidence.excerpt ?? null),
      sensitive: evidence.sensitive,
    })),
    duplicateHints: input.payload.duplicateHints ?? [],
    manifest,
    source: {
      agent: input.payload.source?.agent ?? 'studio-agent',
      runId: normalizeOptionalText(input.payload.source?.runId ?? null),
      localCandidateId: normalizeOptionalText(
        input.payload.source?.localCandidateId ?? null,
      ),
    },
    reviewDecision: null,
    mergeResult: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdByKeyId: input.record.keyId,
    createdByUserId: input.record.createdByUserId,
    createdByEmail: input.record.createdByEmail ?? null,
  };
}

export function parseAgentOperatorCandidateRecord(
  input: unknown,
): AgentOperatorCandidateRecord {
  const parsed = z
    .object({
      candidateId: z.string().trim().min(1),
      registerId: z.string().trim().min(1),
      ownerId: z.string().trim().min(1),
      workspaceId: z.string().trim().min(1).nullable(),
      status: z.enum(AGENT_OPERATOR_CANDIDATE_STATUS_VALUES),
      title: z.string().trim().min(1),
      purpose: z.string().trim().min(1),
      systemSummary: z.string().trim().min(1),
      confidence: z.number().min(0).max(1).nullable(),
      blockedBy: z.array(z.string()),
      reviewQuestions: z.array(candidateReviewQuestionSchema.required({
        questionId: true,
      })),
      evidence: z.array(candidateEvidenceSchema.required({
        evidenceId: true,
        observedAt: true,
      })),
      duplicateHints: z.array(candidateDuplicateHintSchema),
      manifest: z.unknown(),
      source: candidateSourceSchema.required({
        runId: true,
        localCandidateId: true,
      }),
      reviewDecision: candidateReviewDecisionSchema.nullable().optional(),
      mergeResult: candidateMergeResultSchema.nullable().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      createdByKeyId: z.string().trim().min(1),
      createdByUserId: z.string().trim().min(1),
      createdByEmail: z.string().trim().min(1).nullable(),
    })
    .parse(input);

  return {
    ...parsed,
    evidence: parsed.evidence.map((evidence) => ({
      evidenceId: evidence.evidenceId,
      source: evidence.source,
      sourceRef: evidence.sourceRef ?? null,
      observedAt: evidence.observedAt,
      claim: evidence.claim,
      confidence: evidence.confidence ?? null,
      excerpt: evidence.excerpt ?? null,
      sensitive: evidence.sensitive,
    })),
    manifest: parseStudioUseCaseManifest(parsed.manifest),
    source: {
      agent: parsed.source.agent,
      runId: parsed.source.runId ?? null,
      localCandidateId: parsed.source.localCandidateId ?? null,
    },
    reviewDecision: parsed.reviewDecision ?? null,
    mergeResult: parsed.mergeResult ?? null,
  };
}

export async function createAgentOperatorCandidate(input: {
  record: AgentKitApiKeyRecord;
  payload: AgentOperatorCandidatePayload;
}): Promise<AgentOperatorCandidateDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.payload.registerId,
  );
  if (!location) {
    return null;
  }

  const candidate = buildAgentOperatorCandidateRecord({
    record: input.record,
    payload: input.payload,
    location,
  });

  await db
    .doc(
      `users/${location.ownerId}/registers/${location.registerId}/agentCandidates/${candidate.candidateId}`,
    )
    .set(sanitizeFirestorePayload(candidate), { merge: false });

  return {
    register: toAgentOperatorRegisterView(input.record, location),
    candidate,
  };
}

export async function listAgentOperatorCandidates(input: {
  record: AgentKitApiKeyRecord;
  registerId: string;
  status?: AgentOperatorCandidateStatus | null;
  limit?: number | null;
}): Promise<AgentOperatorCandidateListResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  return listAgentOperatorCandidatesForLocation({
    location,
    scopeType: getCandidateScopeTypeForRecord(input.record),
    status: input.status,
    limit: input.limit,
  });
}

export async function listAgentOperatorCandidatesForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  status?: AgentOperatorCandidateStatus | null;
  limit?: number | null;
}): Promise<AgentOperatorCandidateListResult> {
  const limit = normalizeLimit(input.limit);
  const snapshot = await db
    .collection(
      `users/${input.location.ownerId}/registers/${input.location.registerId}/agentCandidates`,
    )
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  const candidates = snapshot.docs
    .map((document) => {
      try {
        return parseAgentOperatorCandidateRecord(document.data());
      } catch (error) {
        console.warn('Skipping invalid operator candidate', {
          registerId: input.location.registerId,
          documentId: document.id,
          error,
        });
        return null;
      }
    })
    .filter(
      (candidate): candidate is AgentOperatorCandidateRecord =>
        candidate !== null,
    )
    .filter((candidate) =>
      input.status ? candidate.status === input.status : true,
    )
    .map(toSummary);

  return {
    register: toAgentOperatorRegisterViewForLocation(
      input.location,
      input.scopeType,
    ),
    candidates,
    count: candidates.length,
    limit,
  };
}

export async function getAgentOperatorCandidate(input: {
  record: AgentKitApiKeyRecord;
  registerId: string;
  candidateId: string;
}): Promise<AgentOperatorCandidateDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  return getAgentOperatorCandidateForLocation({
    location,
    scopeType: getCandidateScopeTypeForRecord(input.record),
    candidateId: input.candidateId,
  });
}

export async function getAgentOperatorCandidateForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  candidateId: string;
}): Promise<AgentOperatorCandidateDetailResult | null> {
  const snapshot = await db
    .doc(
      `users/${input.location.ownerId}/registers/${input.location.registerId}/agentCandidates/${input.candidateId}`,
    )
    .get();
  if (!snapshot.exists) {
    return null;
  }

  return {
    register: toAgentOperatorRegisterViewForLocation(
      input.location,
      input.scopeType,
    ),
    candidate: parseAgentOperatorCandidateRecord(snapshot.data()),
  };
}

export async function reviewAgentOperatorCandidateForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  candidateId: string;
  status: AgentOperatorCandidateReviewStatus;
  note?: string | null;
  decidedByUserId: string;
  decidedByEmail?: string | null;
  now?: Date;
}): Promise<AgentOperatorCandidateDetailResult | null> {
  const current = await getAgentOperatorCandidateForLocation({
    location: input.location,
    scopeType: input.scopeType,
    candidateId: input.candidateId,
  });
  if (!current) {
    return null;
  }

  const nowIso = (input.now ?? new Date()).toISOString();
  const reviewDecision: AgentOperatorCandidateReviewDecision = {
    status: input.status,
    note: normalizeOptionalText(input.note ?? null),
    decidedAt: nowIso,
    decidedByUserId: input.decidedByUserId,
    decidedByEmail: normalizeOptionalText(input.decidedByEmail ?? null),
  };
  const candidate: AgentOperatorCandidateRecord = {
    ...current.candidate,
    status: input.status,
    updatedAt: nowIso,
    reviewDecision,
  };

  await db
    .doc(
      `users/${input.location.ownerId}/registers/${input.location.registerId}/agentCandidates/${input.candidateId}`,
    )
    .set(
      sanitizeFirestorePayload({
        status: candidate.status,
        updatedAt: candidate.updatedAt,
        reviewDecision,
      }),
      { merge: true },
    );

  return {
    register: current.register,
    candidate,
  };
}

export async function mergeAgentOperatorCandidateForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  candidateId: string;
  duplicateReviewConfirmed?: boolean;
  mergedByUserId: string;
  mergedByEmail?: string | null;
  now?: Date;
}): Promise<AgentOperatorCandidateMergeDetailResult | null> {
  const candidateRef = db.doc(
    `users/${input.location.ownerId}/registers/${input.location.registerId}/agentCandidates/${input.candidateId}`,
  );
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const register = toAgentOperatorRegisterViewForLocation(
    input.location,
    input.scopeType,
  );
  let result: AgentOperatorCandidateMergeDetailResult | null = null;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(candidateRef);
    if (!snapshot.exists) {
      result = null;
      return;
    }

    const currentCandidate = parseAgentOperatorCandidateRecord(snapshot.data());
    if (currentCandidate.status !== 'accepted') {
      throw new AgentOperatorCandidateMergeStateError(
        'Nur akzeptierte Review-Kandidaten können übernommen werden.',
      );
    }

    if (currentCandidate.mergeResult) {
      throw new AgentOperatorCandidateMergeStateError(
        'Dieser Review-Kandidat wurde bereits übernommen.',
      );
    }

    if (
      currentCandidate.duplicateHints.length > 0 &&
      input.duplicateReviewConfirmed !== true
    ) {
      throw new AgentOperatorCandidateMergeStateError(
        'Dublettenhinweise müssen vor der Übernahme geprüft werden.',
      );
    }

    const useCase = buildRegisterUseCaseFromManifest({
      manifest: currentCandidate.manifest,
      createdByUserId: input.mergedByUserId,
      createdByEmail: input.mergedByEmail ?? null,
      now,
    });
    const useCaseWithCandidateLink = parseUseCaseCard({
      ...useCase,
      reviewHints: [
        ...useCase.reviewHints,
        `Agent candidate accepted from ${currentCandidate.candidateId}.`,
      ],
      labels: [
        ...(useCase.labels ?? []),
        {
          key: 'agent_candidate_id',
          value: currentCandidate.candidateId,
        },
      ],
    });
    const mergeResult: AgentOperatorCandidateMergeResult = {
      useCaseId: useCaseWithCandidateLink.useCaseId,
      mergedAt: nowIso,
      mergedByUserId: input.mergedByUserId,
      mergedByEmail: normalizeOptionalText(input.mergedByEmail ?? null),
    };
    const candidate: AgentOperatorCandidateRecord = {
      ...currentCandidate,
      status: 'merged',
      updatedAt: nowIso,
      mergeResult,
    };
    const useCaseRef = db.doc(
      `users/${input.location.ownerId}/registers/${input.location.registerId}/useCases/${useCaseWithCandidateLink.useCaseId}`,
    );

    transaction.set(useCaseRef, sanitizeFirestorePayload(useCaseWithCandidateLink), {
      merge: false,
    });
    transaction.set(
      candidateRef,
      sanitizeFirestorePayload({
        status: candidate.status,
        updatedAt: candidate.updatedAt,
        mergeResult,
      }),
      { merge: true },
    );

    result = {
      register,
      candidate,
      useCase: useCaseWithCandidateLink,
    };
  });

  return result;
}
