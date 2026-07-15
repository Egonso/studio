export const LANDING_VIDEO_EVENTS = [
  'impression',
  'play',
  'progress_25',
  'progress_50',
  'progress_75',
  'complete',
  'cta',
] as const;

export type LandingVideoEvent = (typeof LANDING_VIDEO_EVENTS)[number];
export type LandingVideoLocale = 'de' | 'en';
export type LandingVideoVariant = 'hero_loop' | 'master';

export interface LandingVideoEventPayload {
  event: LandingVideoEvent;
  locale: LandingVideoLocale;
  variant: LandingVideoVariant;
}

export function normalizeLandingVideoEvent(
  value: unknown,
): LandingVideoEventPayload | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const event = input.event;
  const locale = input.locale;
  const variant = input.variant;

  if (
    typeof event !== 'string' ||
    !LANDING_VIDEO_EVENTS.includes(event as LandingVideoEvent)
  ) {
    return null;
  }
  if (locale !== 'de' && locale !== 'en') return null;
  if (variant !== 'hero_loop' && variant !== 'master') return null;

  return {
    event: event as LandingVideoEvent,
    locale,
    variant,
  };
}
