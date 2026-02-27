export type ControlAnalyticsEventName =
  | "control_opened"
  | "trigger_shown"
  | "trigger_clicked"
  | "control_conversion"
  | "recommendation_completed"
  | "maturity_level_changed";

type Primitive = string | number | boolean | null;

type PayloadValue = Primitive | Primitive[];

export type ControlAnalyticsPayload = Record<string, PayloadValue>;

export interface ControlAnalyticsEvent {
  name: ControlAnalyticsEventName;
  occurredAt: string;
  payload: ControlAnalyticsPayload;
}

interface ControlAnalyticsState {
  previousRecommendationIds: string[];
  firstRecommendationSeenAt: string | null;
  firstRecommendationCompletedAt: string | null;
  previousMaturityLevel: number | null;
  conversionSources: string[];
  lastTriggerSignature: string | null;
}

export interface ControlAnalyticsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AnalyticsOptions {
  storage?: ControlAnalyticsStorage;
  now?: Date;
}

interface TriggerShownPayload {
  triggerIds: string[];
  triggerCount: number;
  source: string;
  useCaseCount: number;
}

interface TriggerClickedPayload {
  triggerIds: string[];
  triggerCount: number;
  source: string;
  useCaseCount: number;
}

interface ControlOpenedPayload {
  route: string;
  entry: string;
}

interface ControlConversionPayload {
  source: string;
  triggerIds: string[];
}

interface RecommendationProgressPayload {
  route: string;
}

const EVENTS_KEY = "control_analytics_events_v1";
const STATE_KEY = "control_analytics_state_v1";
const MAX_EVENTS = 500;

const DEFAULT_STATE: ControlAnalyticsState = {
  previousRecommendationIds: [],
  firstRecommendationSeenAt: null,
  firstRecommendationCompletedAt: null,
  previousMaturityLevel: null,
  conversionSources: [],
  lastTriggerSignature: null,
};

function resolveStorage(storage?: ControlAnalyticsStorage): ControlAnalyticsStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readEvents(storage: ControlAnalyticsStorage): ControlAnalyticsEvent[] {
  return safeParseJson<ControlAnalyticsEvent[]>(storage.getItem(EVENTS_KEY), []);
}

function writeEvents(storage: ControlAnalyticsStorage, events: ControlAnalyticsEvent[]): void {
  storage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

function readState(storage: ControlAnalyticsStorage): ControlAnalyticsState {
  const parsed = safeParseJson<Partial<ControlAnalyticsState>>(
    storage.getItem(STATE_KEY),
    DEFAULT_STATE
  );

  return {
    previousRecommendationIds: parsed.previousRecommendationIds ?? [],
    firstRecommendationSeenAt: parsed.firstRecommendationSeenAt ?? null,
    firstRecommendationCompletedAt: parsed.firstRecommendationCompletedAt ?? null,
    previousMaturityLevel: parsed.previousMaturityLevel ?? null,
    conversionSources: parsed.conversionSources ?? [],
    lastTriggerSignature: parsed.lastTriggerSignature ?? null,
  };
}

function writeState(storage: ControlAnalyticsStorage, state: ControlAnalyticsState): void {
  storage.setItem(STATE_KEY, JSON.stringify(state));
}

function toIso(now: Date): string {
  return now.toISOString();
}

export function trackControlEvent(
  name: ControlAnalyticsEventName,
  payload: ControlAnalyticsPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const now = options.now ?? new Date();
  const event: ControlAnalyticsEvent = {
    name,
    occurredAt: toIso(now),
    payload,
  };

  const events = readEvents(storage);
  events.push(event);
  writeEvents(storage, events);

  return event;
}

export function getTrackedControlEvents(
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent[] {
  const storage = resolveStorage(options.storage);
  if (!storage) return [];
  return readEvents(storage);
}

export function clearTrackedControlEvents(options: AnalyticsOptions = {}): void {
  const storage = resolveStorage(options.storage);
  if (!storage) return;
  writeEvents(storage, []);
  writeState(storage, DEFAULT_STATE);
}

export function trackTriggerShown(
  payload: TriggerShownPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const state = readState(storage);
  const signature = [...payload.triggerIds].sort().join(",");

  if (state.lastTriggerSignature === signature) {
    return null;
  }

  state.lastTriggerSignature = signature;
  writeState(storage, state);

  return trackControlEvent(
    "trigger_shown",
    {
      source: payload.source,
      trigger_ids: payload.triggerIds,
      trigger_count: payload.triggerCount,
      use_case_count: payload.useCaseCount,
    },
    options
  );
}

export function trackTriggerClicked(
  payload: TriggerClickedPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  return trackControlEvent(
    "trigger_clicked",
    {
      source: payload.source,
      trigger_ids: payload.triggerIds,
      trigger_count: payload.triggerCount,
      use_case_count: payload.useCaseCount,
    },
    options
  );
}

export function trackControlOpened(
  payload: ControlOpenedPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  return trackControlEvent(
    "control_opened",
    {
      route: payload.route,
      entry: payload.entry,
    },
    options
  );
}

export function trackControlConversion(
  payload: ControlConversionPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const state = readState(storage);
  if (state.conversionSources.includes(payload.source)) {
    return null;
  }

  state.conversionSources = [...state.conversionSources, payload.source];
  writeState(storage, state);

  return trackControlEvent(
    "control_conversion",
    {
      source: payload.source,
      trigger_ids: payload.triggerIds,
      trigger_count: payload.triggerIds.length,
    },
    options
  );
}

export function syncRecommendationProgress(
  recommendationIds: string[],
  payload: RecommendationProgressPayload,
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const now = options.now ?? new Date();
  const nowIso = toIso(now);
  const state = readState(storage);

  if (!state.firstRecommendationSeenAt && recommendationIds.length > 0) {
    state.firstRecommendationSeenAt = nowIso;
  }

  const previouslyOpen = state.previousRecommendationIds;
  const resolvedIds = previouslyOpen.filter((id) => !recommendationIds.includes(id));

  state.previousRecommendationIds = [...recommendationIds];

  let event: ControlAnalyticsEvent | null = null;
  if (resolvedIds.length > 0) {
    const metricPayload: ControlAnalyticsPayload = {
      route: payload.route,
      resolved_count: resolvedIds.length,
      resolved_ids: resolvedIds,
      open_count_after_sync: recommendationIds.length,
    };

    if (!state.firstRecommendationCompletedAt) {
      state.firstRecommendationCompletedAt = nowIso;

      if (state.firstRecommendationSeenAt) {
        const firstSeenTs = Date.parse(state.firstRecommendationSeenAt);
        if (!Number.isNaN(firstSeenTs)) {
          metricPayload.seconds_to_first_completion = Math.max(
            0,
            Math.round((now.getTime() - firstSeenTs) / 1000)
          );
        }
      }
    }

    event = trackControlEvent("recommendation_completed", metricPayload, {
      ...options,
      now,
    });
  }

  writeState(storage, state);
  return event;
}

export function syncMaturityLevel(
  currentLevel: number,
  payload: { route: string },
  options: AnalyticsOptions = {}
): ControlAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const state = readState(storage);
  const previousLevel = state.previousMaturityLevel;
  state.previousMaturityLevel = currentLevel;
  writeState(storage, state);

  if (previousLevel === null || previousLevel === currentLevel) {
    return null;
  }

  return trackControlEvent(
    "maturity_level_changed",
    {
      route: payload.route,
      previous_level: previousLevel,
      current_level: currentLevel,
      delta: currentLevel - previousLevel,
    },
    options
  );
}
