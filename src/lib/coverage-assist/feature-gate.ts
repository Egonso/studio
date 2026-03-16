import {
  registerFirstFlags,
  type RegisterFirstFeatureFlags,
} from "@/lib/register-first/flags";

export type CoverageAssistFlagSnapshot = Pick<
  RegisterFirstFeatureFlags,
  "coverageAssistPhase1" | "coverageAssistExtension" | "coverageAssistSeedLibrary"
>;

export interface PublicCoverageAssistConfig extends CoverageAssistFlagSnapshot {
  rolloutEnabled: boolean;
}

export function isCoverageAssistPilotEnabled(
  flags: CoverageAssistFlagSnapshot
): boolean {
  return Boolean(
    flags.coverageAssistPhase1 &&
      flags.coverageAssistExtension &&
      flags.coverageAssistSeedLibrary
  );
}

export function getPublicCoverageAssistConfig(
  flags: CoverageAssistFlagSnapshot = registerFirstFlags
): PublicCoverageAssistConfig {
  return {
    coverageAssistPhase1: flags.coverageAssistPhase1 === true,
    coverageAssistExtension: flags.coverageAssistExtension === true,
    coverageAssistSeedLibrary: flags.coverageAssistSeedLibrary === true,
    rolloutEnabled: isCoverageAssistPilotEnabled(flags),
  };
}
