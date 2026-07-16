import assert from "node:assert/strict";
import test from "node:test";

import { resolveCaptureEntryMode } from "./capture-entry-mode";

test("direct capture remains the default when draft assist is available", () => {
  assert.equal(
    resolveCaptureEntryMode({
      hasCoverageAssistEntry: false,
      draftAssistEnabled: true,
      draftAssistRequested: false,
    }),
    "direct",
  );
});

test("draft assist opens only after an explicit request", () => {
  assert.equal(
    resolveCaptureEntryMode({
      hasCoverageAssistEntry: false,
      draftAssistEnabled: true,
      draftAssistRequested: true,
    }),
    "draft_assist",
  );
});

test("a disabled draft assist flag falls back to direct capture", () => {
  assert.equal(
    resolveCaptureEntryMode({
      hasCoverageAssistEntry: false,
      draftAssistEnabled: false,
      draftAssistRequested: true,
    }),
    "direct",
  );
});

test("coverage assist keeps precedence when source context is present", () => {
  assert.equal(
    resolveCaptureEntryMode({
      hasCoverageAssistEntry: true,
      draftAssistEnabled: true,
      draftAssistRequested: true,
    }),
    "coverage_assist",
  );
});
