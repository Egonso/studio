import assert from 'node:assert/strict';
import test from 'node:test';

test('checkout request parsing treats null scope hints as unset', async () => {
  const { parseCheckoutRequestBody } = await import('./checkout-request');

  const parsed = parseCheckoutRequestBody({
    targetPlan: 'pro',
    billingInterval: 'month',
    registerId: 'register_123',
    workspaceId: null,
  });

  assert.equal(parsed.targetPlan, 'pro');
  assert.equal(parsed.billingInterval, 'month');
  assert.equal(parsed.registerId, 'register_123');
  assert.equal(parsed.workspaceId, undefined);
});
