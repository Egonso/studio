import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFreeRegisterEntitlement,
  getEntitlementAccessPlan,
  getHigherPlan,
  resolveRegisterEntitlement,
  resolveRegisterPlan,
} from './entitlement';

test('new registers default to an active free entitlement', () => {
  const entitlement = createFreeRegisterEntitlement('2026-03-12T10:00:00.000Z');

  assert.equal(entitlement.plan, 'free');
  assert.equal(entitlement.status, 'active');
  assert.equal(entitlement.source, 'default_free');
  assert.equal(entitlement.updatedAt, '2026-03-12T10:00:00.000Z');
});

test('resolver prefers explicit entitlement over legacy plan field', () => {
  const entitlement = resolveRegisterEntitlement({
    createdAt: '2026-03-12T10:00:00.000Z',
    plan: 'free',
    entitlement: {
      plan: 'enterprise',
      status: 'active',
      source: 'manual',
      updatedAt: '2026-03-12T11:00:00.000Z',
    },
  });

  assert.equal(entitlement.plan, 'enterprise');
  assert.equal(entitlement.source, 'manual');
});

test('resolver falls back to legacy plan field when needed', () => {
  const entitlement = resolveRegisterEntitlement({
    createdAt: '2026-03-12T10:00:00.000Z',
    plan: 'pro',
    entitlement: null,
  });

  assert.equal(entitlement.plan, 'pro');
  assert.equal(entitlement.source, 'legacy_plan_field');
});

test('higher-plan resolver never downgrades enterprise', () => {
  assert.equal(getHigherPlan('enterprise', 'pro'), 'enterprise');
  assert.equal(getHigherPlan('free', 'pro'), 'pro');
});

test('inactive paid entitlements do not unlock paid access', () => {
  const entitlement = resolveRegisterEntitlement({
    createdAt: '2026-03-12T10:00:00.000Z',
    plan: 'pro',
    entitlement: {
      plan: 'pro',
      status: 'inactive',
      source: 'stripe_webhook',
      updatedAt: '2026-03-12T11:00:00.000Z',
    },
  });

  assert.equal(entitlement.plan, 'pro');
  assert.equal(getEntitlementAccessPlan(entitlement), 'free');
  assert.equal(
    resolveRegisterPlan({
      createdAt: '2026-03-12T10:00:00.000Z',
      plan: 'pro',
      entitlement,
    }),
    'free',
  );
});
