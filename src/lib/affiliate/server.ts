import '@/lib/server-only-guard';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  AFFILIATE_COLLECTIONS,
  AFFILIATE_DEFAULTS,
  AFFILIATE_SETTINGS_DOC_ID,
  type AffiliateCommission,
  type AffiliateGlobalSettings,
  type AffiliateRecord,
  type AffiliateReferral,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Global Settings
// ---------------------------------------------------------------------------

export async function getGlobalSettings(): Promise<AffiliateGlobalSettings> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.settings)
    .doc(AFFILIATE_SETTINGS_DOC_ID)
    .get();

  if (!snap.exists) {
    return {
      ...AFFILIATE_DEFAULTS,
      updatedAt: now(),
      updatedBy: 'system',
    };
  }

  return snap.data() as AffiliateGlobalSettings;
}

export async function saveGlobalSettings(
  settings: Omit<AffiliateGlobalSettings, 'updatedAt'> & { updatedAt?: string },
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(AFFILIATE_COLLECTIONS.settings)
    .doc(AFFILIATE_SETTINGS_DOC_ID)
    .set({ ...settings, updatedAt: now() }, { merge: true });
}

// ---------------------------------------------------------------------------
// Affiliate CRUD
// ---------------------------------------------------------------------------

export async function getAffiliateByEmail(
  email: string,
): Promise<AffiliateRecord | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(normalizeEmail(email))
    .get();

  return snap.exists ? (snap.data() as AffiliateRecord) : null;
}

export async function getAffiliateBySlug(
  slug: string,
): Promise<AffiliateRecord | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .where('slug', '==', slug.toLowerCase())
    .where('active', '==', true)
    .limit(1)
    .get();

  return snap.empty ? null : (snap.docs[0].data() as AffiliateRecord);
}

export async function isSlugTaken(
  slug: string,
  excludeEmail?: string,
): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .where('slug', '==', slug.toLowerCase())
    .limit(1)
    .get();

  if (snap.empty) return false;
  if (excludeEmail) {
    return snap.docs[0].id !== normalizeEmail(excludeEmail);
  }
  return true;
}

export async function listAffiliates(): Promise<AffiliateRecord[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => d.data() as AffiliateRecord);
}

export async function createAffiliate(input: {
  email: string;
  slug: string;
  createdBy: string;
}): Promise<AffiliateRecord> {
  const db = getAdminDb();
  const email = normalizeEmail(input.email);
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  if (await isSlugTaken(slug)) {
    throw new Error(`Affiliate slug "${slug}" is already taken.`);
  }

  const record: AffiliateRecord = {
    email,
    slug,
    active: true,
    commissionBoostRate: null,
    commissionOngoingRate: null,
    boostPeriodMonths: null,
    attributionWindowMonths: null,
    stripeConnectAccountId: null,
    stripeConnectOnboardingComplete: false,
    totalClicks: 0,
    totalSignups: 0,
    totalPurchases: 0,
    totalEarnings: 0,
    totalPaidOut: 0,
    createdAt: now(),
    updatedAt: now(),
    createdBy: input.createdBy,
  };

  await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(email)
    .set(record);

  return record;
}

export async function updateAffiliate(
  email: string,
  updates: Partial<
    Pick<
      AffiliateRecord,
      | 'slug'
      | 'active'
      | 'commissionBoostRate'
      | 'commissionOngoingRate'
      | 'boostPeriodMonths'
      | 'attributionWindowMonths'
      | 'stripeConnectAccountId'
      | 'stripeConnectOnboardingComplete'
    >
  >,
): Promise<void> {
  const db = getAdminDb();
  const emailKey = normalizeEmail(email);

  if (updates.slug !== undefined) {
    const taken = await isSlugTaken(updates.slug, email);
    if (taken) {
      throw new Error(`Affiliate slug "${updates.slug}" is already taken.`);
    }
    updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(emailKey)
    .update({ ...updates, updatedAt: now() });
}

export async function forceResetAllOverrides(): Promise<number> {
  const db = getAdminDb();
  const snap = await db.collection(AFFILIATE_COLLECTIONS.affiliates).get();
  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      commissionBoostRate: null,
      commissionOngoingRate: null,
      boostPeriodMonths: null,
      attributionWindowMonths: null,
      updatedAt: now(),
    });
    count++;
  }

  await batch.commit();
  return count;
}

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export async function createReferral(input: {
  affiliateEmail: string;
  affiliateSlug: string;
  referredEmail: string;
  attributionWindowMonths: number;
}): Promise<AffiliateReferral> {
  const db = getAdminDb();
  const ref = db.collection(AFFILIATE_COLLECTIONS.referrals).doc();

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + input.attributionWindowMonths);

  const referral: AffiliateReferral = {
    referralId: ref.id,
    affiliateEmail: normalizeEmail(input.affiliateEmail),
    affiliateSlug: input.affiliateSlug,
    referredEmail: normalizeEmail(input.referredEmail),
    referredUserId: null,
    firstClickAt: now(),
    signedUpAt: null,
    firstPurchaseAt: null,
    attributionExpiresAt: expiresAt.toISOString(),
    status: 'clicked',
    createdAt: now(),
    updatedAt: now(),
  };

  await ref.set(referral);
  return referral;
}

