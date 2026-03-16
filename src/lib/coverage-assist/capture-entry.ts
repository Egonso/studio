import toolCatalogData from "@/data/tool-catalog.json";
import { toToolSlug } from "@/lib/register-first/tool-registry-types";
import { getSuggestionsForTool } from "./seed-library";
import {
  parseCoverageAssistCaptureQuery,
  type CoverageAssistCaptureQuery,
} from "./query-contract";
import type { CoverageAssistSeedSuggestion } from "./types";

interface ToolCatalogEntry {
  name: string;
  toolId?: string;
}

export interface CoverageAssistEntryState {
  query: CoverageAssistCaptureQuery;
  toolId: string;
  toolName: string;
  matchedHost: string | null;
  suggestions: CoverageAssistSeedSuggestion[];
}

interface ResolveCoverageAssistEntryOptions {
  phase1Enabled: boolean;
  seedLibraryEnabled: boolean;
}

const toolNamesById = new Map(
  (toolCatalogData as ToolCatalogEntry[]).map((entry) => [
    typeof entry.toolId === "string" && entry.toolId.trim().length > 0
      ? entry.toolId.trim()
      : toToolSlug(entry.name),
    entry.name,
  ])
);

export function resolveCoverageAssistEntryState(
  input: URLSearchParams | Record<string, string | string[] | null | undefined>,
  options: ResolveCoverageAssistEntryOptions
): CoverageAssistEntryState | null {
  if (!options.phase1Enabled) {
    return null;
  }

  let query: CoverageAssistCaptureQuery | null;
  try {
    query = parseCoverageAssistCaptureQuery(input);
  } catch {
    return null;
  }

  if (!query) {
    return null;
  }

  const toolName = toolNamesById.get(query.assistToolId);
  if (!toolName) {
    return null;
  }

  return {
    query,
    toolId: query.assistToolId,
    toolName,
    matchedHost: query.assistMatchedHost ?? null,
    suggestions: options.seedLibraryEnabled
      ? getSuggestionsForTool(query.assistToolId)
      : [],
  };
}
