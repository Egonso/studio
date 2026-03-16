import { z } from "zod";
import {
  COVERAGE_ASSIST_KIND,
  COVERAGE_ASSIST_SOURCE_VALUES,
  type CaptureAssistContext,
  type CoverageAssistSeedLibraryVersion,
  type CoverageAssistSelectionMode,
} from "./types";

export const COVERAGE_ASSIST_CAPTURE_QUERY_KEYS = Object.freeze({
  assist: "assist",
  source: "assistSource",
  toolId: "assistToolId",
  matchedHost: "assistMatchedHost",
  matchedPath: "assistMatchedPath",
  seedSuggestionId: "assistSeedSuggestionId",
});

export const coverageAssistCaptureQuerySchema = z.object({
  assist: z.literal(COVERAGE_ASSIST_KIND),
  assistSource: z.enum(COVERAGE_ASSIST_SOURCE_VALUES),
  assistToolId: z.string().trim().min(1).max(100),
  assistMatchedHost: z.string().trim().min(1).max(200).optional(),
  assistMatchedPath: z.string().trim().min(1).max(300).optional(),
  assistSeedSuggestionId: z.string().trim().min(1).max(120).optional(),
});

export type CoverageAssistCaptureQuery = z.infer<
  typeof coverageAssistCaptureQuerySchema
>;

type QueryInput =
  | URLSearchParams
  | Record<string, string | string[] | null | undefined>;

function readQueryValue(input: QueryInput, key: string): string | undefined {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const rawValue = input[key];
  if (typeof rawValue === "string") {
    return rawValue;
  }

  if (Array.isArray(rawValue)) {
    return rawValue.find((value) => typeof value === "string");
  }

  return undefined;
}

export function parseCoverageAssistCaptureQuery(
  input: QueryInput
): CoverageAssistCaptureQuery | null {
  const assistValue = readQueryValue(
    input,
    COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.assist
  );

  if (assistValue !== COVERAGE_ASSIST_KIND) {
    return null;
  }

  return coverageAssistCaptureQuerySchema.parse({
    assist: assistValue,
    assistSource: readQueryValue(
      input,
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.source
    ),
    assistToolId: readQueryValue(
      input,
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.toolId
    ),
    assistMatchedHost: readQueryValue(
      input,
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.matchedHost
    ),
    assistMatchedPath: readQueryValue(
      input,
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.matchedPath
    ),
    assistSeedSuggestionId: readQueryValue(
      input,
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.seedSuggestionId
    ),
  });
}

export function buildCoverageAssistCaptureQuery(
  input: CoverageAssistCaptureQuery
): URLSearchParams {
  const parsed = coverageAssistCaptureQuerySchema.parse(input);
  const params = new URLSearchParams();

  params.set(COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.assist, parsed.assist);
  params.set(COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.source, parsed.assistSource);
  params.set(COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.toolId, parsed.assistToolId);

  if (parsed.assistMatchedHost) {
    params.set(
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.matchedHost,
      parsed.assistMatchedHost
    );
  }

  if (parsed.assistMatchedPath) {
    params.set(
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.matchedPath,
      parsed.assistMatchedPath
    );
  }

  if (parsed.assistSeedSuggestionId) {
    params.set(
      COVERAGE_ASSIST_CAPTURE_QUERY_KEYS.seedSuggestionId,
      parsed.assistSeedSuggestionId
    );
  }

  return params;
}

export function createCoverageAssistContextFromQuery(
  query: CoverageAssistCaptureQuery,
  options: {
    confidence?: CaptureAssistContext["confidence"];
    selectionMode?: CoverageAssistSelectionMode | null;
    seedSuggestionId?: string | null;
    seedSuggestionLabel?: string | null;
    libraryVersion?: CoverageAssistSeedLibraryVersion | null;
  } = {}
): CaptureAssistContext {
  return {
    assist: COVERAGE_ASSIST_KIND,
    source: query.assistSource,
    detectedToolId: query.assistToolId,
    matchedHost: query.assistMatchedHost ?? null,
    matchedPath: query.assistMatchedPath ?? null,
    selectionMode: options.selectionMode ?? null,
    seedSuggestionId:
      options.seedSuggestionId ?? query.assistSeedSuggestionId ?? null,
    seedSuggestionLabel: options.seedSuggestionLabel ?? null,
    libraryVersion: options.libraryVersion ?? null,
    confidence: options.confidence ?? null,
  };
}
