export type CaptureEntryMode = "coverage_assist" | "draft_assist" | "direct";

export type ResolveCaptureEntryModeInput = {
  hasCoverageAssistEntry: boolean;
  draftAssistEnabled: boolean;
  draftAssistRequested: boolean;
};

/**
 * Keeps the minimum direct form as the default while preserving explicit
 * assisted entry points. Coverage Assist takes precedence because it carries
 * scoped source context from an existing integration.
 */
export function resolveCaptureEntryMode({
  hasCoverageAssistEntry,
  draftAssistEnabled,
  draftAssistRequested,
}: ResolveCaptureEntryModeInput): CaptureEntryMode {
  if (hasCoverageAssistEntry) {
    return "coverage_assist";
  }

  if (draftAssistEnabled && draftAssistRequested) {
    return "draft_assist";
  }

  return "direct";
}
