'use client';

import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { AFFILIATE_COOKIE_NAME } from '@/lib/affiliate/types';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const entry = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  if (!entry) {
    return null;
  }

  return decodeURIComponent(entry.slice(prefix.length));
}

function isValidAffiliateSlug(value: string | null): value is string {
  return Boolean(value && /^[a-z0-9_-]+$/i.test(value));
}

function hasSessionMarker(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setSessionMarker(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Tracking must never block the product.
  }
}

function hasLocalMarker(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setLocalMarker(key: string): void {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Attribution is retried by the backend if this client marker cannot be stored.
  }
}

export function AffiliateAttributionTracker() {
  const { user } = useAuth();

  useEffect(() => {
    const slug = readCookie(AFFILIATE_COOKIE_NAME);
    if (!isValidAffiliateSlug(slug)) {
      return;
    }

    const markerKey = `affiliate-click:${slug}`;
    if (hasSessionMarker(markerKey)) {
      return;
    }

    setSessionMarker(markerKey);
    void fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const slug = readCookie(AFFILIATE_COOKIE_NAME);
    if (!isValidAffiliateSlug(slug)) {
      return;
    }

    const markerKey = `affiliate-signup:${user.uid}:${slug}`;
    if (hasLocalMarker(markerKey)) {
      return;
    }

    let cancelled = false;

    void user
      .getIdToken()
      .then((idToken) =>
        fetch('/api/affiliate/attribute-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ slug }),
        }),
      )
      .then((response) => {
        if (!cancelled && response.ok) {
          setLocalMarker(markerKey);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
