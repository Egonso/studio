import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCheckoutReturnPayload,
  isClaimableCheckoutPlan,
} from './checkout-return';

test('buildCheckoutReturnPayload prefers the checkout session email', () => {
  assert.deepEqual(
    buildCheckoutReturnPayload({
      sessionCustomerEmail: ' Buyer@Example.com ',
      customerEmail: 'fallback@example.com',
      entitlementPlan: 'pro',
    }),
    {
      customer_email_hint: 'bu***@example.com',
      entitlement_plan: 'pro',
      checkout_claimable: true,
    },
  );
});

test('buildCheckoutReturnPayload falls back to the Stripe customer email', () => {
  assert.deepEqual(
    buildCheckoutReturnPayload({
      sessionCustomerEmail: null,
      customerEmail: 'Customer@Example.com',
      entitlementPlan: 'enterprise',
    }),
    {
      customer_email_hint: 'cu******@example.com',
      entitlement_plan: 'enterprise',
      checkout_claimable: true,
    },
  );
});

test('buildCheckoutReturnPayload keeps free checkout returns non-claimable', () => {
  assert.deepEqual(
    buildCheckoutReturnPayload({
      sessionCustomerEmail: 'free@example.com',
      entitlementPlan: 'free',
    }),
    {
      customer_email_hint: 'fr**@example.com',
      entitlement_plan: 'free',
      checkout_claimable: false,
    },
  );
});

test('buildCheckoutReturnPayload returns null when Stripe exposes no email', () => {
  assert.equal(
    buildCheckoutReturnPayload({
      sessionCustomerEmail: null,
      customerEmail: null,
      entitlementPlan: 'pro',
    }),
    null,
  );
});

test('isClaimableCheckoutPlan only unlocks paid plans', () => {
  assert.equal(isClaimableCheckoutPlan('free'), false);
  assert.equal(isClaimableCheckoutPlan('pro'), true);
  assert.equal(isClaimableCheckoutPlan('enterprise'), true);
  assert.equal(isClaimableCheckoutPlan(null), false);
});
