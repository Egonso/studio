export type CoverageAssistAnalyticsEventName =
  | "assist_signal_shown"
  | "assist_entry_shown"
  | "assist_suggestion_selected"
  | "assist_custom_purpose_used"
  | "assist_dismissed"
  | "assist_saved"
  | "assist_disabled";

type Primitive = string | number | boolean | null;
type PayloadValue = Primitive | Primitive[];

export type CoverageAssistAnalyticsPayload = Record<string, PayloadValue>;

export interface CoverageAssistAnalyticsEvent {
  name: CoverageAssistAnalyticsEventName;
  occurredAt: string;
  payload: CoverageAssistAnalyticsPayload;
}

interface CoverageAssistAnalyticsState {
  lastSignalSignature: string | null;
  lastEntrySignature: string | null;
}

export interface CoverageAssistAnalyticsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AnalyticsOptions {
  storage?: CoverageAssistAnalyticsStorage;
  now?: Date;
}

interface CoverageAssistSignalPayload {
  source: string;
  toolId: string;
  matchedHost?: string | null;
}

interface CoverageAssistEntryPayload extends CoverageAssistSignalPayload {
  suggestionCount: number;
}

interface CoverageAssistSuggestionPayload {
  source: string;
  toolId: string;
  seedSuggestionId: string;
  libraryVersion?: string | null;
}

interface CoverageAssistCustomPurposePayload {
  source: string;
  toolId: string;
}

interface CoverageAssistSavedPayload {
  source: string;
  toolId: string;
  selectionMode?: string | null;
  seedSuggestionId?: string | null;
  libraryVersion?: string | null;
}

interface CoverageAssistDisabledPayload {
  source: string;
  location?: string | null;
}

const EVENTS_KEY = "coverage_assist_analytics_events_v1";
const STATE_KEY = "coverage_assist_analytics_state_v1";
const MAX_EVENTS = 500;

const DEFAULT_STATE: CoverageAssistAnalyticsState = {
  lastSignalSignature: null,
  lastEntrySignature: null,
};

function resolveStorage(
  storage?: CoverageAssistAnalyticsStorage
): CoverageAssistAnalyticsStorage | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readEvents(
  storage: CoverageAssistAnalyticsStorage
): CoverageAssistAnalyticsEvent[] {
  return safeParseJson<CoverageAssistAnalyticsEvent[]>(
    storage.getItem(EVENTS_KEY),
    []
  );
}

function writeEvents(
  storage: CoverageAssistAnalyticsStorage,
  events: CoverageAssistAnalyticsEvent[]
): void {
  storage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

function readState(
  storage: CoverageAssistAnalyticsStorage
): CoverageAssistAnalyticsState {
  const parsed = safeParseJson<Partial<CoverageAssistAnalyticsState>>(
    storage.getItem(STATE_KEY),
    DEFAULT_STATE
  );

  return {
    lastSignalSignature: parsed.lastSignalSignature ?? null,
    lastEntrySignature: parsed.lastEntrySignature ?? null,
  };
}

function writeState(
  storage: CoverageAssistAnalyticsStorage,
  state: CoverageAssistAnalyticsState
): void {
  storage.setItem(STATE_KEY, JSON.stringify(state));
}

function toIso(now: Date): string {
  return now.toISOString();
}

export function trackCoverageAssistEvent(
  name: CoverageAssistAnalyticsEventName,
  payload: CoverageAssistAnalyticsPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return null;
  }

  const now = options.now ?? new Date();
  const event: CoverageAssistAnalyticsEvent = {
    name,
    occurredAt: toIso(now),
    payload,
  };

  const events = readEvents(storage);
  events.push(event);
  writeEvents(storage, events);

  return event;
}

export function getTrackedCoverageAssistEvents(
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent[] {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return [];
  }

  return readEvents(storage);
}

export function clearTrackedCoverageAssistEvents(
  options: AnalyticsOptions = {}
): void {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return;
  }

  writeEvents(storage, []);
  writeState(storage, DEFAULT_STATE);
}

export function trackCoverageAssistSignalShown(
  payload: CoverageAssistSignalPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return null;
  }

  const state = readState(storage);
  const signature = [
    payload.source,
    payload.toolId,
    payload.matchedHost ?? "",
  ].join(":");

  if (state.lastSignalSignature === signature) {
    return null;
  }

  state.lastSignalSignature = signature;
  writeState(storage, state);

  return trackCoverageAssistEvent(
    "assist_signal_shown",
    {
      source: payload.source,
      tool_id: payload.toolId,
      matched_host: payload.matchedHost ?? null,
    },
    options
  );
}

export function trackCoverageAssistEntryShown(
  payload: CoverageAssistEntryPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return null;
  }

  const state = readState(storage);
  const signature = [
    payload.source,
    payload.toolId,
    payload.matchedHost ?? "",
  ].join(":");

  if (state.lastEntrySignature === signature) {
    return null;
  }

  state.lastEntrySignature = signature;
  writeState(storage, state);

  return trackCoverageAssistEvent(
    "assist_entry_shown",
    {
      source: payload.source,
      tool_id: payload.toolId,
      matched_host: payload.matchedHost ?? null,
      suggestion_count: payload.suggestionCount,
    },
    options
  );
}

export function trackCoverageAssistSuggestionSelected(
  payload: CoverageAssistSuggestionPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  return trackCoverageAssistEvent(
    "assist_suggestion_selected",
    {
      source: payload.source,
      tool_id: payload.toolId,
      seed_suggestion_id: payload.seedSuggestionId,
      library_version: payload.libraryVersion ?? null,
    },
    options
  );
}

export function trackCoverageAssistCustomPurposeUsed(
  payload: CoverageAssistCustomPurposePayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  return trackCoverageAssistEvent(
    "assist_custom_purpose_used",
    {
      source: payload.source,
      tool_id: payload.toolId,
    },
    options
  );
}

export function trackCoverageAssistDismissed(
  payload: CoverageAssistSignalPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  return trackCoverageAssistEvent(
    "assist_dismissed",
    {
      source: payload.source,
      tool_id: payload.toolId,
      matched_host: payload.matchedHost ?? null,
    },
    options
  );
}

export function trackCoverageAssistSaved(
  payload: CoverageAssistSavedPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  return trackCoverageAssistEvent(
    "assist_saved",
    {
      source: payload.source,
      tool_id: payload.toolId,
      selection_mode: payload.selectionMode ?? null,
      seed_suggestion_id: payload.seedSuggestionId ?? null,
      library_version: payload.libraryVersion ?? null,
    },
    options
  );
}

export function trackCoverageAssistDisabled(
  payload: CoverageAssistDisabledPayload,
  options: AnalyticsOptions = {}
): CoverageAssistAnalyticsEvent | null {
  return trackCoverageAssistEvent(
    "assist_disabled",
    {
      source: payload.source,
      location: payload.location ?? null,
    },
    options
  );
}
