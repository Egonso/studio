import * as functions from 'firebase-functions/v1';

const EMAILIT_API_BASE_URL = 'https://api.emailit.com/v2';

interface SendEmailitTemplateEmailInput {
  apiKey: string;
  from: string;
  to: string | string[];
  template: string;
  variables?: Record<string, unknown>;
  replyTo?: string | string[];
  subject?: string;
  idempotencyKey?: string;
  meta?: Record<string, string>;
  tracking?: boolean | { loads?: boolean; clicks?: boolean };
}

function parseTrimmed(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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

function sanitizeMeta(
  meta: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!meta) {
    return undefined;
  }

  const entries = Object.entries(meta).filter(
    ([key, value]) => key.trim().length > 0 && value.trim().length > 0,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function sendEmailitTemplateEmail(
  input: SendEmailitTemplateEmailInput,
): Promise<void> {
  const response = await fetch(`${EMAILIT_API_BASE_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      ...(input.idempotencyKey
        ? { 'Idempotency-Key': input.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
      template: input.template,
      variables: input.variables ?? {},
      meta: sanitizeMeta(input.meta),
      tracking: input.tracking ?? false,
    }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(`Emailit send failed (${response.status}): ${message}`);
  }
}

function getFunctionsConfig() {
  return functions.config?.() as {
    emailit?: {
      api_key?: string;
      from_email?: string;
      welcome_template?: string;
      supplier_reminder_template?: string;
    };
  };
}

export function resolveFunctionsEmailitApiKey(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_API_KEY) ??
    parseTrimmed(getFunctionsConfig().emailit?.api_key) ??
    null
  );
}

export function resolveFunctionsEmailitFromEmail(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_FROM_EMAIL) ??
    parseTrimmed(getFunctionsConfig().emailit?.from_email) ??
    null
  );
}

export function resolveFunctionsEmailitTemplate(
  envKey: string,
  legacyConfigKey: 'welcome_template' | 'supplier_reminder_template',
): string | null {
  return (
    parseTrimmed(process.env[envKey]) ??
    parseTrimmed(getFunctionsConfig().emailit?.[legacyConfigKey]) ??
    null
  );
}
