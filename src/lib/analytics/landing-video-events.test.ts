import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeLandingVideoEvent } from './landing-video-events';

test('landing video analytics accept only the fixed privacy-preserving fields', () => {
  assert.deepEqual(
    normalizeLandingVideoEvent({
      event: 'progress_50',
      locale: 'de',
      variant: 'master',
      freeText: 'must not survive normalization',
      userId: 'must not survive normalization',
    }),
    { event: 'progress_50', locale: 'de', variant: 'master' },
  );
});

test('landing video analytics reject unknown values', () => {
  assert.equal(
    normalizeLandingVideoEvent({
      event: 'pause',
      locale: 'de',
      variant: 'master',
    }),
    null,
  );
  assert.equal(
    normalizeLandingVideoEvent({
      event: 'play',
      locale: 'fr',
      variant: 'master',
    }),
    null,
  );
});
