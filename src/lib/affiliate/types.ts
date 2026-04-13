// ---------------------------------------------------------------------------
// Affiliate / Referral System – shared types
// ---------------------------------------------------------------------------

/** Singleton document stored at `affiliateSettings/global`. */
export interface AffiliateGlobalSettings {
  /** Commission rate (%) during the boost period. Default 100. */
  defaultCommissionBoostRate: number;
  /** Commission rate (%) after the boost period. Default 20. */
  defaultCommissionOngoingRate: number;
  /** Length of the boost period in months. Default 3. */
  defaultBoostPeriodMonths: number;
  /** Attribution window in months (cookie lifetime). Default 3. */
  defaultAttributionWindowMonths: number;
  updatedAt: string;
  updatedBy: string;
}

/** Stored at `affiliates/{email}` (email normalised to lowercase). */
export interface AffiliateRecord {
  email: string;
  /** URL-safe slug used in `/ref/{slug}`. Must be unique. */
  slug: string;
  active: boolean;

  // Per-affiliate overrides — `null` means "use global default".
  commissionBoostRate: number | null;
  commissionOngoingRate: number | null;
  boostPeriodMonths: number | null;
  attributionWindowMonths: number | null;

  // Stripe Connect
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;

  // Denormalised aggregate stats (updated by webhook)
  totalClicks: number;
  totalSignups: number;
  totalPurchases: number;
  /** Total earned commission in cents. */
  totalEarnings: number;
  /** Total transferred amount in cents. */
  totalPaidOut: number;

  createdAt: string;
  updatedAt: string;
  /** Admin email that created this affiliate entry. */
  createdBy: string;
}

/** Stored at `affiliateReferrals/{auto-id}`. One per referred user. */
export interface AffiliateReferral {
  referralId: string;
  affiliateEmail: string;
  affiliateSlug: string;
  referredEmail: string;
  referredUserId: string | null;
  firstClickAt: string;
  signedUpAt: string | null;
  firstPurchaseAt: string | null;
  /** After this date, un-converted referrals expire. */
  attributionExpiresAt: string;
  status: AffiliateReferralStatus;
  createdAt: string;
  updatedAt: string;
}

export type AffiliateReferralStatus =
  | 'clicked'
  | 'signed_up'
  | 'converted'
  | 'expired';

/** Stored at `affiliateCommissions/{auto-id}`. One per chargeable event. */
export interface AffiliateCommission {
  commissionId: string;
  affiliateEmail: string;
  referredEmail: string;
  referralId: string;

  // Stripe source event
  stripeEventId: string;
  stripeEventType: string;
  checkoutSessionId: string | null;
  invoiceId: string | null;
  subscriptionId: string | null;

  // Financial
  /** Total payment in cents. */
  grossAmount: number;
  currency: string;
  /** The rate that was applied (e.g. 100 or 20). */
  commissionRate: number;
  /** Computed commission in cents (net-based). */
  commissionAmount: number;
  isBoostPeriod: boolean;

  // Payout
  payoutStatus: AffiliatePayoutStatus;
  stripeTransferId: string | null;
  transferredAt: string | null;
  failureReason: string | null;

  createdAt: string;
}

export type AffiliatePayoutStatus =
  | 'pending'
  | 'transferred'
  | 'failed'
  | 'no_connect_account';

/** Stored at `affiliateClicks/{auto-id}`. */
export interface AffiliateClick {
  affiliateSlug: string;
  affiliateEmail: string;
  visitorFingerprint: string | null;
  referrer: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Firestore collection names
// ---------------------------------------------------------------------------

export const AFFILIATE_COLLECTIONS = {
  settings: 'affiliateSettings',
  affiliates: 'affiliates',
  referrals: 'affiliateReferrals',
  commissions: 'affiliateCommissions',
  clicks: 'affiliateClicks',
} as const;

export const AFFILIATE_SETTINGS_DOC_ID = 'global';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const AFFILIATE_DEFAULTS: Omit<AffiliateGlobalSettings, 'updatedAt' | 'updatedBy'> = {
  defaultCommissionBoostRate: 100,
  defaultCommissionOngoingRate: 20,
  defaultBoostPeriodMonths: 3,
  defaultAttributionWindowMonths: 3,
};

// ---------------------------------------------------------------------------
// Cookie name used for affiliate tracking
// ---------------------------------------------------------------------------

export const AFFILIATE_COOKIE_NAME = 'kiregister_ref';
export const AFFILIATE_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days