export async function findReferralByReferredEmail(
  email: string,
): Promise<AffiliateReferral | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.referrals)
    .where('referredEmail', '==', normalizeEmail(email))
    .where('status', 'in', ['clicked', 'signed_up', 'converted'])
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  return snap.empty ? null : (snap.docs[0].data() as AffiliateReferral);
}

export async function markReferralSignedUp(
  referralId: string,
  userId: string,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(AFFILIATE_COLLECTIONS.referrals)
    .doc(referralId)
    .update({
      status: 'signed_up',
      signedUpAt: now(),
      referredUserId: userId,
      updatedAt: now(),
    });
}

export async function markReferralConverted(
  referralId: string,
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(AFFILIATE_COLLECTIONS.referrals).doc(referralId);
  const snap = await ref.get();
  const data = snap.data() as AffiliateReferral | undefined;

  const updates: Record<string, unknown> = {
    status: 'converted',
    updatedAt: now(),
  };
  if (!data?.firstPurchaseAt) {
    updates.firstPurchaseAt = now();
  }

  await ref.update(updates);
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export async function createCommissionRecord(
  commission: AffiliateCommission,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(AFFILIATE_COLLECTIONS.commissions)
    .doc(commission.commissionId)
    .set(commission);
}

export async function listCommissionsForAffiliate(
  email: string,
  limit = 50,
): Promise<AffiliateCommission[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(AFFILIATE_COLLECTIONS.commissions)
    .where('affiliateEmail', '==', normalizeEmail(email))
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as AffiliateCommission);
}

// ---------------------------------------------------------------------------
// Click tracking
// ---------------------------------------------------------------------------

export async function recordClick(input: {
  affiliateSlug: string;
  affiliateEmail: string;
  visitorFingerprint: string | null;
  referrer: string | null;
  userAgent: string | null;
}): Promise<void> {
  const db = getAdminDb();
  await db.collection(AFFILIATE_COLLECTIONS.clicks).add({
    ...input,
    createdAt: now(),
  });

  // Increment click counter on affiliate record
  await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(normalizeEmail(input.affiliateEmail))
    .update({ totalClicks: FieldValue.increment(1), updatedAt: now() });
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

export async function incrementAffiliateSignups(email: string): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(normalizeEmail(email))
    .update({ totalSignups: FieldValue.increment(1), updatedAt: now() });
}

export async function incrementAffiliatePurchaseStats(
  email: string,
  earningsCents: number,
  paidOutCents: number,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(AFFILIATE_COLLECTIONS.affiliates)
    .doc(normalizeEmail(email))
    .update({
      totalPurchases: FieldValue.increment(1),
      totalEarnings: FieldValue.increment(earningsCents),
      totalPaidOut: FieldValue.increment(paidOutCents),
      updatedAt: now(),
    });
}

// ---------------------------------------------------------------------------
// Resolve effective rates (individual > global)
// ---------------------------------------------------------------------------

export function resolveEffectiveRates(
  affiliate: AffiliateRecord,
  global: AffiliateGlobalSettings,
): {
  boostRate: number;
  ongoingRate: number;
  boostPeriodMonths: number;
  attributionWindowMonths: number;
} {
  return {
    boostRate:
      affiliate.commissionBoostRate ?? global.defaultCommissionBoostRate,
    ongoingRate:
      affiliate.commissionOngoingRate ?? global.defaultCommissionOngoingRate,
    boostPeriodMonths:
      affiliate.boostPeriodMonths ?? global.defaultBoostPeriodMonths,
    attributionWindowMonths:
      affiliate.attributionWindowMonths ??
      global.defaultAttributionWindowMonths,
  };
}
