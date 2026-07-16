'use client';

import { registerFirstFlags } from '@/lib/register-first/flags';

import {
  normalizeProductFunnelSessionId,
  type ProductFunnelEventInput,
} from './product-funnel-contract';

const SESSION_STORAGE_KEY = 'kiregister_product_session_v1';

type ClientProductFunnelEvent = ProductFunnelEventInput extends infer TEvent
  ? TEvent extends ProductFunnelEventInput
    ? Omit<TEvent, 'context'> & {
        context: Omit<TEvent['context'], 'anonymousSessionId'> & {
          anonymousSessionId?: string;
        };
      }
    : never
  : never;

function createOpaqueSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, '_');
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getOrCreateProductFunnelSessionId(
  preferredSessionId?: string | null,
): string {
  const preferred = normalizeProductFunnelSessionId(preferredSessionId);
  if (typeof window === 'undefined') {
    return preferred ?? createOpaqueSessionId();
  }

  const stored = normalizeProductFunnelSessionId(
    window.localStorage.getItem(SESSION_STORAGE_KEY),
  );
  const resolved = preferred ?? stored ?? createOpaqueSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, resolved);
  return resolved;
}

async function resolveAuthorizationHeader(): Promise<string | null> {
  try {
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const auth = await getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
}

export async function trackProductFunnelEvent(
  input: ClientProductFunnelEvent,
): Promise<boolean> {
  if (!registerFirstFlags.productFunnelAnalytics || typeof window === 'undefined') {
    return false;
  }

  const event = {
    ...input,
    context: {
      ...input.context,
      anonymousSessionId: getOrCreateProductFunnelSessionId(
        input.context.anonymousSessionId,
      ),
      occurredAt: input.context.occurredAt ?? new Date().toISOString(),
    },
  } satisfies ProductFunnelEventInput;

  const authorization = await resolveAuthorizationHeader();
  try {
    const response = await fetch('/api/analytics/product-funnel', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(event),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function trackProductFunnelEventOnce(
  storageKey: string,
  input: ClientProductFunnelEvent,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const key = `kiregister_product_event_once:${storageKey}`;
  if (window.sessionStorage.getItem(key) === '1') return false;

  const recorded = await trackProductFunnelEvent(input);
  if (recorded) {
    window.sessionStorage.setItem(key, '1');
  }
  return recorded;
}
