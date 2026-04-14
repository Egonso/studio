/**
 * Centralized locale configuration for the AI Register platform.
 * All date/number formatting should use these constants to ensure
 * consistent en-GB formatting across the application.
 */

export const APP_LOCALE = 'en-GB' as const;

export const APP_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

export const APP_DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  ...APP_DATE_FORMAT,
  hour: '2-digit',
  minute: '2-digit',
};

export const APP_CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
};

export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString(APP_LOCALE, APP_DATE_FORMAT);
}

export function formatDateTime(date: Date | string | number): string {
  return new Date(date).toLocaleDateString(APP_LOCALE, APP_DATETIME_FORMAT);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(APP_LOCALE, APP_CURRENCY_FORMAT).format(amount);
}
