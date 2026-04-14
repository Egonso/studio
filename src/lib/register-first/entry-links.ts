import type { RegisterFirstFeatureFlags } from "./flags";

function appendProjectQuery(basePath: string, projectId?: string | null): string {
  if (!projectId) {
    return basePath;
  }
  return `${basePath}?projectId=${encodeURIComponent(projectId)}`;
}

export function buildRegisterHref(projectId?: string | null): string {
  return appendProjectQuery("/my-register", projectId);
}

export function buildCaptureHref(projectId?: string | null): string {
  return appendProjectQuery("/capture", projectId);
}

export function buildVerifyPassHref(publicHashId: string): string {
  return `/verify/pass/${encodeURIComponent(publicHashId)}`;
}

export function buildVerifyPassAbsoluteUrl(
  publicHashId: string,
  baseUrl?: string
): string {
  const base =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : "https://airegist.com");
  return `${base}/verify/pass/${encodeURIComponent(publicHashId)}`;
}

export function buildStandaloneCaptureHref(): string {
  return "/capture";
}

export function buildMyRegisterHref(): string {
  return "/my-register";
}

export function isHybridEntryEnabled(flags: RegisterFirstFeatureFlags): boolean {
  return flags.enabled && flags.hybridEntry;
}
