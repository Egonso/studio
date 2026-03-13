import assert from 'node:assert/strict';
import test from 'node:test';

function withEnv<T>(
  key: string,
  value: string | undefined,
  run: () => T,
): T {
  const previous = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
}

test('free plan upgrade points to the canonical governance settings surface', async () => {
  const { getGovernanceUpgradeDestination } = await import('./upgrade-surface');
  const destination = getGovernanceUpgradeDestination('free');

  assert.ok(destination);
  assert.equal(destination?.href, '/settings?section=governance#upgrade-panel');
  assert.equal(destination?.label, 'Governance freischalten');
  assert.equal(destination?.checkoutConfigured, true);
  assert.equal(destination?.external, false);
});

test('pro plan upgrade resolves to enterprise contact surface', async () => {
  const { getGovernanceUpgradeDestination } = await import('./upgrade-surface');

  const destination = withEnv(
    'NEXT_PUBLIC_ENTERPRISE_CONTACT_URL',
    'https://sales.example.com/enterprise',
    () => getGovernanceUpgradeDestination('pro'),
  );

  assert.ok(destination);
  assert.equal(destination?.href, 'https://sales.example.com/enterprise');
  assert.equal(destination?.targetPlan, 'enterprise');
});

test('enterprise plan does not expose a higher upgrade target', async () => {
  const { getGovernanceUpgradeDestination } = await import('./upgrade-surface');

  assert.equal(getGovernanceUpgradeDestination('enterprise'), null);
});
