import { z } from 'zod';

import { logWarn } from '@/lib/observability/logger';
import {
  checkPublicRateLimit,
  type PublicRateLimitDecision,
} from '@/lib/security/public-rate-limit';

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^\[::1\]$/i,
];

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const BLOCKED_TEXT_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /<\s*script\b/i,
    message: 'Script-Tags sind nicht erlaubt.',
  },
  {
    pattern: /<\s*(iframe|object|embed|svg|math|meta|link)\b/i,
    message: 'Eingebettete oder ausführbare HTML-Inhalte sind nicht erlaubt.',
  },
  {
    pattern: /\bon[a-z]+\s*=/i,
    message: 'Inline-Event-Handler sind nicht erlaubt.',
  },
  {
    pattern: /\bjavascript\s*:/i,
    message: 'Javascript-Protokolle sind nicht erlaubt.',
  },
  {
    pattern: /\bdata\s*:\s*text\/html/i,
    message: 'HTML-Daten-URIs sind nicht erlaubt.',
  },
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function applySafeTextChecks(
  schema: z.ZodString,
  label: string,
): z.ZodEffects<z.ZodString, string, string> {
  return schema.superRefine((value, context) => {
    if (CONTROL_CHARACTER_PATTERN.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} enthält unzulässige Steuerzeichen.`,
      });
    }

    for (const entry of BLOCKED_TEXT_PATTERNS) {
      if (entry.pattern.test(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: entry.message,
        });
        break;
      }
    }
  });
}

export const safeEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
  .max(254, 'E-Mail-Adresse ist zu lang.');

export function safePlainTextSchema(
  label: string,
  options: { min?: number; max: number },
) {
  return applySafeTextChecks(
    z
      .string()
      .trim()
      .min(options.min ?? 1, `${label} ist erforderlich.`)
      .max(options.max, `${label} ist zu lang.`),
    label,
  );
}

export function safeOptionalPlainTextSchema(
  label: string,
  options: { max: number },
) {
  return applySafeTextChecks(
    z
      .string()
      .trim()
      .max(options.max, `${label} ist zu lang.`),
    label,
  )
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();
}

export const safeIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Kennung ist erforderlich.')
  .max(128, 'Kennung ist zu lang.')
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/, 'Kennung ist ungültig.');

export function safeHttpsUrlSchema(label: string) {
  return z
    .string()
    .trim()
    .max(2048, `${label} ist zu lang.`)
    .superRefine((value, context) => {
      try {
        const parsed = new URL(value);

        if (parsed.protocol !== 'https:') {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} muss HTTPS verwenden.`,
          });
          return;
        }

        if (isPrivateHost(parsed.hostname.toLowerCase())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} darf keine lokale oder private Adresse verwenden.`,
          });
        }
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} ist keine gültige URL.`,
        });
      }
    });
}

export function getClientIp(request: Pick<Request, 'headers'>): string {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-nf-client-connection-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];

  for (const candidate of candidates) {
    const normalized = candidate?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return 'unknown';
}

export function buildRateLimitKey(
  request: Pick<Request, 'headers'>,
  ...parts: Array<string | null | undefined>
): string {
  return [getClientIp(request), ...parts]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(':');
}

export async function enforceRequestRateLimit(input: {
  request: Pick<Request, 'headers'>;
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
  logContext?: Record<string, string | number | boolean | null | undefined>;
}): Promise<PublicRateLimitDecision> {
  const decision = await checkPublicRateLimit({
    namespace: input.namespace,
    key: input.key,
    limit: input.limit,
    windowMs: input.windowMs,
  });

  if (!decision.ok) {
    logWarn('request_rate_limited', {
      namespace: input.namespace,
      limiterSource: decision.source,
      retryAfterMs: decision.retryAfterMs,
      ...input.logContext,
    });
  }

  return decision;
}
