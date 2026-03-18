import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentKitScopeOptions } from '@/lib/agent-kit/scope-options';

test('buildAgentKitScopeOptions always prepends the personal scope', () => {
  const scopes = buildAgentKitScopeOptions({
    userId: 'user_123',
    workspaces: [
      {
        orgId: 'ws_alpha',
        name: 'Alpha GmbH',
        role: 'ADMIN',
      },
    ],
  });

  assert.deepEqual(scopes, [
    {
      orgId: 'user_123',
      orgName: 'Mein Register',
      role: 'OWNER',
      scopeType: 'personal',
    },
    {
      orgId: 'ws_alpha',
      orgName: 'Alpha GmbH',
      role: 'ADMIN',
      scopeType: 'workspace',
    },
  ]);
});

test('buildAgentKitScopeOptions avoids duplicating a workspace that matches the personal scope id', () => {
  const scopes = buildAgentKitScopeOptions({
    userId: 'user_123',
    workspaces: [
      {
        orgId: 'user_123',
        name: 'Legacy Personal Workspace',
        role: 'OWNER',
      },
      {
        orgId: 'ws_beta',
        name: 'Beta GmbH',
        role: 'MEMBER',
      },
    ],
  });

  assert.equal(scopes.length, 2);
  assert.equal(scopes[0]?.scopeType, 'personal');
  assert.equal(scopes[1]?.orgId, 'ws_beta');
});
