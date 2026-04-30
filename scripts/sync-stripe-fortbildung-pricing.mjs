import Stripe from 'stripe';

const STRIPE_API_VERSION = '2026-02-25.clover';
const LOOKUP_KEY = 'ki-register-fortbildung-neulaunch-2026-one-year';
const PRODUCT_METADATA = {
  billingProductKey: 'governance_control_center',
  productId: 'fortbildung_neulaunch_package',
  sourceFlow: 'fortbildung_neulaunch_checkout',
};

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

async function resolveProduct(stripe) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find(
    (product) =>
      product.metadata?.productId === PRODUCT_METADATA.productId ||
      product.metadata?.sourceFlow === PRODUCT_METADATA.sourceFlow,
  );

  if (existing) {
    return existing;
  }

  return stripe.products.create({
    name: 'KI Register Fortbildungspaket',
    description:
      'EU-AI-Act-Hauptkurs, zwei Neulaunch-Bonuskurse, 1 Jahr Zugang, 1 Person, 1 Projekt.',
    metadata: PRODUCT_METADATA,
  });
}

async function resolvePrice(stripe, productId) {
  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [LOOKUP_KEY],
    limit: 1,
  });
  const existing = prices.data[0] ?? null;

  if (existing) {
    if (
      existing.unit_amount !== 49_500 ||
      existing.currency !== 'eur' ||
      existing.recurring
    ) {
      throw new Error(
        `Existing Stripe price ${existing.id} for ${LOOKUP_KEY} has unexpected amount/currency or is recurring.`,
      );
    }

    return existing;
  }

  return stripe.prices.create({
    product: productId,
    currency: 'eur',
    unit_amount: 49_500,
    lookup_key: LOOKUP_KEY,
    metadata: {
      ...PRODUCT_METADATA,
      accessDurationMonths: '12',
      includedPersons: '1',
      includedProjects: '1',
    },
  });
}

async function main() {
  const stripe = createStripeClient();
  const product = await resolveProduct(stripe);
  const price = await resolvePrice(stripe, product.id);

  console.log(
    JSON.stringify(
      {
        productId: product.id,
        priceId: price.id,
        lookupKey: LOOKUP_KEY,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Stripe Fortbildung pricing sync failed.',
  );
  process.exit(1);
});
