import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRegisterUseCaseFromManifest } from '@/lib/agent-kit/manifest';
import {
  toAgentOperatorUseCaseDetail,
  toAgentOperatorUseCaseSummary,
} from '@/lib/agent-kit/operator';

test('operator use case summary exposes bounded read fields for agents', () => {
  const card = buildRegisterUseCaseFromManifest({
    manifest: {
      documentationType: 'workflow',
      title: 'Support triage assistant',
      slug: 'support-triage-assistant',
      summary: 'AI drafts ticket summaries before human review.',
      purpose: 'Prepare support ticket summaries for human review.',
      ownerRole: 'Support Lead',
      contactPersonName: 'Momo',
      isCurrentlyResponsible: true,
      usageContexts: ['CUSTOMERS'],
      decisionInfluence: 'PREPARATION',
      dataCategories: ['PERSONAL_DATA'],
      systems: [
        { position: 1, name: 'Zendesk', providerType: 'TOOL' },
        { position: 2, name: 'OpenAI', providerType: 'MODEL' },
      ],
      workflow: {
        connectionMode: 'SEMI_AUTOMATED',
        summary: 'Ticket enters Zendesk, AI drafts, human reviews.',
      },
      triggers: [],
      steps: [],
      humansInLoop: ['Support agent checks every external answer'],
      risks: [],
      controls: ['Human approval remains mandatory'],
      artifacts: ['Prompt template'],
      tags: ['support'],
      capturedBy: {
        name: 'Momo',
        team: 'Support',
      },
    },
    createdByUserId: 'user_123',
    createdByEmail: 'momo@example.com',
    now: new Date('2026-06-17T10:00:00.000Z'),
    useCaseId: 'uc_operator_1',
  });

  const summary = toAgentOperatorUseCaseSummary(card);

  assert.equal(summary.useCaseId, 'uc_operator_1');
  assert.equal(summary.status, 'UNREVIEWED');
  assert.equal(summary.systemSummary, 'Zendesk +1');
  assert.deepEqual(
    summary.systems.map((system) => system.displayName),
    ['Zendesk', 'OpenAI'],
  );
  assert.deepEqual(summary.dataCategories, ['PERSONAL_DATA']);
  assert.equal(summary.evidenceCount, 1);
});

test('operator use case detail keeps the canonical card for read-only diffing', () => {
  const card = buildRegisterUseCaseFromManifest({
    manifest: {
      documentationType: 'application',
      title: 'Policy assistant',
      slug: 'policy-assistant',
      purpose: 'Draft internal policy notes for review.',
      ownerRole: 'Compliance Lead',
      isCurrentlyResponsible: true,
      usageContexts: ['EMPLOYEES'],
      decisionInfluence: 'ASSISTANCE',
      dataCategories: ['INTERNAL_CONFIDENTIAL'],
      systems: [{ position: 1, name: 'Claude', providerType: 'MODEL' }],
      triggers: [],
      steps: [],
      humansInLoop: ['Compliance lead reviews every note'],
      risks: [],
      controls: [],
      artifacts: [],
      tags: [],
    },
    createdByUserId: 'user_123',
    now: new Date('2026-06-17T10:00:00.000Z'),
    useCaseId: 'uc_operator_2',
  });

  const detail = toAgentOperatorUseCaseDetail(card);

  assert.equal(detail.card.useCaseId, 'uc_operator_2');
  assert.equal(detail.card.purpose, detail.purpose);
  assert.equal(detail.workflow, null);
});
