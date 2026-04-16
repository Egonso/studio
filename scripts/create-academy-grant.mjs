import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-03-31.basil';
const APP_ORIGIN = 'https://kiregister.com';
const DEFAULT_PROGRAM = 'grundkurs';
const DEFAULT_LESSON = 'das-fehlende-bindeglied';
const SHARED_COUPON_NAME = 'KIRegister Academy Partnerfreischaltung';

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
      'Missing Stripe secret key. Set STRIPE_SECRET_KEY or STRIPE_API_KEY before creating an academy grant.',
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function readFlag(args, flagName) {
  const index = args.indexOf(flagName);
  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function buildGrantLinks({ code, locale, program, lesson }) {
  const coursePath = `/${locale}/academy/${program}`;
  const lessonPath = lesson ? `${coursePath}/${lesson}` : coursePath;
  const query = `academy_grant=${encodeURIComponent(code)}`;

  return {
    courseUrl: `${APP_ORIGIN}${coursePath}?${query}`,
    lessonUrl: `${APP_ORIGIN}${lessonPath}?${query}`,
  };
}

async function ensureSharedCoupon(stripe) {
  const coupons = await stripe.coupons.list({ limit: 100 });
  const existingCoupon =
    coupons.data.find(
      (coupon) =>
        coupon.valid !== false &&
        coupon.percent_off === 100 &&
        coupon.duration === 'forever' &&
        coupon.metadata?.purpose === 'academy_partner_grant',
    ) ??
    coupons.data.find(
      (coupon) =>
        coupon.valid !== false &&
        coupon.percent_off === 100 &&
        coupon.duration === 'forever' &&
        coupon.name === SHARED_COUPON_NAME,
    ) ??
    null;

  if (existingCoupon) {
    return existingCoupon;
  }

  return stripe.coupons.create({
    duration: 'forever',
    name: SHARED_COUPON_NAME,
    percent_off: 100,
    metadata: {
      purpose: 'academy_partner_grant',
      sourceApp: 'kiregister',
    },
  });
}

async function ensurePromotionCode(stripe, couponId, code, email, maxRedemptions) {
  const matches = await stripe.promotionCodes.list({
    active: true,
    code,
    limit: 10,
  });

  const existingMatch = matches.data.find(
    (promotionCode) => promotionCode.code?.toLowerCase() === code.toLowerCase(),
  );

  if (existingMatch) {
    return { created: false, promotionCode: existingMatch };
  }

  const promotionCode = await stripe.promotionCodes.create({
    coupon: couponId,
    code,
    max_redemptions: maxRedemptions,
    metadata: {
      granteeEmail: email ?? '',
      purpose: 'academy_partner_grant',
      sourceApp: 'kiregister',
    },
  });

  return { created: true, promotionCode };
}

async function main() {
  const args = process.argv.slice(2);
  const code = readFlag(args, '--code')?.trim()?.toUpperCase() ?? null;
  const email = readFlag(args, '--email')?.trim()?.toLowerCase() ?? null;
  const locale = readFlag(args, '--locale')?.trim() ?? 'de';
  const program = readFlag(args, '--program')?.trim() ?? DEFAULT_PROGRAM;
  const lesson = readFlag(args, '--lesson')?.trim() ?? DEFAULT_LESSON;
  const maxRedemptionsValue = readFlag(args, '--max-redemptions');
  const maxRedemptions = maxRedemptionsValue
    ? Number.parseInt(maxRedemptionsValue, 10)
    : 1;

  if (!code) {
    throw new Error('Missing --code. Example: npm run academy:grant:create -- --code ELISABETH-ESTERER');
  }

  if (!Number.isFinite(maxRedemptions) || maxRedemptions < 1) {
    throw new Error('Invalid --max-redemptions value. Use a positive integer.');
  }

  const stripe = createStripeClient();
  const coupon = await ensureSharedCoupon(stripe);
  const { created, promotionCode } = await ensurePromotionCode(
    stripe,
    coupon.id,
    code,
    email,
    maxRedemptions,
  );
  const links = buildGrantLinks({
    code: promotionCode.code,
    locale,
    program,
    lesson,
  });

  console.log(
    JSON.stringify(
      {
        code: promotionCode.code,
        couponId: coupon.id,
        promotionCodeId: promotionCode.id,
        created,
        maxRedemptions: promotionCode.max_redemptions ?? null,
        courseUrl: links.courseUrl,
        lessonUrl: links.lessonUrl,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Academy grant creation failed.',
  );
  process.exitCode = 1;
});
