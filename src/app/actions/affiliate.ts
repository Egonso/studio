'use server';

import { hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/server-auth';
import {
  getAffiliateByEmail,
  listCommissionsForAffiliate,
  listReferralsForAffiliate,
} from '@/lib/affiliate/server';
import type {
  AffiliateCommission,
  AffiliateRecord,
  AffiliateReferral,
} from '@/lib/affiliate/types';

export async function getAffiliateProfile(
  idToken: string,
): Promise<{ isAffiliate: false } | { isAffiliate: true; affiliate: AffiliateRecord }> {
  try {
    const decoded = await requireUser(`Bearer ${idToken}`);
    const email = decoded.email?.toLowerCase();
    if (!email || !hasFirebaseAdminCredentials()) {
      return { isAffiliate: false };
    }

    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate || !affiliate.active) {
      return { isAffiliate: false };
    }

    return { isAffiliate: true, affiliate };
  } catch (error) {
    console.error('getAffiliateProfile failed:', error);
    return { isAffiliate: false };
  }
}

export async function getAffiliateCommissionHistory(
  idToken: string,
  limit = 50,
): Promise<AffiliateCommission[]> {
  try {
    const decoded = await requireUser(`Bearer ${idToken}`);
    const email = decoded.email?.toLowerCase();
    if (!email || !hasFirebaseAdminCredentials()) {
      return [];
    }

    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate || !affiliate.active) {
      return [];
    }

    return listCommissionsForAffiliate(email, limit);
  } catch (error) {
    console.error('getAffiliateCommissionHistory failed:', error);
    return [];
  }
}

export async function getAffiliateReferralHistory(
  idToken: string,
  limit = 50,
): Promise<AffiliateReferral[]> {
  try {
    const decoded = await requireUser(`Bearer ${idToken}`);
    const email = decoded.email?.toLowerCase();
    if (!email || !hasFirebaseAdminCredentials()) {
      return [];
    }

    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate || !affiliate.active) {
      return [];
    }

    return listReferralsForAffiliate(email, limit);
  } catch (error) {
    console.error('getAffiliateReferralHistory failed:', error);
    return [];
  }
}
