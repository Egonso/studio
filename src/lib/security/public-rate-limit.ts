import { createHash } from 'node:crypto';

import { db, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { logWarn } from '@/lib/observability/logger';

const fallbackRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface PublicRateLimitDecision {
  ok: boolean;
  retryAfterMs: number | null;
  source: 'firestore' | 'memory';
}

interface PublicRateLimitInput {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
}

function buildHashedKey(namespace: string, key: string): string {
  return createHash('sha256').update(`${namespace}:${key}`).digest('hex');
}

function checkMemoryRateLimit(
  hashedKey: string,
  limit: number,
  windowMs: number,
  now: number,
): PublicRateLimitDecision {
  const current = fallbackRateLimitMap.get(hashedKey);

  if (!current || current.resetAt <= now) {
    fallbackRateLimitMap.set(hashedKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      ok: true,
      retryAfterMs: null,
      source: 'memory',
    };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(current.resetAt - now, 0),
      source: 'memory',
    };
  }

  fallbackRateLimitMap.set(hashedKey, {
    count: current.count + 1,
    resetAt: current.resetAt,
  });

  return {
    ok: true,
    retryAfterMs: null,
    source: 'memory',
  };
}

export async function checkPublicRateLimit(
  input: PublicRateLimitInput,
): Promise<PublicRateLimitDecision> {
  const now = Date.now();
  const hashedKey = buildHashedKey(input.namespace, input.key);

  if (!hasFirebaseAdminCredentials()) {
    return checkMemoryRateLimit(hashedKey, input.limit, input.windowMs, now);
  }

  try {
    const docRef = db.collection('publicRateLimits').doc(hashedKey);

    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);

      if (!snapshot.exists) {
        transaction.set(
          docRef,
          {
            namespace: input.namespace,
            scopeKeyHash: hashedKey,
            count: 1,
            resetAt: now + input.windowMs,
            windowStartedAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          },
          { merge: true },
        );

        return {
          ok: true,
          retryAfterMs: null,
          source: 'firestore' as const,
        };
      }

      const data = snapshot.data() ?? {};
      const resetAt =
        typeof data.resetAt === 'number' ? data.resetAt : now + input.windowMs;
      const count = typeof data.count === 'number' ? data.count : 0;

      if (resetAt <= now) {
        transaction.set(
          docRef,
          {
            namespace: input.namespace,
            scopeKeyHash: hashedKey,
            count: 1,
            resetAt: now + input.windowMs,
            windowStartedAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          },
          { merge: true },
        );

        return {
          ok: true,
          retryAfterMs: null,
          source: 'firestore' as const,
        };
      }

      if (count >= input.limit) {
        return {
          ok: false,
          retryAfterMs: Math.max(resetAt - now, 0),
          source: 'firestore' as const,
        };
      }

      transaction.set(
        docRef,
        {
          namespace: input.namespace,
          scopeKeyHash: hashedKey,
          count: count + 1,
          resetAt,
          updatedAt: new Date(now).toISOString(),
        },
        { merge: true },
      );

      return {
        ok: true,
        retryAfterMs: null,
        source: 'firestore' as const,
      };
    });
  } catch (error) {
    logWarn('public_rate_limit_fallback', {
      namespace: input.namespace,
      message: error instanceof Error ? error.message : 'unknown_error',
    });

    return checkMemoryRateLimit(hashedKey, input.limit, input.windowMs, now);
  }
}
