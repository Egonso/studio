import assert from "node:assert/strict";
import test from "node:test";
import toolCatalogData from "@/data/tool-catalog.json";
import { toToolSlug } from "@/lib/register-first/tool-registry-types";
import {
  getCoverageAssistSeedSuggestions,
  getCoverageAssistSeedToolIds,
  getSuggestionsForTool,
  hasSuggestionsForTool,
} from "./seed-library";

interface ToolCatalogEntry {
  name: string;
  toolId?: string;
}

function toCatalogToolId(entry: ToolCatalogEntry): string {
  if (typeof entry.toolId === "string" && entry.toolId.trim().length > 0) {
    return entry.toolId.trim();
  }

  return toToolSlug(entry.name);
}

test("coverage assist seed library keeps exactly 80 unique suggestions", () => {
  const suggestions = getCoverageAssistSeedSuggestions();
  const suggestionIds = new Set(suggestions.map((suggestion) => suggestion.suggestionId));

  assert.equal(suggestions.length, 80);
  assert.equal(suggestionIds.size, 80);
});

test("coverage assist seed library references only known catalog tools", () => {
  const catalogToolIds = new Set(
    (toolCatalogData as ToolCatalogEntry[]).map((entry) => toCatalogToolId(entry))
  );

  const suggestions = getCoverageAssistSeedSuggestions();

  assert.equal(
    suggestions.every((suggestion) => catalogToolIds.has(suggestion.toolId)),
    true
  );
});

test("coverage assist seed library exposes 20 tools with exactly four suggestions each", () => {
  const toolIds = getCoverageAssistSeedToolIds();

  assert.equal(toolIds.length, 20);

  for (const toolId of toolIds) {
    assert.equal(hasSuggestionsForTool(toolId), true);
    assert.equal(getSuggestionsForTool(toolId).length, 4);
  }
});

test("coverage assist seed library returns an empty list for unknown tools", () => {
  assert.deepEqual(getSuggestionsForTool("unknown_tool"), []);
  assert.equal(hasSuggestionsForTool("unknown_tool"), false);
});
