import '@/lib/server-only-guard';

import { FieldValue } from 'firebase-admin/firestore';

import type { LandingVideoEventPayload } from '@/lib/analytics/landing-video-events';
import { getAdminDb, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { getLandingPageAnalyticsDateKey } from '@/lib/admin/landing-page-analytics';

const COLLECTION = 'landing_video_event_daily';

export async function recordLandingVideoEvent(
  payload: LandingVideoEventPayload,
): Promise<void> {
  if (!hasFirebaseAdminCredentials()) return;

  const date = getLandingPageAnalyticsDateKey();
  await getAdminDb()
    .collection(COLLECTION)
    .doc(date)
    .set(
      {
        date,
        total: FieldValue.increment(1),
        events: {
          [payload.event]: {
            [payload.locale]: {
              [payload.variant]: FieldValue.increment(1),
            },
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
