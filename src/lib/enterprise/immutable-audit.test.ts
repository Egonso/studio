import assert from 'node:assert/strict';
import test from 'node:test';

import { buildImmutableAuditExport } from './immutable-audit';
import {
  createDefaultEnterpriseWorkspaceSettings,
  createWorkspaceRecord,
} from './workspace';

test('immutable audit export creates a chained event log', () => {
  const workspace = createWorkspaceRecord({
    orgId: 'org_enterprise',
    name: 'Enterprise Workspace',
    ownerUserId: 'owner_1',
    createdAt: '2026-03-12T10:00:00.000Z',
  });

  const exportBundle = buildImmutableAuditExport({
    workspace: {
      ...workspace,
      enterpriseSettings: {
        ...createDefaultEnterpriseWorkspaceSettings(
          '2026-03-12T11:00:00.000Z',
        ),
        notifications: {
          emailDigest: 'daily',
          hooks: [],
        },
      },
    },
    members: [
      {
        userId: 'reviewer_1',
        email: 'reviewer@example.com',
        role: 'REVIEWER',
        status: 'active',
        source: 'direct',
        joinedAt: '2026-03-12T10:10:00.000Z',
      },
    ],
    pendingInvites: [],
    generatedAt: '2026-03-12T12:00:00.000Z',
  });

  assert.equal(exportBundle.workspaceId, 'org_enterprise');
  assert.equal(exportBundle.eventCount >= 2, true);
  assert.ok(exportBundle.finalHash);
  assert.equal(exportBundle.events[0]?.previousHash, null);
  assert.ok(exportBundle.events[1]?.previousHash);
});
