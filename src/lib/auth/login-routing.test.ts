import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthPath,
  getInitialAuthIntent,
  getInitialAuthMode,
  readLoginRouteOptions,
} from './login-routing';

test('buildAuthPath keeps the root route as the canonical auth entry', () => {
  assert.equal(
    buildAuthPath({
      code: 'AI-123456',
      email: 'test@example.com',
      importUseCase: 'PUBLIC_123',
      intent: 'join_register',
      mode: 'signup',
      sessionId: 'cs_test_123',
      workspaceInvite: 'invite_123',
    }),
    '/?mode=signup&intent=join_register&email=test%40example.com&code=AI-123456&workspaceInvite=invite_123&importUseCase=PUBLIC_123&session_id=cs_test_123',
  );
});

test('readLoginRouteOptions accepts both session_id and checkout_session_id', () => {
  const fromSession = readLoginRouteOptions(
    new URLSearchParams('mode=login&session_id=cs_123'),
  );
  const fromCheckout = readLoginRouteOptions(
    new URLSearchParams('intent=create_register&checkout_session_id=cs_456'),
  );

  assert.equal(fromSession.mode, 'login');
  assert.equal(fromSession.sessionId, 'cs_123');
  assert.equal(fromCheckout.intent, 'create_register');
  assert.equal(fromCheckout.sessionId, 'cs_456');
});

test('initial auth defaults prefer the single root signup flow', () => {
  assert.equal(getInitialAuthMode({}), 'signup');
  assert.equal(getInitialAuthIntent({}), 'create_register');
  assert.equal(getInitialAuthIntent({ code: 'AI-123456' }), 'join_register');
  assert.equal(
    getInitialAuthMode({ importUseCase: 'PUBLIC_123', mode: null }),
    'signup',
  );
});
