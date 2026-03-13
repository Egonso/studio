import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GOVERNANCE_VOLUME_TIERS,
  describeGovernanceVolumeTier,
  formatGovernanceTierPrice,
  getGovernanceLookupKey,
  resolveGovernanceVolumeTier,
} from './governance-volume-pricing';

test('resolveGovernanceVolumeTier maps usage into the correct tier', () => {
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 1, useCaseCount: 1 })?.id,
    'pro_5_users_50_use_cases',
  );
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 10, useCaseCount: 100 })?.id,
    'pro_10_users_100_use_cases',
  );
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 14, useCaseCount: 120 })?.id,
    'pro_15_users_150_use_cases',
  );
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 20, useCaseCount: 200 })?.id,
    'pro_20_users_200_use_cases',
  );
});

test('resolveGovernanceVolumeTier returns null above the supported pro limits', () => {
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 21, useCaseCount: 200 }),
    null,
  );
  assert.equal(
    resolveGovernanceVolumeTier({ userCount: 20, useCaseCount: 201 }),
    null,
  );
});

test('governance pricing helpers expose canonical lookup keys and labels', () => {
  const smallestTier = GOVERNANCE_VOLUME_TIERS[0];
  const largestTier = GOVERNANCE_VOLUME_TIERS[GOVERNANCE_VOLUME_TIERS.length - 1];

  assert.equal(
    getGovernanceLookupKey(smallestTier, 'month'),
    'governance-control-5-users-50-usecases-monthly',
  );
  assert.equal(
    getGovernanceLookupKey(largestTier, 'year'),
    'governance-control-20-users-200-usecases-yearly',
  );
  assert.equal(formatGovernanceTierPrice(smallestTier, 'month'), '49 €');
  assert.equal(formatGovernanceTierPrice(largestTier, 'year'), '1.999 €');
  assert.equal(
    describeGovernanceVolumeTier(smallestTier, 'month'),
    'Bis 5 User / 50 Einsatzfälle · 49 € pro Monat',
  );
});
