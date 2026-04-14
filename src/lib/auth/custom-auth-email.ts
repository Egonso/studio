import '@/lib/server-only-guard';

import { randomUUID } from 'node:crypto';

import { buildPublicAppUrl } from '@/lib/app-url';

const EMAILIT_API_BASE_URL = 'https://api.emailit.com/v2';
const AUTH_ACTION_PATH = '/__/auth/action';

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readGreetingName(displayName?: string | null): string | null {
  const normalized = displayName?.trim();
  return normalized ? normalized : null;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as
      | { error?: string; message?: string }
      | { errors?: Array<{ message?: string }> };

    if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (
      'errors' in data &&
      Array.isArray(data.errors) &&
      typeof data.errors[0]?.message === 'string' &&
      data.errors[0].message.trim()
    ) {
      return data.errors[0].message;
    }
  } catch {
    // Fall back to status text below.
  }

  return response.statusText || `HTTP ${response.status}`;
}

async function sendEmailitEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  meta?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<void> {
  const response = await fetch(`${EMAILIT_API_BASE_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('EMAILIT_API_KEY')}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey ?? randomUUID(),
    },
    body: JSON.stringify({
      from: requireEnv('EMAILIT_FROM_EMAIL'),
      to: input.to,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      html: input.html,
      text: input.text,
      meta: input.meta,
      tracking: false,
    }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(`Emailit send failed (${response.status}): ${message}`);
  }
}

export function buildCustomAuthActionUrl(generatedLink: string): string {
  const source = new URL(generatedLink);
  const target = new URL(buildPublicAppUrl(AUTH_ACTION_PATH));

  source.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return target.toString();
}

export function buildAuthEmailContinueUrl(email: string): string {
  const params = new URLSearchParams({
    mode: 'login',
    email,
  });

  return buildPublicAppUrl(`/login?${params.toString()}`);
}

export async function sendCustomVerificationEmail(input: {
  to: string;
  displayName?: string | null;
  actionUrl: string;
}): Promise<void> {
  const greetingName = readGreetingName(input.displayName);
  const safeActionUrl = escapeHtml(input.actionUrl);
  const greeting = greetingName ? `Hallo ${escapeHtml(greetingName)},` : 'Hallo,';

  await sendEmailitEmail({
    to: input.to,
    subject: 'E-Mail-Adresse für KI Register bestätigen',
    html: [
      `<p>${greeting}</p>`,
      '<p>bitte bestätigen Sie Ihre E-Mail-Adresse für KI Register über den folgenden Link:</p>',
      `<p><a href="${safeActionUrl}">E-Mail-Adresse bestätigen</a></p>`,
      '<p>Falls Sie diese Bestätigung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>',
      '<p>Vielen Dank!</p>',
      '<p>Ihr KI Register Team</p>',
    ].join('\n'),
    text: [
      greetingName ? `Hallo ${greetingName},` : 'Hallo,',
      '',
      'bitte bestätigen Sie Ihre E-Mail-Adresse für KI Register über den folgenden Link:',
      input.actionUrl,
      '',
      'Falls Sie diese Bestätigung nicht angefordert haben, können Sie diese E-Mail ignorieren.',
      '',
      'Vielen Dank!',
      'Ihr KI Register Team',
    ].join('\n'),
    meta: {
      authFlow: 'email_verification',
      recipient: input.to.toLowerCase(),
    },
  });
}

export async function sendCustomPasswordResetEmail(input: {
  to: string;
  displayName?: string | null;
  actionUrl: string;
}): Promise<void> {
  const greetingName = readGreetingName(input.displayName);
  const safeActionUrl = escapeHtml(input.actionUrl);
  const greeting = greetingName ? `Hallo ${escapeHtml(greetingName)},` : 'Hallo,';

  await sendEmailitEmail({
    to: input.to,
    subject: 'Passwort für KI Register zurücksetzen',
    html: [
      `<p>${greeting}</p>`,
      '<p>über den folgenden Link können Sie Ihr Passwort für KI Register zurücksetzen:</p>',
      `<p><a href="${safeActionUrl}">Passwort zurücksetzen</a></p>`,
      '<p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>',
      '<p>Ihr KI Register Team</p>',
    ].join('\n'),
    text: [
      greetingName ? `Hallo ${greetingName},` : 'Hallo,',
      '',
      'über den folgenden Link können Sie Ihr Passwort für KI Register zurücksetzen:',
      input.actionUrl,
      '',
      'Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.',
      '',
      'Ihr KI Register Team',
    ].join('\n'),
    meta: {
      authFlow: 'password_reset',
      recipient: input.to.toLowerCase(),
    },
  });
}
