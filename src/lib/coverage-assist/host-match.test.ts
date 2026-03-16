import assert from "node:assert/strict";
import test from "node:test";
import {
  findCoverageAssistDetectionMatch,
  getCoverageAssistDetectionEntries,
  hostMatchesCoverageAssistEntry,
  normalizeCoverageAssistHost,
  normalizeCoverageAssistPath,
} from "./host-match";

test("coverage assist detection entries load from the curated json map", () => {
  const entries = getCoverageAssistDetectionEntries();
  assert.equal(entries.length >= 6, true);
  assert.equal(entries.some((entry) => entry.toolId === "chatgpt_openai"), true);
});

test("coverage assist host matching normalizes hosts safely", () => {
  assert.equal(normalizeCoverageAssistHost(" Chat.OpenAI.com. "), "chat.openai.com");
  assert.equal(normalizeCoverageAssistHost(""), null);
  assert.equal(hostMatchesCoverageAssistEntry("chat.openai.com", "openai.com"), true);
  assert.equal(hostMatchesCoverageAssistEntry("evilopenai.com", "openai.com"), false);
});

test("coverage assist path normalization stays slash-safe", () => {
  assert.equal(normalizeCoverageAssistPath(""), "/");
  assert.equal(normalizeCoverageAssistPath("workspace"), "/workspace");
  assert.equal(normalizeCoverageAssistPath("/workspace"), "/workspace");
});

test("coverage assist host match finds a known tool by host", () => {
  const match = findCoverageAssistDetectionMatch({
    host: "chat.openai.com",
    pathname: "/",
  });

  assert.ok(match);
  assert.equal(match.entry.toolId, "chatgpt_openai");
  assert.equal(match.matchedHost, "chat.openai.com");
});

test("coverage assist host match rejects unknown tools", () => {
  const match = findCoverageAssistDetectionMatch({
    host: "example.org",
    pathname: "/",
  });

  assert.equal(match, null);
});
