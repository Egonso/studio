import assert from 'node:assert/strict';
import test from 'node:test';
import type Stripe from 'stripe';

import {
  getCheckoutEligibility,
  getCheckoutEligibilityErrorMessage,
} from './checkout-eligibility';

function createSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
    subscription: 'sub_123',
    ...overrides,
  } as Stripe.Checkout.Session;
}

function createSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: 'sub_123',
    object: 'subscription',
    status: 'active',
    ...overrides,
  } as Stripe.Subscription;
}

test('eligible subscription checkout can be claimed', () => {
  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession(),
      subscription: createSubscription(),
    }),
    { ok: true, reason: null },
  );
});

test('zero-cost checkout remains claimable without payment method', () => {
  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession({ payment_status: 'no_payment_required' }),
      subscription: createSubscription({ status: 'active' }),
    }),
    { ok: true, reason: null },
  );
});

test('eligible one-time payment checkout can be claimed without subscription', () => {
  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession({
        mode: 'payment',
        subscription: null,
      }),
      subscription: null,
    }),
    { ok: true, reason: null },
  );
});

test('incomplete or unpaid sessions are rejected', () => {
  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession({ status: 'open' }),
      subscription: createSubscription(),
    }),
    { ok: false, reason: 'status_incomplete' },
  );

  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession({ payment_status: 'unpaid' }),
      subscription: createSubscription(),
    }),
    { ok: false, reason: 'payment_status_unpaid' },
  );
});

test('missing or inactive subscriptions are rejected', () => {
  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession({ subscription: null }),
      subscription: null,
    }),
    { ok: false, reason: 'missing_subscription' },
  );

  assert.deepEqual(
    getCheckoutEligibility({
      session: createSession(),
      subscription: createSubscription({ status: 'canceled' }),
    }),
    { ok: false, reason: 'subscription_inactive' },
  );
});

test('eligibility errors stay customer-readable', () => {
  assert.equal(
    getCheckoutEligibilityErrorMessage('payment_status_unpaid'),
    'Checkout payment is not settled.',
  );
});
