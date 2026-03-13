import Stripe from 'stripe';

const STRIPE_API_VERSION = '2026-02-25.clover';
const PRODUCT_NAME = 'KI-Register Governance Control Center';

const GOVERNANCE_VOLUME_TIERS = [
  {
    id: 'pro_5_users_50_use_cases',
    label: 'Bis 5 User / 50 Einsatzfälle',
    maxUsers: 5,
    maxUseCases: 50,
    monthlyAmountCents: 4900,
    yearlyAmountCents: 49900,
    monthlyLookupKey: 'governance-control-5-users-50-usecases-monthly',
    yearlyLookupKey: 'governance-control-5-users-50-usecases-yearly',
  },
  {
    id: 'pro_10_users_100_use_cases',
    label: 'Bis 10 User / 100 Einsatzfälle',
    maxUsers: 10,
    maxUseCases: 100,
    monthlyAmountCents: 9900,
    yearlyAmountCents: 99900,
    monthlyLookupKey: 'governance-control-10-users-100-usecases-monthly',
    yearlyLookupKey: 'governance-control-10-users-100-usecases-yearly',
  },
  {
    id: 'pro_15_users_150_use_cases',
    label: 'Bis 15 User / 150 Einsatzfälle',
    maxUsers: 15,
    maxUseCases: 150,
    monthlyAmountCents: 14900,
    yearlyAmountCents: 149900,
    monthlyLookupKey: 'governance-control-15-users-150-usecases-monthly',
    yearlyLookupKey: 'governance-control-15-users-150-usecases-yearly',
  },
  {
    id: 'pro_20_users_200_use_cases',
    label: 'Bis 20 User / 200 Einsatzfälle',
    maxUsers: 20,
    maxUseCases: 200,
    monthlyAmountCents: 19900,
    yearlyAmountCents: 199900,
    monthlyLookupKey: 'governance-control-20-users-200-usecases-monthly',
    yearlyLookupKey: 'governance-control-20-users-200-usecases-yearly',
  },
];

function normalizeEnvValue(value) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function resolveStripeSecretKey() {
  return (
    normalizeEnvValue(process.env.STRIPE_SECRET_KEY) ??
    normalizeEnvValue(process.env.STRIPE_API_KEY)
  );
}

function createStripeClient() {
  const secretKey = resolveStripeSecretKey();
  if (!secretKey) {
    throw new Error(
      'Missing Stripe secret key. Set STRIPE_SECRET_KEY or STRIPE_API_KEY before running the sync.',
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function buildPriceSpec(tier, interval) {
  return {
    tierId: tier.id,
    lookupKey:
      interval === 'year' ? tier.yearlyLookupKey : tier.monthlyLookupKey,
    amountCents:
      interval === 'year' ? tier.yearlyAmountCents : tier.monthlyAmountCents,
    interval,
    maxUsers: tier.maxUsers,
    maxUseCases: tier.maxUseCases,
    nickname: `${tier.label} · ${interval === 'year' ? 'Jährlich' : 'Monatlich'}`,
  };
}

async function resolveGovernanceProduct(stripe) {
  const configuredProductId = normalizeEnvValue(
    process.env.STRIPE_PRODUCT_GOVERNANCE_CONTROL_CENTER,
  );
  if (configuredProductId) {
    const product = await stripe.products.retrieve(configuredProductId);
    if (product.deleted) {
      throw new Error(
        `Configured product ${configuredProductId} is deleted. Remove STRIPE_PRODUCT_GOVERNANCE_CONTROL_CENTER or point it to an active product.`,
      );
    }
    return product;
  }

  const products = await stripe.products.list({ active: true, limit: 100 });
  const existingProduct =
    products.data.find(
      (product) =>
        product.metadata?.billingProductKey === 'governance_control_center',
    ) ??
    products.data.find((product) => product.name === PRODUCT_NAME) ??
    null;

  if (existingProduct) {
    return existingProduct;
  }

  return stripe.products.create({
    name: PRODUCT_NAME,
    description:
      'Volumenbasierte Governance-Control-Center-Abonnements für KI-Register Pro.',
    metadata: {
      billingProductKey: 'governance_control_center',
      plan: 'pro',
      sourceApp: 'kiregister',
    },
  });
}

function isMatchingPrice(price, productId, spec) {
  return (
    price.product === productId &&
    price.currency === 'eur' &&
    price.unit_amount === spec.amountCents &&
    price.type === 'recurring' &&
    price.recurring?.interval === spec.interval
  );
}

async function ensurePrice(stripe, product, spec) {
  const lookupMatches = await stripe.prices.list({
    active: true,
    lookup_keys: [spec.lookupKey],
    limit: 10,
  });

  const matchingActivePrice =
    lookupMatches.data.find((price) => isMatchingPrice(price, product.id, spec)) ??
    null;
  if (matchingActivePrice) {
    return { status: 'existing', price: matchingActivePrice };
  }

  if (lookupMatches.data.length > 0) {
    const conflictingPrice = lookupMatches.data[0];
    throw new Error(
      `Lookup key ${spec.lookupKey} already exists on active price ${conflictingPrice.id}, but its amount, interval, or product does not match the canonical configuration.`,
    );
  }

  const createdPrice = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: spec.amountCents,
    recurring: {
      interval: spec.interval,
    },
    lookup_key: spec.lookupKey,
    nickname: spec.nickname,
    metadata: {
      billingProductKey: 'governance_control_center',
      plan: 'pro',
      governanceTierId: spec.tierId,
      governanceMaxUsers: String(spec.maxUsers),
      governanceMaxUseCases: String(spec.maxUseCases),
    },
  });

  return { status: 'created', price: createdPrice };
}

async function main() {
  const stripe = createStripeClient();
  const product = await resolveGovernanceProduct(stripe);
  console.log(
    JSON.stringify(
      {
        productId: product.id,
        productName: product.name,
        created: false,
      },
      null,
      2,
    ),
  );

  for (const tier of GOVERNANCE_VOLUME_TIERS) {
    for (const interval of ['month', 'year']) {
      const spec = buildPriceSpec(tier, interval);
      const result = await ensurePrice(stripe, product, spec);
      console.log(
        JSON.stringify(
          {
            status: result.status,
            lookupKey: spec.lookupKey,
            priceId: result.price.id,
            amountCents: spec.amountCents,
            interval: spec.interval,
            tierId: spec.tierId,
          },
          null,
          2,
        ),
      );
    }
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Stripe governance pricing sync failed.',
  );
  process.exitCode = 1;
});
