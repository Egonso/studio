import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCustomerEntitlementRecord,
  getEntitlementAccessPlan,
  inferCheckoutBillingProduct,
  inferCheckoutEntitlementPlan,
  mergeCustomerEntitlements,
  parseCustomerEntitlementRecord,
} from './stripe-entitlements';

test('canonical billing mapping resolves governance control products', () => {
  const resolved = inferCheckoutBillingProduct({
    metadata: {
      productId: 'governance-control-center',
    },
    lineItems: [
      {
        lookupKey: 'governance-control',
        productName: 'Governance Control Center',
      },
    ],
  });

  assert.deepEqual(resolved, {
    plan: 'pro',
    billingProductKey: 'governance_control_center',
  });
  assert.equal(
    inferCheckoutEntitlementPlan({
      metadata: { productId: 'governance-control-center' },
    }),
    'pro',
  );
});

test('canonical billing mapping resolves enterprise products', () => {
  const resolved = inferCheckoutBillingProduct({
    lineItems: [
      {
        productName: 'Enterprise SSO + SCIM',
      },
    ],
  });

  assert.deepEqual(resolved, {
    plan: 'enterprise',
    billingProductKey: 'enterprise_suite',
  });
});

test('customer entitlement merge keeps highest active plan', () => {
  const merged = mergeCustomerEntitlements(
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'pro',
      source: 'stripe_checkout',
    }),
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'enterprise',
      source: 'stripe_webhook',
    }),
  );

  assert.equal(merged.plan, 'enterprise');
  assert.equal(merged.status, 'active');
});

test('inactive billing records disable access without losing plan provenance', () => {
  const merged = mergeCustomerEntitlements(
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'enterprise',
      source: 'stripe_checkout',
    }),
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'enterprise',
      status: 'inactive',
      source: 'stripe_webhook',
    }),
  );

  assert.equal(merged.plan, 'enterprise');
  assert.equal(merged.status, 'inactive');
  assert.equal(getEntitlementAccessPlan(merged), 'free');
});

test('time-limited access expires after the recorded access window', () => {
  const expired = buildCustomerEntitlementRecord({
    email: 'user@example.com',
    plan: 'pro',
    source: 'stripe_webhook',
    accessExpiresAt: '2000-01-01T00:00:00.000Z',
  });
  const active = buildCustomerEntitlementRecord({
    email: 'user@example.com',
    plan: 'pro',
    source: 'stripe_webhook',
    accessExpiresAt: '2999-01-01T00:00:00.000Z',
  });

  assert.equal(getEntitlementAccessPlan(expired), 'free');
  assert.equal(getEntitlementAccessPlan(active), 'pro');
});

test('parsed customer entitlements preserve one-year access expiry', () => {
  const parsed = parseCustomerEntitlementRecord('USER@example.com', {
    plan: 'pro',
    status: 'active',
    source: 'stripe_webhook',
    updatedAt: '2026-04-30T10:00:00.000Z',
    accessExpiresAt: '2027-04-30T10:00:00.000Z',
  });

  assert.equal(parsed?.email, 'user@example.com');
  assert.equal(parsed?.accessExpiresAt, '2027-04-30T10:00:00.000Z');
});

test('inactive updates do not downgrade stored plan provenance', () => {
  const merged = mergeCustomerEntitlements(
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'enterprise',
      source: 'stripe_checkout',
    }),
    buildCustomerEntitlementRecord({
      email: 'user@example.com',
      plan: 'pro',
      status: 'inactive',
      source: 'stripe_webhook',
    }),
  );

  assert.equal(merged.plan, 'enterprise');
  assert.equal(merged.status, 'inactive');
  assert.equal(getEntitlementAccessPlan(merged), 'free');
});
