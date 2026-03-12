import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGovernanceSignOffWorkflow,
  createDefaultEnterpriseWorkspaceSettings,
  createExternalSubmissionApprovalWorkflow,
  getExternalSubmissionApprovalRoles,
  getGovernanceSignOffRoles,
  normalizeWorkspaceRole,
  recordApprovalDecision,
} from './workspace';

test('workspace role normalization supports reviewer and officer roles', () => {
  assert.equal(normalizeWorkspaceRole('REVIEWER'), 'REVIEWER');
  assert.equal(normalizeWorkspaceRole('EXTERNAL_OFFICER'), 'EXTERNAL_OFFICER');
  assert.equal(normalizeWorkspaceRole('unknown'), 'MEMBER');
});

test('default enterprise settings provide enterprise-ready controls', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings(
    '2026-03-12T10:00:00.000Z',
  );

  assert.equal(settings.approvalPolicy.externalSubmissions, 'reviewer');
  assert.equal(settings.retentionPolicy.immutableAuditExportsDays, 365);
  assert.equal(settings.notifications.hooks.length, 0);
  assert.equal(settings.scim.defaultRole, 'MEMBER');
});

test('external submission approval workflows derive required roles from policy', () => {
  assert.deepEqual(getExternalSubmissionApprovalRoles('none'), []);
  assert.deepEqual(getExternalSubmissionApprovalRoles('reviewer'), [
    'REVIEWER',
  ]);
  assert.deepEqual(getExternalSubmissionApprovalRoles('reviewer_plus_officer'), [
    'REVIEWER',
    'EXTERNAL_OFFICER',
  ]);
  assert.deepEqual(getGovernanceSignOffRoles('none'), []);
  assert.deepEqual(getGovernanceSignOffRoles('admin'), ['ADMIN']);
  assert.deepEqual(getGovernanceSignOffRoles('external_officer'), [
    'EXTERNAL_OFFICER',
  ]);
});

test('approval workflow requires all configured roles before completion', () => {
  const workflow = createExternalSubmissionApprovalWorkflow(
    {
      ...createDefaultEnterpriseWorkspaceSettings(),
      approvalPolicy: {
        externalSubmissions: 'reviewer_plus_officer',
        governanceSignOff: 'admin',
        autoCreateUseCaseOnApproval: false,
      },
    },
    {
      requestedAt: '2026-03-12T10:00:00.000Z',
      requestedBy: 'owner_1',
    },
  );

  assert.ok(workflow);
  const afterReviewer = recordApprovalDecision(workflow, {
    actorRole: 'REVIEWER',
    actorUserId: 'reviewer_1',
    decision: 'approved',
    decidedAt: '2026-03-12T10:10:00.000Z',
  });
  assert.equal(afterReviewer?.status, 'pending');

  const afterOfficer = recordApprovalDecision(afterReviewer, {
    actorRole: 'EXTERNAL_OFFICER',
    actorUserId: 'officer_1',
    decision: 'approved',
    decidedAt: '2026-03-12T10:20:00.000Z',
  });
  assert.equal(afterOfficer?.status, 'approved');
  assert.equal(afterOfficer?.decisions.length, 2);
});

test('governance sign-off workflows resolve from enterprise settings', () => {
  const workflow = createGovernanceSignOffWorkflow(
    {
      ...createDefaultEnterpriseWorkspaceSettings(),
      approvalPolicy: {
        externalSubmissions: 'reviewer',
        governanceSignOff: 'external_officer',
        autoCreateUseCaseOnApproval: false,
      },
    },
    {
      requestedAt: '2026-03-12T10:00:00.000Z',
      requestedBy: 'owner_1',
    },
  );

  assert.deepEqual(workflow?.requiredRoles, ['EXTERNAL_OFFICER']);
});
