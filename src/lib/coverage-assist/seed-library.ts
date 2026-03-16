import seedLibraryData from "@/data/coverage-assist-seed-library.json";
import toolCatalogData from "@/data/tool-catalog.json";
import { toToolSlug } from "@/lib/register-first/tool-registry-types";
import {
  parseCoverageAssistSeedSuggestions,
  type CoverageAssistSeedSuggestion,
} from "./types";

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

function findDuplicateSuggestionIds(
  suggestions: readonly CoverageAssistSeedSuggestion[]
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const suggestion of suggestions) {
    if (seen.has(suggestion.suggestionId)) {
      duplicates.add(suggestion.suggestionId);
      continue;
    }

    seen.add(suggestion.suggestionId);
  }

  return [...duplicates].sort();
}

function cloneSuggestion(
  suggestion: CoverageAssistSeedSuggestion
): CoverageAssistSeedSuggestion {
  return {
    ...suggestion,
    likelyContexts: suggestion.likelyContexts
      ? [...suggestion.likelyContexts]
      : undefined,
  };
}

const parsedSuggestions = Object.freeze(
  parseCoverageAssistSeedSuggestions(seedLibraryData)
);

const catalogToolIds = new Set(
  (toolCatalogData as ToolCatalogEntry[]).map((entry) => toCatalogToolId(entry))
);

const duplicateSuggestionIds = findDuplicateSuggestionIds(parsedSuggestions);
if (duplicateSuggestionIds.length > 0) {
  throw new Error(
    `Coverage Assist seed library contains duplicate suggestionIds: ${duplicateSuggestionIds.join(", ")}`
  );
}

if (parsedSuggestions.length !== 80) {
  throw new Error(
    `Coverage Assist seed library must contain exactly 80 suggestions. Received ${parsedSuggestions.length}.`
  );
}

const invalidToolIds = [
  ...new Set(
    parsedSuggestions
      .map((suggestion) => suggestion.toolId)
      .filter((toolId) => !catalogToolIds.has(toolId))
  ),
].sort();

if (invalidToolIds.length > 0) {
  throw new Error(
    `Coverage Assist seed library references unknown toolIds: ${invalidToolIds.join(", ")}`
  );
}

const suggestionsByToolId = new Map<string, CoverageAssistSeedSuggestion[]>();
for (const suggestion of parsedSuggestions) {
  const bucket = suggestionsByToolId.get(suggestion.toolId) ?? [];
  bucket.push(suggestion);
  suggestionsByToolId.set(suggestion.toolId, bucket);
}

for (const [toolId, suggestions] of suggestionsByToolId.entries()) {
  if (suggestions.length !== 4) {
    throw new Error(
      `Coverage Assist seed library must provide exactly 4 suggestions per tool. ${toolId} has ${suggestions.length}.`
    );
  }
}

export function getCoverageAssistSeedSuggestions(): CoverageAssistSeedSuggestion[] {
  return parsedSuggestions.map(cloneSuggestion);
}

export function getCoverageAssistSeedToolIds(): string[] {
  return [...suggestionsByToolId.keys()].sort();
}

export function getSuggestionsForTool(
  toolId: string
): CoverageAssistSeedSuggestion[] {
  return (suggestionsByToolId.get(toolId) ?? []).map(cloneSuggestion);
}

export function hasSuggestionsForTool(toolId: string): boolean {
  return suggestionsByToolId.has(toolId);
}
