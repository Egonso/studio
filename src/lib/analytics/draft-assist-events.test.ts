import assert from "node:assert/strict";
import test from "node:test";

import {
  clearTrackedDraftAssistEvents,
  getTrackedDraftAssistEvents,
  trackDraftAssistCompleted,
  trackDraftAssistHandoffAccepted,
  trackDraftAssistHandoffDismissed,
  trackDraftAssistStarted,
  type DraftAssistAnalyticsStorage,
} from "./draft-assist-events";

function createMemoryStorage(): DraftAssistAnalyticsStorage {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

test("draft assist analytics track the local pilot funnel", () => {
  const storage = createMemoryStorage();
  clearTrackedDraftAssistEvents({ storage });

  trackDraftAssistStarted(
    {
      mode: "register",
      hasContext: true,
    },
    { storage, now: new Date("2026-04-12T09:00:00.000Z") },
  );
  trackDraftAssistCompleted(
    {
      mode: "register",
      verdict: "needs_input",
      questionCount: 2,
      hasHandoff: true,
      duplicateHintCount: 1,
      reviewTriggerCount: 3,
      missingFactCount: 2,
    },
    { storage, now: new Date("2026-04-12T09:00:05.000Z") },
  );
  trackDraftAssistHandoffAccepted(
    {
      mode: "register",
      verdict: "needs_input",
    },
    { storage, now: new Date("2026-04-12T09:00:10.000Z") },
  );

  const events = getTrackedDraftAssistEvents({ storage });
  assert.equal(events.length, 3);
  assert.equal(events[0]?.name, "draft_assist_started");
  assert.equal(events[0]?.payload.has_context, true);
  assert.equal(events[1]?.name, "draft_assist_completed");
  assert.equal(events[1]?.payload.question_count, 2);
  assert.equal(events[1]?.payload.duplicate_hint_count, 1);
  assert.equal(events[1]?.payload.review_trigger_count, 3);
  assert.equal(events[1]?.payload.missing_fact_count, 2);
  assert.equal(events[2]?.name, "draft_assist_handoff_accepted");
});

test("draft assist analytics also capture dismissals without storing any input text", () => {
  const storage = createMemoryStorage();
  clearTrackedDraftAssistEvents({ storage });

  trackDraftAssistHandoffDismissed(
    {
      mode: "guest",
      verdict: "blocked",
    },
    { storage, now: new Date("2026-04-12T09:15:00.000Z") },
  );

  const [event] = getTrackedDraftAssistEvents({ storage });
  assert.equal(event?.name, "draft_assist_handoff_dismissed");
  assert.equal(event?.payload.mode, "guest");
  assert.equal(event?.payload.verdict, "blocked");
  assert.equal("description" in (event?.payload ?? {}), false);
});
