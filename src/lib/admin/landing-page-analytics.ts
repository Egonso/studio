import '@/lib/server-only-guard';

import { FieldValue } from 'firebase-admin/firestore';

import { getAdminDb, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';

const DAILY_COLLECTION = 'landing_page_view_daily';
const MONTHLY_COLLECTION = 'landing_page_view_monthly';
const ANALYTICS_TIME_ZONE = 'Europe/Berlin';

export interface LandingPageDailyView {
  date: string;
  views: number;
}

export interface LandingPageMonthlyView {
  month: string;
  views: number;
}

export interface LandingPageAnalyticsSnapshot {
  available: boolean;
  last30Days: LandingPageDailyView[];
  last30DaysTotal: number;
  today: LandingPageDailyView;
  currentMonth: LandingPageMonthlyView;
  previousMonth: LandingPageMonthlyView;
  monthlyOverview: LandingPageMonthlyView[];
}

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return { year, month, day };
}

export function getLandingPageAnalyticsDateKey(date: Date = new Date()): string {
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getLandingPageAnalyticsMonthKey(date: Date = new Date()): string {
  const { year, month } = getDateParts(date);
  return `${year}-${month}`;
}

function buildRecentDateKeys(days: number, now: Date): string[] {
  const currentKey = getLandingPageAnalyticsDateKey(now);
  const [year, month, day] = currentKey.split('-').map((part) => Number(part));

  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const date = new Date(Date.UTC(year, month - 1, day - offset, 12));
    return getLandingPageAnalyticsDateKey(date);
  });
}

function buildRecentMonthKeys(months: number, now: Date): string[] {
  const currentKey = getLandingPageAnalyticsMonthKey(now);
  const [year, month] = currentKey.split('-').map((part) => Number(part));
  const keys: string[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 15, 12));
    keys.push(getLandingPageAnalyticsMonthKey(date));
  }

  return keys;
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map((part) => Number(part));
  const previousMonth = new Date(Date.UTC(year, month - 2, 15, 12));
  return getLandingPageAnalyticsMonthKey(previousMonth);
}

function readTotal(data: FirebaseFirestore.DocumentData | undefined): number {
  const value = data?.total;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeLocale(locale: unknown): 'de' | 'en' | 'unknown' {
  if (typeof locale !== 'string') return 'unknown';
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('en')) return 'en';
  return 'unknown';
}

export async function recordLandingPageView(input: {
  locale?: unknown;
}): Promise<void> {
  if (!hasFirebaseAdminCredentials()) {
    return;
  }

  const now = new Date();
  const dateKey = getLandingPageAnalyticsDateKey(now);
  const monthKey = getLandingPageAnalyticsMonthKey(now);
  const locale = normalizeLocale(input.locale);
  const analyticsDb = getAdminDb();
  const payload = {
    total: FieldValue.increment(1),
    [`locales.${locale}`]: FieldValue.increment(1),
    updatedAt: now.toISOString(),
  };

  await Promise.all([
    analyticsDb
      .collection(DAILY_COLLECTION)
      .doc(dateKey)
      .set(
        {
          ...payload,
          date: dateKey,
          month: monthKey,
          lastSeenAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    analyticsDb
      .collection(MONTHLY_COLLECTION)
      .doc(monthKey)
      .set(
        {
          ...payload,
          month: monthKey,
          lastSeenAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
  ]);
}

export function getEmptyLandingPageAnalyticsSnapshot(
  now: Date,
  available: boolean,
): LandingPageAnalyticsSnapshot {
  const last30Days = buildRecentDateKeys(30, now).map((date) => ({
    date,
    views: 0,
  }));
  const monthlyOverview = buildRecentMonthKeys(12, now).map((month) => ({
    month,
    views: 0,
  }));
  const todayKey = getLandingPageAnalyticsDateKey(now);
  const currentMonthKey = getLandingPageAnalyticsMonthKey(now);
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  return {
    available,
    last30Days,
    last30DaysTotal: 0,
    today: {
      date: todayKey,
      views: 0,
    },
    currentMonth: {
      month: currentMonthKey,
      views: 0,
    },
    previousMonth: {
      month: previousMonthKey,
      views: 0,
    },
    monthlyOverview,
  };
}

export async function getLandingPageAnalyticsSnapshot(
  now: Date = new Date(),
): Promise<LandingPageAnalyticsSnapshot> {
  if (!hasFirebaseAdminCredentials()) {
    return getEmptyLandingPageAnalyticsSnapshot(now, false);
  }

  const dateKeys = buildRecentDateKeys(30, now);
  const monthKeys = buildRecentMonthKeys(12, now);
  const analyticsDb = getAdminDb();

  const [dailySnapshots, monthlySnapshots] = await Promise.all([
    Promise.all(
      dateKeys.map((dateKey) =>
        analyticsDb.collection(DAILY_COLLECTION).doc(dateKey).get(),
      ),
    ),
    Promise.all(
      monthKeys.map((monthKey) =>
        analyticsDb.collection(MONTHLY_COLLECTION).doc(monthKey).get(),
      ),
    ),
  ]);

  const last30Days = dateKeys.map((date, index) => ({
    date,
    views: readTotal(dailySnapshots[index]?.data()),
  }));
  const monthlyOverview = monthKeys.map((month, index) => ({
    month,
    views: readTotal(monthlySnapshots[index]?.data()),
  }));

  const todayKey = getLandingPageAnalyticsDateKey(now);
  const currentMonthKey = getLandingPageAnalyticsMonthKey(now);
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  return {
    available: true,
    last30Days,
    last30DaysTotal: last30Days.reduce((sum, entry) => sum + entry.views, 0),
    today:
      last30Days.find((entry) => entry.date === todayKey) ?? {
        date: todayKey,
        views: 0,
      },
    currentMonth:
      monthlyOverview.find((entry) => entry.month === currentMonthKey) ?? {
        month: currentMonthKey,
        views: 0,
      },
    previousMonth:
      monthlyOverview.find((entry) => entry.month === previousMonthKey) ?? {
        month: previousMonthKey,
        views: 0,
      },
    monthlyOverview,
  };
}
