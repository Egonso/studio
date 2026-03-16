import assert from "node:assert/strict";
import test from "node:test";
import {
  clearTrackedCoverageAssistEvents,
  getTrackedCoverageAssistEvents,
  trackCoverageAssistCustomPurposeUsed,
  trackCoverageAssistDismissed,
  trackCoverageAssistDisabled,
  trackCoverageAssistEntryShown,
  trackCoverageAssistSaved,
  trackCoverageAssistSuggestionSelected,
  trackCoverageAssistSignalShown,
  type CoverageAssistAnalyticsStorage,
} from "./coverage-assist-events";

function createMemoryStorage(): CoverageAssistAnalyticsStorage {
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

test("coverage assist analytics track and reset events locally", () => {
  const storage = createMemoryStorage();
  clearTrackedCoverageAssistEvents({ storage });

  trackCoverageAssistEntryShown(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      matchedHost: "chat.openai.com",
      suggestionCount: 4,
    },
    { storage, now: new Date("2026-03-16T10:00:00.000Z") }
  );
  trackCoverageAssistSuggestionSelected(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      seedSuggestionId: "chatgpt_openai_text_drafting",
      libraryVersion: "seed_v0_1",
    },
    { storage, now: new Date("2026-03-16T10:01:00.000Z") }
  );
  trackCoverageAssistSaved(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      selectionMode: "seed_suggestion",
      seedSuggestionId: "chatgpt_openai_text_drafting",
      libraryVersion: "seed_v0_1",
    },
    { storage, now: new Date("2026-03-16T10:02:00.000Z") }
  );

  const events = getTrackedCoverageAssistEvents({ storage });
  assert.equal(events.length, 3);
  assert.equal(events[0]?.name, "assist_entry_shown");
  assert.equal(events[0]?.payload.suggestion_count, 4);
  assert.equal(events[2]?.name, "assist_saved");
  assert.equal(events[2]?.payload.seed_suggestion_id, "chatgpt_openai_text_drafting");
  assert.equal(events[2]?.payload.selection_mode, "seed_suggestion");

  clearTrackedCoverageAssistEvents({ storage });
  assert.deepEqual(getTrackedCoverageAssistEvents({ storage }), []);
});

test("coverage assist saved event also supports custom captures without seed id", () => {
  const storage = createMemoryStorage();
  clearTrackedCoverageAssistEvents({ storage });

  trackCoverageAssistSaved(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      selectionMode: "custom_purpose",
    },
    { storage, now: new Date("2026-03-16T11:00:00.000Z") }
  );

  const events = getTrackedCoverageAssistEvents({ storage });
  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "assist_saved");
  assert.equal(events[0]?.payload.seed_suggestion_id, null);
  assert.equal(events[0]?.payload.selection_mode, "custom_purpose");
});

test("coverage assist analytics dedupe identical signal events", () => {
  const storage = createMemoryStorage();
  clearTrackedCoverageAssistEvents({ storage });

  const first = trackCoverageAssistSignalShown(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      matchedHost: "chat.openai.com",
    },
    { storage, now: new Date("2026-03-16T10:00:00.000Z") }
  );
  const second = trackCoverageAssistSignalShown(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      matchedHost: "chat.openai.com",
    },
    { storage, now: new Date("2026-03-16T10:05:00.000Z") }
  );
  const third = trackCoverageAssistDismissed(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
      matchedHost: "chat.openai.com",
    },
    { storage, now: new Date("2026-03-16T10:06:00.000Z") }
  );

  assert.ok(first);
  assert.equal(second, null);
  assert.ok(third);
  assert.equal(getTrackedCoverageAssistEvents({ storage }).length, 2);
});

test("coverage assist analytics track custom purpose and disabled events", () => {
  const storage = createMemoryStorage();
  clearTrackedCoverageAssistEvents({ storage });

  trackCoverageAssistCustomPurposeUsed(
    {
      source: "chrome_extension",
      toolId: "chatgpt_openai",
    },
    { storage, now: new Date("2026-03-16T12:00:00.000Z") }
  );

  trackCoverageAssistDisabled(
    {
      source: "chrome_extension",
      location: "extension_popup",
    },
    { storage, now: new Date("2026-03-16T12:01:00.000Z") }
  );

  const events = getTrackedCoverageAssistEvents({ storage });
  assert.equal(events.length, 2);
  assert.equal(events[0]?.name, "assist_custom_purpose_used");
  assert.equal(events[1]?.name, "assist_disabled");
  assert.equal(events[1]?.payload.location, "extension_popup");
});
