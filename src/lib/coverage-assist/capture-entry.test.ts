import assert from "node:assert/strict";
import test from "node:test";
import { buildCoverageAssistCaptureQuery } from "./query-contract";
import { resolveCoverageAssistEntryState } from "./capture-entry";

test("coverage assist entry resolves a known tool with four seed suggestions", () => {
  const params = buildCoverageAssistCaptureQuery({
    assist: "coverage",
    assistSource: "chrome_extension",
    assistToolId: "chatgpt_openai",
    assistMatchedHost: "chat.openai.com",
  });

  const state = resolveCoverageAssistEntryState(params, {
    phase1Enabled: true,
    seedLibraryEnabled: true,
  });

  assert.ok(state);
  assert.equal(state.toolId, "chatgpt_openai");
  assert.equal(state.toolName, "ChatGPT (OpenAI)");
  assert.equal(state.matchedHost, "chat.openai.com");
  assert.equal(state.suggestions.length, 4);
});

test("coverage assist entry falls back when the phase 1 flag is off", () => {
  const params = buildCoverageAssistCaptureQuery({
    assist: "coverage",
    assistSource: "chrome_extension",
    assistToolId: "chatgpt_openai",
  });

  const state = resolveCoverageAssistEntryState(params, {
    phase1Enabled: false,
    seedLibraryEnabled: true,
  });

  assert.equal(state, null);
});

test("coverage assist entry falls back for unknown tools", () => {
  const params = buildCoverageAssistCaptureQuery({
    assist: "coverage",
    assistSource: "chrome_extension",
    assistToolId: "unknown_tool",
  });

  const state = resolveCoverageAssistEntryState(params, {
    phase1Enabled: true,
    seedLibraryEnabled: true,
  });

  assert.equal(state, null);
});

test("coverage assist entry supports tool-only fallback when the seed library is disabled", () => {
  const params = buildCoverageAssistCaptureQuery({
    assist: "coverage",
    assistSource: "chrome_extension",
    assistToolId: "chatgpt_openai",
  });

  const state = resolveCoverageAssistEntryState(params, {
    phase1Enabled: true,
    seedLibraryEnabled: false,
  });

  assert.ok(state);
  assert.equal(state.suggestions.length, 0);
});

test("coverage assist entry ignores malformed assist queries", () => {
  const params = new URLSearchParams({
    assist: "coverage",
    assistSource: "chrome_extension",
  });

  const state = resolveCoverageAssistEntryState(params, {
    phase1Enabled: true,
    seedLibraryEnabled: true,
  });

  assert.equal(state, null);
});
