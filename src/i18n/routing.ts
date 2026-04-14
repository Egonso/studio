import { defineRouting } from 'next-intl/routing';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

/**
 * next-intl routing configuration.
 *
 * Locale detection (localeDetection: true):
 *   - Reads the browser's Accept-Language header on first visit
 *   - DACH users (de, de-AT, de-CH) → /de/... automatically
 *   - Other users → /en/... (closest match, fallback to default 'de')
 *   - Manual selection via LocaleSwitcher stores preference in NEXT_LOCALE cookie
 *   - Cookie takes priority over Accept-Language on subsequent visits
 *
 * Adding new languages (e.g. French):
 *   1. Add 'fr' to locales array
 *   2. Create messages/fr.json
 *   3. That's it — routing and switching work automatically
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always show locale prefix: /de/... and /en/...
  // Clean for SEO, required for multi-language landing pages
  localePrefix: 'always',
  // Detect locale from Accept-Language browser header
  // Falls back to defaultLocale ('de') if no match found
  localeDetection: true,
});
