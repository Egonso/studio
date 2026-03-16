import { z } from "zod";
import { CAPTURE_USAGE_CONTEXT_VALUES } from "@/lib/register-first/card-model";

export const COVERAGE_ASSIST_KIND = "coverage" as const;

export const COVERAGE_ASSIST_SOURCE_VALUES = ["chrome_extension"] as const;
export type CoverageAssistSource =
  (typeof COVERAGE_ASSIST_SOURCE_VALUES)[number];

export const COVERAGE_ASSIST_CONFIDENCE_VALUES = [
  "low",
  "medium",
  "high",
] as const;
export type CoverageAssistConfidence =
  (typeof COVERAGE_ASSIST_CONFIDENCE_VALUES)[number];

export const COVERAGE_ASSIST_SEED_LIBRARY_VERSION = "seed_v0_1" as const;
export type CoverageAssistSeedLibraryVersion =
  typeof COVERAGE_ASSIST_SEED_LIBRARY_VERSION;

export const COVERAGE_ASSIST_SELECTION_MODE_VALUES = [
  "seed_suggestion",
  "custom_purpose",
  "tool_only",
] as const;
export type CoverageAssistSelectionMode =
  (typeof COVERAGE_ASSIST_SELECTION_MODE_VALUES)[number];

export const coverageAssistDetectionEntrySchema = z.object({
  toolId: z.string().trim().min(1).max(100),
  toolName: z.string().trim().min(1).max(200),
  vendor: z.string().trim().min(1).max(200).optional().nullable(),
  hosts: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
  pathPrefixes: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  confidence: z.enum(COVERAGE_ASSIST_CONFIDENCE_VALUES).default("high"),
  isEnabled: z.boolean().default(true),
});

export type CoverageAssistDetectionEntry = z.infer<
  typeof coverageAssistDetectionEntrySchema
>;

export const coverageAssistSeedSuggestionSchema = z.object({
  suggestionId: z.string().trim().min(1).max(120),
  toolId: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(120),
  purposeDraft: z.string().trim().min(3).max(160),
  descriptionHint: z.string().trim().min(1).max(200).optional().nullable(),
  likelyContexts: z
    .array(z.enum(CAPTURE_USAGE_CONTEXT_VALUES))
    .max(4)
    .optional(),
  libraryVersion: z.literal(COVERAGE_ASSIST_SEED_LIBRARY_VERSION),
});

export type CoverageAssistSeedSuggestion = z.infer<
  typeof coverageAssistSeedSuggestionSchema
>;

export const captureAssistContextSchema = z.object({
  assist: z.literal(COVERAGE_ASSIST_KIND),
  source: z.enum(COVERAGE_ASSIST_SOURCE_VALUES),
  detectedToolId: z.string().trim().min(1).max(100).optional().nullable(),
  matchedHost: z.string().trim().min(1).max(200).optional().nullable(),
  matchedPath: z.string().trim().min(1).max(300).optional().nullable(),
  selectionMode: z
    .enum(COVERAGE_ASSIST_SELECTION_MODE_VALUES)
    .optional()
    .nullable(),
  seedSuggestionId: z.string().trim().min(1).max(120).optional().nullable(),
  seedSuggestionLabel: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .optional()
    .nullable(),
  libraryVersion: z
    .literal(COVERAGE_ASSIST_SEED_LIBRARY_VERSION)
    .optional()
    .nullable(),
  confidence: z.enum(COVERAGE_ASSIST_CONFIDENCE_VALUES).optional().nullable(),
});

export type CaptureAssistContext = z.infer<typeof captureAssistContextSchema>;

export function parseCoverageAssistDetectionEntries(
  input: unknown
): CoverageAssistDetectionEntry[] {
  return z.array(coverageAssistDetectionEntrySchema).parse(input);
}

export function parseCoverageAssistSeedSuggestions(
  input: unknown
): CoverageAssistSeedSuggestion[] {
  return z.array(coverageAssistSeedSuggestionSchema).parse(input);
}

export function parseCaptureAssistContext(
  input: unknown
): CaptureAssistContext | null {
  if (input == null) {
    return null;
  }

  return captureAssistContextSchema.parse(input);
}
