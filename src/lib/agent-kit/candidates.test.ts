import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAgentOperatorCandidateRecord,
  buildMergedUseCaseFromCandidate,
  parseAgentOperatorCandidateRecord,
} from '@/lib/agent-kit/candidates';
import type { AgentKitApiKeyRecord } from '@/lib/agent-kit/api-keys';
import type { ServerRegisterLocation } from '@/lib/register-first/register-admin';

const keyRecord: AgentKitApiKeyRecord = {
  keyId: 'akit_test',
  orgId: 'ws_test',
  label: 'Operator candidate key',
  keyHash: 'hash',
  keyPreview: 'akv1.ws_test.akit_test.secret',
  scopes: ['write:candidate'],
  createdAt: '2026-06-17T09:00:00.000Z',
  createdByUserId: 'user_test',
  createdByEmail: 'momo@example.com',
  lastUsedAt: null,
  lastSubmittedUseCaseId: null,
  revokedAt: null,
};

const location: ServerRegisterLocation = {
  ownerId: 'owner_test',
  registerId: 'reg_test',
  register: {
    registerId: 'reg_test',
    name: 'Test Register',
    createdAt: '2026-06-17T08:00:00.000Z',
    workspaceId: 'ws_test',
  },
};

test('buildAgentOperatorCandidateRecord stores review object separate from use cases', () => {
  const candidate = buildAgentOperatorCandidateRecord({
    record: keyRecord,
    location,
    candidateId: 'cand_test',
    now: new Date('2026-06-17T10:00:00.000Z'),
    payload: {
      registerId: 'reg_test',
      manifest: {
        documentationType: 'workflow',
        title: 'Support answer assistant',
        purpose: 'Draft support answers for human review.',
        ownerRole: 'Support Lead',
        isCurrentlyResponsible: true,
        usageContexts: ['CUSTOMERS'],
        decisionInfluence: 'PREPARATION',
        dataCategories: ['PERSONAL_DATA'],
        systems: [
          { position: 1, name: 'Zendesk' },
          { position: 2, name: 'OpenAI' },
        ],
        humansInLoop: ['Agent checks each answer before sending'],
        controls: ['Human approval remains mandatory'],
      },
      confidence: 0.78,
      blockedBy: ['personal-or-sensitive-data'],
      reviewQuestions: [
        {
          reason: 'personal-or-sensitive-data',
          question: 'Which customer data categories are processed?',
          blocks: 'submission',
        },
      ],
      evidence: [
        {
          source: 'repository',
          sourceRef: 'package.json',
          claim: 'OpenAI dependency detected',
          confidence: 0.82,
          sensitive: false,
        },
      ],
      duplicateHints: [
        {
          useCaseId: 'uc_existing',
          purpose: 'Draft support ticket summaries.',
          score: 0.51,
          reason: 'similar support purpose',
        },
      ],
      source: {
        agent: 'studio-agent',
        runId: 'run_123',
        localCandidateId: 'local_123',
      },
    },
  });

  assert.equal(candidate.candidateId, 'cand_test');
  assert.equal(candidate.status, 'needs_review');
  assert.equal(candidate.registerId, 'reg_test');
  assert.equal(candidate.ownerId, 'owner_test');
  assert.equal(candidate.workspaceId, 'ws_test');
  assert.equal(candidate.systemSummary, 'Zendesk +1');
  assert.equal(candidate.reviewQuestions[0]?.questionId, 'rq_1');
  assert.equal(candidate.evidence[0]?.evidenceId, 'ev_1');
  assert.equal(candidate.createdByKeyId, 'akit_test');
  assert.equal(candidate.reviewDecision, null);
});

test('parseAgentOperatorCandidateRecord normalizes embedded manifest', () => {
  const candidate = buildAgentOperatorCandidateRecord({
    record: keyRecord,
    location,
    candidateId: 'cand_test',
    now: new Date('2026-06-17T10:00:00.000Z'),
    payload: {
      registerId: 'reg_test',
      manifest: {
        documentationType: 'application',
        title: 'Policy note assistant',
        purpose: 'Draft internal policy notes for review.',
        ownerRole: 'Compliance Lead',
        usageContexts: ['EMPLOYEES'],
        systems: [{ position: 1, name: 'Claude' }],
      },
    },
  });

  const parsed = parseAgentOperatorCandidateRecord(
    JSON.parse(JSON.stringify({
      ...candidate,
      status: 'accepted',
      reviewDecision: {
        status: 'accepted',
        note: 'Plausibel nach Fachreview.',
        decidedAt: '2026-06-17T11:00:00.000Z',
        decidedByUserId: 'reviewer_test',
        decidedByEmail: 'reviewer@example.com',
      },
      mergeResult: {
        useCaseId: 'uc_merged',
        mergedAt: '2026-06-17T12:00:00.000Z',
        mergedByUserId: 'reviewer_test',
        mergedByEmail: 'reviewer@example.com',
      },
    })),
  );

  assert.equal(parsed.candidateId, 'cand_test');
  assert.equal(parsed.manifest.title, 'Policy note assistant');
  assert.equal(parsed.source.agent, 'studio-agent');
  assert.equal(parsed.reviewDecision?.status, 'accepted');
  assert.equal(parsed.reviewDecision?.note, 'Plausibel nach Fachreview.');
  assert.equal(parsed.mergeResult?.useCaseId, 'uc_merged');
});

test('buildMergedUseCaseFromCandidate records candidate origin for the timeline', () => {
  const candidate = buildAgentOperatorCandidateRecord({
    record: keyRecord,
    location,
    candidateId: 'cand_timeline',
    now: new Date('2026-06-17T10:00:00.000Z'),
    payload: {
      registerId: 'reg_test',
      manifest: {
        documentationType: 'workflow',
        title: 'Invoice triage assistant',
        purpose: 'Prepare invoice triage notes for accounting review.',
        ownerRole: 'Accounting Lead',
        usageContexts: ['EMPLOYEES'],
        systems: [{ position: 1, name: 'Lexware' }],
      },
      evidence: [
        {
          source: 'repository',
          sourceRef: 'docs/invoice-flow.md',
          claim: 'Invoice triage notes are prepared with AI support.',
          confidence: 0.8,
          sensitive: false,
        },
      ],
    },
  });

  const useCase = buildMergedUseCaseFromCandidate({
    candidate: {
      ...candidate,
      status: 'accepted',
    },
    actorUserId: 'reviewer_test',
    actorEmail: 'reviewer@example.com',
    now: new Date('2026-06-17T12:00:00.000Z'),
  });
  const manualEdits = useCase.manualEdits ?? [];

  assert.equal(manualEdits.length, 1);
  assert.equal(manualEdits[0]?.editId, 'agent_candidate_merge_cand_timeline');
  assert.equal(manualEdits[0]?.editedBy, 'reviewer_test');
  assert.equal(manualEdits[0]?.editedByName, 'reviewer@example.com');
  assert.deepEqual(manualEdits[0]?.changedFields, [
    'origin',
    'labels',
    'reviewHints',
    'evidences',
  ]);
  assert.ok(
    useCase.reviewHints.some((hint) =>
      hint.includes('cand_timeline'),
    ),
  );
  assert.ok(
    useCase.labels?.some(
      (label) =>
        label.key === 'agent_candidate_id' && label.value === 'cand_timeline',
    ),
  );
  assert.ok(
    useCase.evidences.some((evidence) =>
      evidence.evidenceId.startsWith('agent_candidate_'),
    ),
  );
});
