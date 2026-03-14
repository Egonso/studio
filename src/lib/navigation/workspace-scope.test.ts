import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendWorkspaceScope,
  buildScopedRegisterHref,
  buildScopedUseCaseDetailHref,
  buildScopedUseCasePassHref,
  normalizeWorkspaceScope,
  resolveWorkspaceScope,
} from './workspace-scope';
import { buildUseCaseFocusLink } from '@/lib/control/deep-link';

test('normalizeWorkspaceScope treats personal and empty values as personal mode', () => {
  assert.equal(normalizeWorkspaceScope(null), null);
  assert.equal(normalizeWorkspaceScope(''), null);
  assert.equal(normalizeWorkspaceScope('personal'), null);
  assert.equal(normalizeWorkspaceScope('workspace_123'), 'workspace_123');
});

test('resolveWorkspaceScope prefers explicit query scope and falls back to active session', () => {
  const workspaceParams = new URLSearchParams('workspace=workspace_123');
  const personalParams = new URLSearchParams('workspace=personal');
  const emptyParams = new URLSearchParams('');

  assert.equal(resolveWorkspaceScope(workspaceParams, 'workspace_999'), 'workspace_123');
  assert.equal(resolveWorkspaceScope(personalParams, 'workspace_999'), null);
  assert.equal(resolveWorkspaceScope(emptyParams, 'workspace_999'), 'workspace_999');
});

test('appendWorkspaceScope preserves existing query params and hashes', () => {
  assert.equal(
    appendWorkspaceScope('/my-register?filter=supplier_requests#top', 'workspace_123'),
    '/my-register?filter=supplier_requests&workspace=workspace_123#top',
  );
  assert.equal(
    appendWorkspaceScope('/my-register?filter=supplier_requests&workspace=workspace_123', null),
    '/my-register?filter=supplier_requests',
  );
});

test('scoped register and use case builders generate canonical scoped URLs', () => {
  assert.equal(
    buildScopedRegisterHref('workspace_123', {
      filter: 'supplier_requests',
      onboarding: true,
    }),
    '/my-register?filter=supplier_requests&onboarding=true&workspace=workspace_123',
  );
  assert.equal(
    buildScopedUseCaseDetailHref('uc_123', 'workspace_123'),
    '/my-register/uc_123?workspace=workspace_123',
  );
  assert.equal(
    buildScopedUseCasePassHref('uc_123', 'workspace_123'),
    '/pass/uc_123?workspace=workspace_123',
  );
});

test('use case focus links can be scoped without changing their existing query shape', () => {
  assert.equal(
    buildUseCaseFocusLink('uc_123', 'governance', {
      edit: true,
      field: 'reviewCycle',
      workspaceScope: 'workspace_123',
    }),
    '/my-register/uc_123?focus=governance&edit=1&field=reviewCycle&workspace=workspace_123',
  );
});
