import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCoverageAssistCaptureQuery,
  createCoverageAssistContextFromQuery,
  parseCoverageAssistCaptureQuery,
} from "./query-contract";

test("coverage assist query contract round-trips through URLSearchParams", () => {
  const params = buildCoverageAssistCaptureQuery({
    assist: "coverage",
    assistSource: "chrome_extension",
    assistToolId: "chatgpt_openai",
    assistMatchedHost: "chat.openai.com",
    assistSeedSuggestionId: "chatgpt_openai_text_drafting",
  });

  const parsed = parseCoverageAssistCaptureQuery(params);

  assert.ok(parsed);
  assert.equal(parsed.assistSource, "chrome_extension");
  assert.equal(parsed.assistToolId, "chatgpt_openai");
  assert.equal(parsed.assistMatchedHost, "chat.openai.com");
});

test("coverage assist query contract ignores non-coverage capture links", () => {
  const parsed = parseCoverageAssistCaptureQuery(
    new URLSearchParams({
      source: "chrome-extension",
      toolId: "chatgpt_openai",
    })
  );

  assert.equal(parsed, null);
});

test("coverage assist context is derived as additive metadata", () => {
  const context = createCoverageAssistContextFromQuery(
    {
      assist: "coverage",
      assistSource: "chrome_extension",
      assistToolId: "chatgpt_openai",
      assistMatchedHost: "chat.openai.com",
      assistMatchedPath: "/",
      assistSeedSuggestionId: "chatgpt_openai_text_drafting",
    },
    {
      confidence: "high",
      selectionMode: "seed_suggestion",
      seedSuggestionLabel: "Texte entwerfen",
      libraryVersion: "seed_v0_1",
    }
  );

  assert.deepEqual(context, {
    assist: "coverage",
    source: "chrome_extension",
    detectedToolId: "chatgpt_openai",
    matchedHost: "chat.openai.com",
    matchedPath: "/",
    selectionMode: "seed_suggestion",
    seedSuggestionId: "chatgpt_openai_text_drafting",
    seedSuggestionLabel: "Texte entwerfen",
    libraryVersion: "seed_v0_1",
    confidence: "high",
  });
});
