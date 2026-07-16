import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth } from '@/lib/firebase-admin';
import {
  parseProductFunnelEvent,
} from '@/lib/analytics/product-funnel-contract';
import { recordProductFunnelEvent } from '@/lib/analytics/product-funnel-server';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

const ALLOWED_ORIGINS = new Set([
  'https://kiregister.com',
  'https://www.kiregister.com',
  'https://eukigesetz.com',
  'https://www.eukigesetz.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3100',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:9002',
  'http://127.0.0.1:9002',
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    vary: 'Origin',
  };
}

function isOriginAllowed(origin: string | null): boolean {
  return !origin || ALLOWED_ORIGINS.has(origin);
}

async function resolveOptionalUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get('authorization')?.trim();
  if (!authorization) return null;

  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : authorization;
  if (!token) return null;

  const decoded = await getAdminAuth().verifyIdToken(token, false);
  return decoded.uid;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed.' },
      { status: 403, headers: corsHeaders },
    );
  }

  if (!registerFirstFlags.productFunnelAnalytics) {
    return NextResponse.json(
      { accepted: false, reason: 'disabled' },
      { status: 202, headers: corsHeaders },
    );
  }

  try {
    const rawBody = await request.text();
    if (rawBody.length > 8_192) {
      return NextResponse.json(
        { error: 'Event payload is too large.' },
        { status: 413, headers: corsHeaders },
      );
    }

    const event = parseProductFunnelEvent(JSON.parse(rawBody));
    if (
      event.eventName === 'returned_d7_for_action' ||
      event.eventName === 'returned_d30_for_action'
    ) {
      return NextResponse.json(
        { error: 'Derived analytics events are server-only.' },
        { status: 400, headers: corsHeaders },
      );
    }
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'product-funnel-event',
      key: buildRateLimitKey(
        request,
        event.context.anonymousSessionId,
        event.eventName,
      ),
      limit: 240,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Too many analytics events.' },
        { status: 429, headers: corsHeaders },
      );
    }

    const authenticatedUserId = await resolveOptionalUserId(request);
    const result = await recordProductFunnelEvent(event, {
      authenticatedUserId,
    });
    return NextResponse.json(
      { accepted: result.recorded || result.deduplicated, ...result },
      { status: 202, headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid analytics event.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const isAuthError =
      error instanceof Error && /token|auth/i.test(error.message);
    return NextResponse.json(
      { error: isAuthError ? 'Invalid authentication.' : 'Event could not be accepted.' },
      { status: isAuthError ? 401 : 500, headers: corsHeaders },
    );
  }
}
