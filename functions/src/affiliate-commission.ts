import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Types (mirrored from src/lib/affiliate/types.ts for functions bundle)
// ---------------------------------------------------------------------------

interface AffiliateRecord {
  email: string;
  slug: string;
  active: boolean;
  commissionBoostRate: number | null;
  commissionOngoingRate: number | null;
  boostPeriodMonths: number | null;
  attributionWindowMonths: number | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;
  totalClicks: number;
  totalSignups: number;
  totalPurchases: number;
  totalEarnings: number;
  totalPaidOut: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface AffiliateGlobalSettings {
  defaultCommissionBoostRate: number;
  defaultCommissionOngoingRate: number;
  defaultBoostPeriodMonths: number;
  defaultAttributionWindowMonths: number;
  updatedAt: string;
  updatedBy: string;
}

interface AffiliateReferral {
  referralId: string;
  affiliateEmail: string;
  affiliateSlug: string;
  referredEmail: string;
  referredUserId: string | null;
  firstClickAt: string;
  signedUpAt: string | null;
  firstPurchaseAt: string | null;
  attributionExpiresAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AFFILIATE_DEFAULTS: Omit<AffiliateGlobalSettings, 'updatedAt' | 'updatedBy'> = {
  defaultCommissionBoostRate: 100,
  defaultCommissionOngoingRate: 20,
  defaultBoostPeriodMonths: 3,
  defaultAttributionWindowMonths: 3,
};

// Approximate Stripe fee for European cards (1.4% + 0.25 EUR = 25 cents)
const STRIPE_FEE_PERCENT = 1.4;
const STRIPE_FEE_FIXED_CENTS = 25;

// ---------------------------------------------------------------------------
// Net amount calculation (gross minus estimated Stripe fees)
// ---------------------------------------------------------------------------

function calculateNetAmount(grossCents: number): number {
  if (grossCents <= 0) return 0;
  const percentageFee = Math.round((grossCents * STRIPE_FEE_PERCENT) / 100);
  const net = grossCents - percentageFee - STRIPE_FEE_FIXED_CENTS;
  return Math.max(0, net);
}

// ---------------------------------------------------------------------------
// Main commission processing function
// ---------------------------------------------------------------------------

export async function processAffiliateCommission(
  db: FirebaseFirestore.Firestore,
  stripe: Stripe,
  input: {
    email: string;
    grossAmount: number;
    currency: string;
    stripeEventId: string;
    stripeEventType: string;
    checkoutSessionId: string | null;
    invoiceId: string | null;
    subscriptionId: string | null;
  },
): Promise<void> {
  if (!input.email || input.grossAmount <= 0) return;

  // 1. Find active referral for this email
  const referralsSnap = await db
    .collection('affiliateReferrals')
    .where('referredEmail', '==', input.email)
    .where('status', 'in', ['signed_up', 'converted'])
    .limit(1)
    .get();

  if (referralsSnap.empty) return; // Not a referred customer

  const referralDoc = referralsSnap.docs[0];
  const referral = referralDoc.data() as AffiliateReferral;

  // 2. For un-converted referrals, check attribution window
  if (referral.status === 'signed_up') {
    if (new Date() > new Date(referral.attributionExpiresAt)) {
      // Attribution expired and never purchased
      await referralDoc.ref.update({
        status: 'expired',
        updatedAt: new Date().toISOString(),
      });
      return;
    }
  }

  // 3. Load affiliate record
  const affiliateSnap = await db
    .collection('affiliates')
    .doc(referral.affiliateEmail)
    .get();

  if (!affiliateSnap.exists) return;
  const affiliate = affiliateSnap.data() as AffiliateRecord;
  if (!affiliate.active) return;

  // 4. Load global settings
  const globalSnap = await db
    .collection('affiliateSettings')
    .doc('global')
    .get();
  const globalSettings: AffiliateGlobalSettings = globalSnap.exists
    ? (globalSnap.data() as AffiliateGlobalSettings)
    : { ...AFFILIATE_DEFAULTS, updatedAt: '', updatedBy: 'system' };

  // 5. Resolve effective rates
  const boostPeriodMonths =
    affiliate.boostPeriodMonths ?? globalSettings.defaultBoostPeriodMonths;

  const firstPurchaseDate = referral.firstPurchaseAt
    ? new Date(referral.firstPurchaseAt)
    : new Date();

  const boostEndDate = new Date(firstPurchaseDate);
  boostEndDate.setMonth(boostEndDate.getMonth() + boostPeriodMonths);

  const isBoostPeriod = new Date() <= boostEndDate;
  const commissionRate = isBoostPeriod
    ? (affiliate.commissionBoostRate ?? globalSettings.defaultCommissionBoostRate)
    : (affiliate.commissionOngoingRate ?? globalSettings.defaultCommissionOngoingRate);

  // 6. Calculate net-based commission
  const netAmount = calculateNetAmount(input.grossAmount);
  const commissionAmount = Math.round((netAmount * commissionRate) / 100);

  if (commissionAmount <= 0) return;

  // 7. Update referral if first purchase
  if (referral.status === 'signed_up') {
    await referralDoc.ref.update({
      status: 'converted',
      firstPurchaseAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 8. Create commission record
  const commissionRef = db.collection('affiliateCommissions').doc();
  const commissionRecord = {
    commissionId: commissionRef.id,
    affiliateEmail: referral.affiliateEmail,
    referredEmail: input.email,
    referralId: referralDoc.id,
    stripeEventId: input.stripeEventId,
    stripeEventType: input.stripeEventType,
    checkoutSessionId: input.checkoutSessionId,
    invoiceId: input.invoiceId,
    subscriptionId: input.subscriptionId,
    grossAmount: input.grossAmount,
    currency: input.currency,
    commissionRate,
    commissionAmount,
    isBoostPeriod,
    payoutStatus: 'pending' as string,
    stripeTransferId: null as string | null,
    transferredAt: null as string | null,
    failureReason: null as string | null,
    createdAt: new Date().toISOString(),
  };

  // 9. Attempt payout via Stripe Transfer
  if (affiliate.stripeConnectAccountId && affiliate.stripeConnectOnboardingComplete) {
    try {
      const transfer = await stripe.transfers.create({
        amount: commissionAmount,
        currency: input.currency || 'eur',
        destination: affiliate.stripeConnectAccountId,
        description: `KIRegister Affiliate Commission`,
        metadata: {
          commissionId: commissionRef.id,
          affiliateEmail: referral.affiliateEmail,
          referredEmail: input.email,
        },
      });
      commissionRecord.payoutStatus = 'transferred';
      commissionRecord.stripeTransferId = transfer.id;
      commissionRecord.transferredAt = new Date().toISOString();
    } catch (err: any) {
      commissionRecord.payoutStatus = 'failed';
      commissionRecord.failureReason = err?.message ?? 'Transfer failed';
      console.error('Affiliate transfer failed:', err);
    }
  } else {
    commissionRecord.payoutStatus = 'no_connect_account';
  }

  await commissionRef.set(commissionRecord);

  // 10. Update affiliate aggregate stats
  const paidOutIncrement =
    commissionRecord.payoutStatus === 'transferred' ? commissionAmount : 0;

  await affiliateSnap.ref.update({
    totalPurchases: admin.firestore.FieldValue.increment(1),
    totalEarnings: admin.firestore.FieldValue.increment(commissionAmount),
    totalPaidOut: admin.firestore.FieldValue.increment(paidOutIncrement),
    updatedAt: new Date().toISOString(),
  });

  console.log(
    `Affiliate commission: ${commissionAmount} cents (${commissionRate}%${isBoostPeriod ? ' boost' : ''}) ` +
    `for ${referral.affiliateEmail} from ${input.email} [${commissionRecord.payoutStatus}]`,
  );
}
