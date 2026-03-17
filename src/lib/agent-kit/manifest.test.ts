import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRegisterCaptureFromManifest,
  buildRegisterUseCaseFromManifest,
  buildSubmittedUseCaseUrls,
  parseStudioUseCaseManifest,
} from '@/lib/agent-kit/manifest';

test('parseStudioUseCaseManifest sorts systems by position', () => {
  const manifest = parseStudioUseCaseManifest({
    documentationType: 'workflow',
    title: 'Invoice review workflow',
    purpose: 'Prepare invoice mismatches for finance review.',
    ownerRole: 'Finance Lead',
    usageContexts: ['EMPLOYEES'],
    systems: [
      { position: 2, name: 'Claude' },
      { position: 1, name: 'SAP' },
    ],
  });

  assert.deepEqual(
    manifest.systems.map((system) => system.name),
    ['SAP', 'Claude'],
  );
});

test('buildRegisterCaptureFromManifest maps primary and additional systems cleanly', () => {
  const capture = buildRegisterCaptureFromManifest({
    documentationType: 'application',
    title: 'Support copilot',
    purpose: 'Draft support replies for human review.',
    ownerRole: 'Support Lead',
    isCurrentlyResponsible: true,
    usageContexts: ['CUSTOMERS'],
    decisionInfluence: 'PREPARATION',
    dataCategories: ['PERSONAL_DATA'],
    systems: [
      { position: 1, name: 'Zendesk', providerType: 'TOOL' },
      { position: 2, name: 'Claude', providerType: 'MODEL' },
      { position: 3, name: 'Internal CRM', providerType: 'INTERNAL' },
    ],
    workflow: {
      connectionMode: 'SEMI_AUTOMATED',
      summary: 'Ticket enters Zendesk, AI drafts, human approves.',
    },
    triggers: [],
    steps: [],
    humansInLoop: [],
    risks: [],
    controls: [],
    artifacts: [],
    tags: [],
    capturedBy: {
      team: 'Customer Operations',
    },
  });

  assert.equal(capture.toolId, 'other');
  assert.equal(capture.toolFreeText, 'Zendesk');
  assert.equal(capture.workflow?.additionalSystems.length, 2);
  assert.equal(capture.workflow?.additionalSystems[0]?.toolFreeText, 'Claude');
  assert.equal(capture.workflow?.connectionMode, 'SEMI_AUTOMATED');
  assert.equal(capture.organisation, 'Customer Operations');
});

test('buildRegisterUseCaseFromManifest creates an import-origin register card', () => {
  const useCase = buildRegisterUseCaseFromManifest({
    manifest: {
      documentationType: 'process',
      title: 'Vendor due diligence assistant',
      slug: 'vendor-due-diligence-assistant',
      summary: 'Screen procurement dossiers before legal review.',
      purpose: 'Prepare supplier summaries for procurement review.',
      ownerRole: 'Procurement Lead',
      isCurrentlyResponsible: true,
      usageContexts: ['EMPLOYEES'],
      decisionInfluence: 'PREPARATION',
      dataCategories: ['INTERNAL_CONFIDENTIAL'],
      systems: [
        { position: 1, name: 'SharePoint', providerType: 'TOOL' },
        { position: 2, name: 'Claude', providerType: 'MODEL' },
      ],
      humansInLoop: ['Procurement lead approves every recommendation'],
      triggers: [],
      steps: [],
      controls: ['Human approval remains mandatory'],
      risks: ['Missing supplier red flags'],
      artifacts: ['Supplier checklist'],
      tags: ['procurement'],
      capturedBy: {
        name: 'Momo',
        team: 'Operations',
      },
    },
    createdByUserId: 'user_123',
    createdByEmail: 'momo@example.com',
    now: new Date('2026-03-17T10:00:00.000Z'),
    useCaseId: 'uc_agent_kit_1',
  });

  assert.equal(useCase.useCaseId, 'uc_agent_kit_1');
  assert.equal(useCase.origin?.source, 'import');
  assert.equal(useCase.origin?.capturedByUserId, 'user_123');
  assert.equal(useCase.toolFreeText, 'SharePoint');
  assert.equal(useCase.workflow?.additionalSystems[0]?.toolFreeText, 'Claude');
  assert.equal(useCase.labels?.some((label) => label.key === 'source' && label.value === 'agent_kit_api'), true);
  assert.equal(useCase.reviewHints?.[0], 'Summary: Screen procurement dossiers before legal review.');
  assert.equal(useCase.evidences?.[0]?.label, 'Supplier checklist');
  assert.equal(useCase.capturedViaCode, true);
});

test('buildSubmittedUseCaseUrls builds a scoped KI-Register detail URL', () => {
  const urls = buildSubmittedUseCaseUrls({
    useCaseId: 'uc_agent_kit_1',
    workspaceId: 'ws_demo',
  });

  assert.match(urls.detailPath, /uc_agent_kit_1/);
  assert.match(urls.detailPath, /ws_demo/);
  assert.match(urls.detailUrl, /^https?:\/\//);
});
