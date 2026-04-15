export type DraftAssistAnalyticsEventName =
  | "draft_assist_started"
  | "draft_assist_completed"
  | "draft_assist_handoff_accepted"
  | "draft_assist_handoff_dismissed";

type Primitive = string | number | boolean | null;
type PayloadValue = Primitive | Primitive[];

export type DraftAssistAnalyticsPayload = Record<string, PayloadValue>;

export interface DraftAssistAnalyticsEvent {
  name: DraftAssistAnalyticsEventName;
  occurredAt: string;
  payload: DraftAssistAnalyticsPayload;
}

export interface DraftAssistAnalyticsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AnalyticsOptions {
  storage?: DraftAssistAnalyticsStorage;
  now?: Date;
}

interface DraftAssistStartedPayload {
  mode: "register" | "guest";
  hasContext: boolean;
}

interface DraftAssistCompletedPayload {
  mode: "register" | "guest";
  verdict: "ready_for_handoff" | "needs_input" | "blocked";
  questionCount: number;
  hasHandoff: boolean;
  duplicateHintCount: number;
  reviewTriggerCount: number;
  missingFactCount: number;
}

interface DraftAssistHandoffPayload {
  mode: "register" | "guest";
  verdict: "ready_for_handoff" | "needs_input" | "blocked";
}

const EVENTS_KEY = "draft_assist_analytics_events_v1";
const MAX_EVENTS = 500;

function resolveStorage(
  storage?: DraftAssistAnalyticsStorage,
): DraftAssistAnalyticsStorage | null {
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
  storage: DraftAssistAnalyticsStorage,
): DraftAssistAnalyticsEvent[] {
  return safeParseJson<DraftAssistAnalyticsEvent[]>(
    storage.getItem(EVENTS_KEY),
    [],
  );
}

function writeEvents(
  storage: DraftAssistAnalyticsStorage,
  events: DraftAssistAnalyticsEvent[],
): void {
  storage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function trackDraftAssistEvent(
  name: DraftAssistAnalyticsEventName,
  payload: DraftAssistAnalyticsPayload,
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return null;
  }

  const event: DraftAssistAnalyticsEvent = {
    name,
    occurredAt: (options.now ?? new Date()).toISOString(),
    payload,
  };

  const events = readEvents(storage);
  events.push(event);
  writeEvents(storage, events);

  return event;
}

export function getTrackedDraftAssistEvents(
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent[] {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return [];
  }

  return readEvents(storage);
}

export function clearTrackedDraftAssistEvents(
  options: AnalyticsOptions = {},
): void {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return;
  }

  writeEvents(storage, []);
}

export function trackDraftAssistStarted(
  payload: DraftAssistStartedPayload,
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent | null {
  return trackDraftAssistEvent(
    "draft_assist_started",
    {
      mode: payload.mode,
      has_context: payload.hasContext,
    },
    options,
  );
}

export function trackDraftAssistCompleted(
  payload: DraftAssistCompletedPayload,
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent | null {
  return trackDraftAssistEvent(
    "draft_assist_completed",
    {
      mode: payload.mode,
      verdict: payload.verdict,
      question_count: payload.questionCount,
      has_handoff: payload.hasHandoff,
      duplicate_hint_count: payload.duplicateHintCount,
      review_trigger_count: payload.reviewTriggerCount,
      missing_fact_count: payload.missingFactCount,
    },
    options,
  );
}

export function trackDraftAssistHandoffAccepted(
  payload: DraftAssistHandoffPayload,
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent | null {
  return trackDraftAssistEvent(
    "draft_assist_handoff_accepted",
    {
      mode: payload.mode,
      verdict: payload.verdict,
    },
    options,
  );
}

export function trackDraftAssistHandoffDismissed(
  payload: DraftAssistHandoffPayload,
  options: AnalyticsOptions = {},
): DraftAssistAnalyticsEvent | null {
  return trackDraftAssistEvent(
    "draft_assist_handoff_dismissed",
    {
      mode: payload.mode,
      verdict: payload.verdict,
    },
    options,
  );
}
