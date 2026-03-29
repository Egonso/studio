import { createHmac, timingSafeEqual } from 'node:crypto';

// ── HMAC-Signed Supplier Session Cookie ─────────────────────────────────────
//
// After OTP verification, we set a short-lived httpOnly cookie that proves
// the supplier contact has verified their email. The cookie is HMAC-signed
// with a server secret — no JWT, no client-side decoding needed.

const COOKIE_NAME = '__supplier_session';
const SESSION_TTL_SECONDS = 3600; // 60 minutes

interface SupplierSessionPayload {
  inviteId: string;
  verifiedEmail: string;
  verifiedAt: string;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SUPPLIER_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SUPPLIER_SESSION_SECRET is not configured. Cannot sign supplier sessions.'
    );
  }
  return secret;
}

function getPreviousSessionSecret(): string | null {
  return process.env.SUPPLIER_SESSION_SECRET_PREVIOUS ?? null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = Buffer.from(sign(payload, secret), 'utf8');
  const actual = Buffer.from(signature, 'utf8');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function createSupplierSessionCookie(
  inviteId: string,
  verifiedEmail: string
): { name: string; value: string; options: Record<string, unknown> } {
  const now = Math.floor(Date.now() / 1000);
  const payload: SupplierSessionPayload = {
    inviteId,
    verifiedEmail,
    verifiedAt: new Date().toISOString(),
    exp: now + SESSION_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(payloadB64, getSessionSecret());

  return {
    name: COOKIE_NAME,
    value: `${payloadB64}.${signature}`,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: SESSION_TTL_SECONDS,
      path: '/request',
    },
  };
}

export type SessionValidationError =
  | 'missing'
  | 'malformed'
  | 'invalid_signature'
  | 'expired'
  | 'invite_mismatch';

export function validateSupplierSession(
  cookieValue: string | undefined,
  expectedInviteId: string
):
  | { valid: true; payload: SupplierSessionPayload }
  | { valid: false; reason: SessionValidationError } {
  if (!cookieValue) {
    return { valid: false, reason: 'missing' };
  }

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) {
    return { valid: false, reason: 'malformed' };
  }

  const payloadB64 = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'malformed' };
  }

  // Try current secret, then previous (key rotation support)
  const currentSecret = getSessionSecret();
  let signatureValid = verifySignature(payloadB64, signature, currentSecret);

  if (!signatureValid) {
    const previousSecret = getPreviousSessionSecret();
    if (previousSecret) {
      signatureValid = verifySignature(payloadB64, signature, previousSecret);
    }
  }

  if (!signatureValid) {
    return { valid: false, reason: 'invalid_signature' };
  }

  let payload: SupplierSessionPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { valid: false, reason: 'expired' };
  }

  if (payload.inviteId !== expectedInviteId) {
    return { valid: false, reason: 'invite_mismatch' };
  }

  return { valid: true, payload };
}

export const SUPPLIER_SESSION_COOKIE_NAME = COOKIE_NAME;
