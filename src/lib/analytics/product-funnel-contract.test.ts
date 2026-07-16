import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeProductFunnelSessionId,
  parseProductFunnelEvent,
} from './product-funnel-contract';

const context = {
  anonymousSessionId: 'journey_abc12345',
  source: 'capture' as const,
  occurredAt: '2026-07-16T12:00:00.000Z',
};

test('product funnel accepts bounded, privacy-preserving capture events', () => {
  const parsed = parseProductFunnelEvent({
    eventName: 'capture_validation_failed',
    payload: { fields: ['purpose', 'ownerRole'] },
    context,
  });

  assert.equal(parsed.eventName, 'capture_validation_failed');
  assert.deepEqual(parsed.payload, { fields: ['purpose', 'ownerRole'] });
});

test('product funnel rejects free text and PII fields', () => {
  assert.throws(() =>
    parseProductFunnelEvent({
      eventName: 'capture_completed',
      payload: {
        storage: 'register',
        purpose: 'Sensitive employee assessment',
        email: 'person@example.com',
      },
      context,
    }),
  );
});

test('product funnel rejects unknown sources and malformed journey ids', () => {
  assert.equal(normalizeProductFunnelSessionId('journey_abc12345'), 'journey_abc12345');
  assert.equal(normalizeProductFunnelSessionId('contains a space'), null);
  assert.throws(() =>
    parseProductFunnelEvent({
      eventName: 'training_landing_viewed',
      payload: {},
      context: { ...context, source: 'raw-referrer' },
    }),
  );
});

test('derived retention events only accept bounded operational actions', () => {
  const parsed = parseProductFunnelEvent({
    eventName: 'returned_d7_for_action',
    payload: { action: 'review_completed' },
    context,
  });

  assert.equal(parsed.payload.action, 'review_completed');
  assert.throws(() =>
    parseProductFunnelEvent({
      eventName: 'returned_d7_for_action',
      payload: { action: 'reviewed candidate John Doe' },
      context,
    }),
  );
});
