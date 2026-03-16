import assert from "node:assert/strict";
import test from "node:test";
import detectionData from "@/data/coverage-assist-detection.json";
import seedLibraryData from "@/data/coverage-assist-seed-library.json";
import {
  parseCaptureAssistContext,
  parseCoverageAssistDetectionEntries,
  parseCoverageAssistSeedSuggestions,
} from "./types";

test("coverage assist detection data stays schema-valid", () => {
  const entries = parseCoverageAssistDetectionEntries(detectionData);

  assert.equal(entries.length >= 6, true);
  assert.equal(entries.every((entry) => entry.hosts.length > 0), true);
});

test("coverage assist seed library stays schema-valid", () => {
  const suggestions = parseCoverageAssistSeedSuggestions(seedLibraryData);

  assert.equal(suggestions.length, 80);
  assert.equal(
    suggestions.every(
      (suggestion) =>
        suggestion.label.length >= 1 &&
        suggestion.purposeDraft.length >= 3 &&
        suggestion.libraryVersion === "seed_v0_1"
    ),
    true
  );
});

test("coverage assist context accepts additive selection metadata", () => {
  const parsed = parseCaptureAssistContext({
    assist: "coverage",
    source: "chrome_extension",
    detectedToolId: "chatgpt_openai",
    matchedHost: "chat.openai.com",
    selectionMode: "seed_suggestion",
    seedSuggestionId: "chatgpt_openai_email_drafting",
    libraryVersion: "seed_v0_1",
    confidence: "high",
  });

  assert.deepEqual(parsed, {
    assist: "coverage",
    source: "chrome_extension",
    detectedToolId: "chatgpt_openai",
    matchedHost: "chat.openai.com",
    selectionMode: "seed_suggestion",
    seedSuggestionId: "chatgpt_openai_email_drafting",
    libraryVersion: "seed_v0_1",
    confidence: "high",
  });
});
