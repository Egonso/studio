import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAgentOperatorRunRecord,
  parseAgentOperatorRunRecord,
} from '@/lib/agent-kit/runs';
import type { AgentKitApiKeyRecord } from '@/lib/agent-kit/api-keys';
import type { ServerRegisterLocation } from '@/lib/register-first/register-admin';

const keyRecord: AgentKitApiKeyRecord = {
  keyId: 'akit_runs',
  orgId: 'ws_runs',
  label: 'Operator run key',
  keyHash: 'hash',
  keyPreview: 'akv1.ws_runs.akit_runs.secret',
  scopes: ['write:candidate'],
  createdAt: '2026-06-17T09:00:00.000Z',
  createdByUserId: 'user_runs',
  createdByEmail: 'runner@example.com',
  lastUsedAt: null,
  lastSubmittedUseCaseId: null,
  revokedAt: null,
};

const location: ServerRegisterLocation = {
  ownerId: 'owner_runs',
  registerId: 'reg_runs',
  register: {
    registerId: 'reg_runs',
    name: 'Run Register',
    createdAt: '2026-06-17T08:00:00.000Z',
    workspaceId: 'ws_runs',
  },
};

test('buildAgentOperatorRunRecord stores run protocol separate from candidates', () => {
  const run = buildAgentOperatorRunRecord({
    record: keyRecord,
    location,
    now: new Date('2026-06-17T10:00:00.000Z'),
    payload: {
      registerId: 'reg_runs',
      runId: 'run_20260617_001',
      status: 'needs_review',
      mode: 'draft-only',
      cadence: 'daily',
      startedAt: '2026-06-17T09:59:00.000Z',
      completedAt: '2026-06-17T10:00:00.000Z',
      sourceCount: 3,
      evidenceCount: 5,
      candidateCount: 2,
      reviewQuestionCount: 4,
      skippedSourceCount: 1,
      skippedSources: [
        {
          source: 'tmp/outside',
          resolvedPath: '/tmp/outside',
          reason: 'outside-workspace',
        },
      ],
      source: {
        agent: 'studio-agent',
        localRunPath: '_autopilot-evidence/run_20260617_001.json',
      },
    },
  });

  assert.equal(run.runId, 'run_20260617_001');
  assert.equal(run.registerId, 'reg_runs');
  assert.equal(run.ownerId, 'owner_runs');
  assert.equal(run.workspaceId, 'ws_runs');
  assert.equal(run.status, 'needs_review');
  assert.equal(run.candidateCount, 2);
  assert.equal(run.reviewQuestionCount, 4);
  assert.equal(run.skippedSources[0]?.reason, 'outside-workspace');
  assert.equal(run.source.agent, 'studio-agent');
  assert.equal(run.createdByKeyId, 'akit_runs');
});

test('parseAgentOperatorRunRecord normalizes optional protocol fields', () => {
  const parsed = parseAgentOperatorRunRecord({
    runId: 'run_minimal',
    registerId: 'reg_runs',
    ownerId: 'owner_runs',
    status: 'no_candidates',
    startedAt: '2026-06-17T09:00:00.000Z',
    createdAt: '2026-06-17T09:00:00.000Z',
    updatedAt: '2026-06-17T09:01:00.000Z',
    createdByKeyId: 'akit_runs',
    createdByUserId: 'user_runs',
  });

  assert.equal(parsed.workspaceId, null);
  assert.equal(parsed.mode, null);
  assert.equal(parsed.completedAt, null);
  assert.equal(parsed.sourceCount, 0);
  assert.equal(parsed.source.agent, 'studio-agent');
});
