import detectionData from "@/data/coverage-assist-detection.json";
import {
  parseCoverageAssistDetectionEntries,
  type CoverageAssistDetectionEntry,
} from "./types";

export interface CoverageAssistHostInput {
  host?: string | null;
  pathname?: string | null;
}

export interface CoverageAssistDetectionMatch {
  entry: CoverageAssistDetectionEntry;
  matchedHost: string;
  matchedPathPrefix: string | null;
}

const parsedDetectionEntries = Object.freeze(
  parseCoverageAssistDetectionEntries(detectionData)
);

export function getCoverageAssistDetectionEntries(): readonly CoverageAssistDetectionEntry[] {
  return parsedDetectionEntries;
}

export function normalizeCoverageAssistHost(
  host: string | null | undefined
): string | null {
  if (typeof host !== "string") {
    return null;
  }

  const normalized = host.trim().toLowerCase().replace(/\.+$/, "");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeCoverageAssistPath(
  pathname: string | null | undefined
): string {
  if (typeof pathname !== "string") {
    return "/";
  }

  const trimmed = pathname.trim();
  if (trimmed.length === 0) {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function hostMatchesCoverageAssistEntry(
  host: string,
  candidateHost: string
): boolean {
  const normalizedHost = normalizeCoverageAssistHost(host);
  const normalizedCandidate = normalizeCoverageAssistHost(candidateHost);

  if (!normalizedHost || !normalizedCandidate) {
    return false;
  }

  return (
    normalizedHost === normalizedCandidate ||
    normalizedHost.endsWith(`.${normalizedCandidate}`)
  );
}

export function findCoverageAssistDetectionMatch(
  input: CoverageAssistHostInput,
  entries: readonly CoverageAssistDetectionEntry[] = parsedDetectionEntries
): CoverageAssistDetectionMatch | null {
  const host = normalizeCoverageAssistHost(input.host);
  if (!host) {
    return null;
  }

  const pathname = normalizeCoverageAssistPath(input.pathname);

  for (const entry of entries) {
    if (!entry.isEnabled) {
      continue;
    }

    const matchedHost = entry.hosts.find((candidate) =>
      hostMatchesCoverageAssistEntry(host, candidate)
    );

    if (!matchedHost) {
      continue;
    }

    const matchedPathPrefix = entry.pathPrefixes?.find((prefix) =>
      pathname.startsWith(normalizeCoverageAssistPath(prefix))
    );

    if (entry.pathPrefixes && entry.pathPrefixes.length > 0 && !matchedPathPrefix) {
      continue;
    }

    return {
      entry,
      matchedHost,
      matchedPathPrefix: matchedPathPrefix ?? null,
    };
  }

  return null;
}
