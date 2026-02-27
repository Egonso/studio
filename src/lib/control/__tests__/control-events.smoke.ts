import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  clearTrackedControlEvents,
  getTrackedControlEvents,
  syncMaturityLevel,
  syncRecommendationProgress,
  trackControlConversion,
  trackControlOpened,
  trackTriggerClicked,
  trackTriggerShown,
  type ControlAnalyticsStorage,
} from "@/lib/analytics/control-events";

function createMemoryStorage(): ControlAnalyticsStorage {
  const map = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
  };
}

export function runControlEventsSmoke() {
  const storage = createMemoryStorage();
  const baseTime = new Date("2026-02-27T12:00:00.000Z");

  clearTrackedControlEvents({ storage });

  trackTriggerShown(
    {
      triggerIds: ["use_cases_over_ten", "review_overdue"],
      triggerCount: 2,
      source: "register_overview",
      useCaseCount: 12,
    },
    { storage, now: baseTime }
  );

  trackTriggerClicked(
    {
      triggerIds: ["use_cases_over_ten", "review_overdue"],
      triggerCount: 2,
      source: "register_overview",
      useCaseCount: 12,
    },
    { storage, now: new Date("2026-02-27T12:00:05.000Z") }
  );

  trackControlOpened(
    {
      route: "control_overview",
      entry: "trigger",
    },
    { storage, now: new Date("2026-02-27T12:00:10.000Z") }
  );

  trackControlConversion(
    {
      source: "register_trigger",
      triggerIds: ["use_cases_over_ten", "review_overdue"],
    },
    { storage, now: new Date("2026-02-27T12:00:12.000Z") }
  );

  syncRecommendationProgress(["rec_a", "rec_b"], { route: "control_overview" }, {
    storage,
    now: new Date("2026-02-27T12:00:20.000Z"),
  });

  syncRecommendationProgress(["rec_b"], { route: "control_overview" }, {
    storage,
    now: new Date("2026-02-27T12:05:20.000Z"),
  });

  syncMaturityLevel(2, { route: "control_overview" }, {
    storage,
    now: new Date("2026-02-27T12:06:00.000Z"),
  });
  syncMaturityLevel(3, { route: "control_overview" }, {
    storage,
    now: new Date("2026-02-27T12:10:00.000Z"),
  });

  const events = getTrackedControlEvents({ storage });
  const names = events.map((event) => event.name);

  assert.ok(names.includes("trigger_shown"));
  assert.ok(names.includes("trigger_clicked"));
  assert.ok(names.includes("control_opened"));
  assert.ok(names.includes("control_conversion"));
  assert.ok(names.includes("recommendation_completed"));
  assert.ok(names.includes("maturity_level_changed"));

  const completionEvent = events.find((event) => event.name === "recommendation_completed");
  assert.ok(completionEvent);
  assert.equal(completionEvent?.payload.resolved_count, 1);

  console.log("Control analytics events smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runControlEventsSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
