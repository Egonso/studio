import assert from 'node:assert/strict';
import test from 'node:test';

function withEnv<T>(
  values: Record<string, string | undefined>,
  run: () => T,
): T {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('stripe server config resolves canonical environment names', async () => {
  const {
    getGovernanceStripePriceId,
    getStripePriceIdForPlan,
    resolveStripeBillingConfiguration,
    resolveStripeSecretKey,
  } = await import('./stripe-server');
  const { GOVERNANCE_VOLUME_TIERS } = await import('./governance-volume-pricing');

  withEnv(
    {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_API_KEY: undefined,
      STRIPE_PRICE_GOVERNANCE_PRO_050_005_MONTHLY: 'price_pro_50_month',
      STRIPE_PRICE_GOVERNANCE_PRO_200_020_YEARLY: 'price_pro_200_year',
      STRIPE_PRICE_ENTERPRISE: 'price_ent_123',
      STRIPE_BILLING_PORTAL_CONFIGURATION_ID: 'bpc_123',
    },
    () => {
      assert.equal(resolveStripeSecretKey(), 'sk_test_123');

      const config = resolveStripeBillingConfiguration();
      assert.equal(config.secretKey, 'sk_test_123');
      assert.equal(config.enterprisePriceId, 'price_ent_123');
      assert.equal(config.billingPortalConfigurationId, 'bpc_123');
      assert.equal(
        getGovernanceStripePriceId(GOVERNANCE_VOLUME_TIERS[0], 'month', config),
        'price_pro_50_month',
      );
      assert.equal(
        getGovernanceStripePriceId(
          GOVERNANCE_VOLUME_TIERS[GOVERNANCE_VOLUME_TIERS.length - 1],
          'year',
          config,
        ),
        'price_pro_200_year',
      );
      assert.equal(getStripePriceIdForPlan('pro', config), null);
      assert.equal(
        getStripePriceIdForPlan('enterprise', config),
        'price_ent_123',
      );
    },
  );
});

test('billing return and cancel urls use the configured public app origin', async () => {
  const { buildBillingCancelUrl, buildBillingReturnUrl } = await import(
    './stripe-server'
  );

  withEnv(
    {
      NEXT_PUBLIC_APP_ORIGIN: 'https://app.example.com',
    },
    () => {
      assert.equal(
        buildBillingCancelUrl(),
        'https://app.example.com/settings?section=governance#upgrade-panel',
      );
      assert.equal(
        buildBillingReturnUrl('{CHECKOUT_SESSION_ID}'),
        'https://app.example.com/settings?section=governance&checkout_session_id={CHECKOUT_SESSION_ID}#upgrade-panel',
      );
    },
  );
});
