import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasAgentKitApiKeyScope,
  hasAgentKitApiKeyScopes,
  issueAgentKitApiKey,
  normalizeAgentKitApiKeyScopes,
} from '@/lib/agent-kit/api-keys';

test('Agent Kit keys default to submit-only scope for backward compatibility', () => {
  const issued = issueAgentKitApiKey({
    orgId: 'ws_alpha',
    label: 'Legacy submit key',
    createdByUserId: 'user_123',
    now: new Date('2026-06-17T10:00:00.000Z'),
  });

  assert.deepEqual(issued.record.scopes, ['submit:usecase']);
  assert.equal(hasAgentKitApiKeyScope(issued.record, 'submit:usecase'), true);
  assert.equal(hasAgentKitApiKeyScope(issued.record, 'read:register'), false);
});

test('Agent Kit scope normalization keeps only supported unique scopes', () => {
  assert.deepEqual(
    normalizeAgentKitApiKeyScopes([
      'read:register',
      'read:register',
      'unknown',
      'read:usecase',
    ]),
    ['read:register', 'read:usecase'],
  );
});

test('Agent Kit read-only operator keys do not imply submit permission', () => {
  const issued = issueAgentKitApiKey({
    orgId: 'ws_alpha',
    label: 'Read only operator',
    scopes: ['read:register', 'read:usecase'],
    createdByUserId: 'user_123',
    now: new Date('2026-06-17T10:00:00.000Z'),
  });

  assert.equal(
    hasAgentKitApiKeyScopes(issued.record, ['read:register', 'read:usecase']),
    true,
  );
  assert.equal(hasAgentKitApiKeyScope(issued.record, 'submit:usecase'), false);
});
