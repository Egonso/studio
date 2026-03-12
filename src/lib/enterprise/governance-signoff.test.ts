import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyGovernanceSignOffDecision,
  createGovernanceSignOffRecord,
} from './governance-signoff';
import { createDefaultEnterpriseWorkspaceSettings } from './workspace';

test('governance sign-off requests use the configured approval policy', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings('2026-03-12T10:00:00.000Z');
  settings.approvalPolicy.governanceSignOff = 'external_officer';

  const signOff = createGovernanceSignOffRecord({
    workspaceId: 'org_enterprise',
    settings,
    requestedByUserId: 'admin_1',
    requestedByEmail: 'admin@example.com',
  });

  assert.equal(signOff.status, 'pending');
  assert.deepEqual(signOff.approvalWorkflow?.requiredRoles, ['EXTERNAL_OFFICER']);
});

test('governance sign-off can complete after the required decision', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings('2026-03-12T10:00:00.000Z');
  settings.approvalPolicy.governanceSignOff = 'admin';

  const signOff = createGovernanceSignOffRecord({
    workspaceId: 'org_enterprise',
    settings,
    requestedByUserId: 'owner_1',
  });

  const approved = applyGovernanceSignOffDecision({
    signOff,
    actorRole: 'ADMIN',
    actorUserId: 'admin_1',
    decision: 'approved',
    decidedAt: '2026-03-12T11:00:00.000Z',
  });

  assert.equal(approved.status, 'approved');
  assert.equal(approved.resolvedByUserId, 'admin_1');
  assert.equal(approved.approvalWorkflow?.status, 'approved');
});
