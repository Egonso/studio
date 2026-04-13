'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface AffiliateStatus {
  isAffiliate: boolean;
  slug: string | null;
  loading: boolean;
}

/**
 * Lightweight client-side hook that reads the user's own affiliate document
 * directly from Firestore (allowed by security rules: affiliates/{email}).
 * No server action needed — result is cached for the session.
 */
export function useIsAffiliate(): AffiliateStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<AffiliateStatus>({
    isAffiliate: false,
    slug: null,
    loading: true,
  });

  useEffect(() => {
    if (!user?.email) {
      setStatus({ isAffiliate: false, slug: null, loading: false });
      return;
    }

    let cancelled = false;
    const email = user.email.toLowerCase();

    (async () => {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getFirebaseDb();
        const docRef = doc(db, 'affiliates', email);
        const snap = await getDoc(docRef);

        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data();
          setStatus({
            isAffiliate: data.active !== false,
            slug: data.slug ?? null,
            loading: false,
          });
        } else {
          setStatus({ isAffiliate: false, slug: null, loading: false });
        }
      } catch {
        if (!cancelled) {
          setStatus({ isAffiliate: false, slug: null, loading: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return status;
}
