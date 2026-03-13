export const BILLING_WELCOME_PATH = '/control/welcome';

function normalizeOptionalText(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

export function buildBillingWelcomePath(
  checkoutSessionId?: string | null,
  extras?: Record<string, string | boolean | null | undefined>,
): string {
  const normalizedSessionId = normalizeOptionalText(checkoutSessionId);
  const parts: string[] = [];

  if (normalizedSessionId) {
    parts.push(`checkout_session_id=${normalizedSessionId}`);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extras ?? {})) {
    if (typeof value === 'boolean') {
      if (value) {
        params.set(key, 'true');
      }
      continue;
    }

    const normalized = normalizeOptionalText(value);
    if (normalized) {
      params.set(key, normalized);
    }
  }

  const extraQuery = params.toString();
  if (extraQuery.length > 0) {
    parts.push(extraQuery);
  }

  const query = parts.join('&');
  return query.length > 0 ? `${BILLING_WELCOME_PATH}?${query}` : BILLING_WELCOME_PATH;
}
