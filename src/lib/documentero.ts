import '@/lib/server-only-guard';

export const DOCUMENTERO_API_URL = 'https://app.documentero.com/api';
const DEFAULT_AIMS_TEMPLATE_ID = 'jyhIyFKzOaQps7aWLoyX';
const DOCUMENTERO_API_KEY_ENV_NAME = ['DOCUMENTERO', 'API', 'KEY'].join('_');
const DOCUMENTERO_AIMS_TEMPLATE_ENV_NAME = ['DOCUMENTERO', 'AIMS', 'TEMPLATE', 'ID'].join('_');
const DOCUMENTERO_CERTIFICATION_TEMPLATE_ENV_NAME = ['DOCUMENTERO', 'TEMPLATE', 'ID'].join('_');

function readServerEnv(name: string): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  return env[name];
}

function normalizeEnvValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function resolveDocumenteroApiKey(): string | null {
  return normalizeEnvValue(readServerEnv(DOCUMENTERO_API_KEY_ENV_NAME));
}

export function resolveDocumenteroAimsTemplateId(): string {
  return (
    normalizeEnvValue(readServerEnv(DOCUMENTERO_AIMS_TEMPLATE_ENV_NAME)) ??
    DEFAULT_AIMS_TEMPLATE_ID
  );
}

export function resolveDocumenteroCertificationTemplateId(): string | null {
  return normalizeEnvValue(
    readServerEnv(DOCUMENTERO_CERTIFICATION_TEMPLATE_ENV_NAME),
  );
}
