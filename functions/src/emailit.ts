import {
  emailitApiKeySecret,
  emailitFromEmailParam,
  emailitSupplierReminderTemplateParam,
  emailitWelcomeTemplateParam,
} from './runtimeParams';

const EMAILIT_API_BASE_URL = 'https://api.emailit.com/v2';

interface EmailitBaseInput {
  apiKey: string;
  from: string;
  to: string | string[];
  replyTo?: string | string[];
  idempotencyKey?: string;
  meta?: Record<string, string>;
  tracking?: boolean | { loads?: boolean; clicks?: boolean };
}

interface SendEmailitTemplateEmailInput extends EmailitBaseInput {
  template: string;
  variables?: Record<string, unknown>;
  subject?: string;
}

interface SendEmailitRawEmailInput extends EmailitBaseInput {
  subject: string;
  html: string;
  text: string;
}

export interface EmailitSendResult {
  id: string | null;
  status: string | null;
}

export class EmailitApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Emailit send failed (${status}): ${message}`);
    this.name = 'EmailitApiError';
  }

  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export class EmailitNetworkError extends Error {
  constructor() {
    super('Emailit network request failed.');
    this.name = 'EmailitNetworkError';
  }
}

export function isRetryableEmailitError(error: unknown): boolean {
  return (
    error instanceof EmailitNetworkError ||
    (error instanceof EmailitApiError && error.retryable)
  );
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
  await sendEmailitRequest(input, {
    ...(input.subject ? { subject: input.subject } : {}),
    template: input.template,
    variables: input.variables ?? {},
  });
}

export async function sendEmailitRawEmail(
  input: SendEmailitRawEmailInput,
): Promise<EmailitSendResult> {
  return sendEmailitRequest(input, {
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

async function sendEmailitRequest(
  input: EmailitBaseInput,
  content: Record<string, unknown>,
): Promise<EmailitSendResult> {
  let response: Response;
  try {
    response = await fetch(`${EMAILIT_API_BASE_URL}/emails`, {
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
        ...content,
        meta: sanitizeMeta(input.meta),
        tracking: input.tracking ?? false,
      }),
    });
  } catch {
    throw new EmailitNetworkError();
  }

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new EmailitApiError(response.status, message);
  }

  try {
    const data = (await response.json()) as { id?: unknown; status?: unknown };
    return {
      id: typeof data.id === 'string' ? data.id : null,
      status: typeof data.status === 'string' ? data.status : null,
    };
  } catch {
    return { id: null, status: null };
  }
}

function safeSecretValue(secret: { value: () => string }): string | null {
  try {
    return parseTrimmed(secret.value());
  } catch {
    return null;
  }
}

function safeStringValue(param: { value: () => string }): string | null {
  try {
    return parseTrimmed(param.value());
  } catch {
    return null;
  }
}

export function resolveFunctionsEmailitApiKey(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_API_KEY) ??
    safeSecretValue(emailitApiKeySecret) ??
    null
  );
}

export function resolveFunctionsEmailitFromEmail(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_FROM_EMAIL) ??
    safeStringValue(emailitFromEmailParam) ??
    null
  );
}

export function resolveFunctionsReminderTemplate(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_SUPPLIER_REMINDER_TEMPLATE) ??
    safeStringValue(emailitSupplierReminderTemplateParam) ??
    null
  );
}

export function resolveFunctionsWelcomeTemplate(): string | null {
  return (
    parseTrimmed(process.env.EMAILIT_WELCOME_TEMPLATE) ??
    safeStringValue(emailitWelcomeTemplateParam) ??
    null
  );
}
