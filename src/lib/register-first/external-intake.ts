import type { ExternalIntakeTrace } from "./types";

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

export function buildSupplierRequestPath(): string {
  return "/request/[signed-token]";
}

export function buildAccessCodeCapturePath(accessCode?: string | null): string {
  const code = normalizeOptionalText(accessCode);
  return code ? `/erfassen?code=${encodeURIComponent(code)}` : "/erfassen";
}

interface BuildSupplierRequestTraceInput {
  submittedAt: Date | string;
  registerId: string;
  ownerId?: string | null;
  supplierEmail?: string | null;
  submissionId?: string | null;
  requestTokenId?: string | null;
}

export function buildSupplierRequestTrace(
  input: BuildSupplierRequestTraceInput
): ExternalIntakeTrace {
  const supplierEmail = normalizeOptionalText(input.supplierEmail);
  const requestTokenId = normalizeOptionalText(input.requestTokenId);

  return {
    source: "SUPPLIER_REQUEST_LINK",
    submittedAt: normalizeTimestamp(input.submittedAt),
    registerId: input.registerId,
    ownerId: normalizeOptionalText(input.ownerId),
    submissionId: normalizeOptionalText(input.submissionId),
    sourceType: "supplier_request",
    submittedByName: supplierEmail,
    submittedByEmail: supplierEmail,
    requestPath: buildSupplierRequestPath(),
    requestTokenId,
    requestCode: null,
    accessCodeId: null,
    accessCode: null,
    accessCodeLabel: null,
  };
}

interface BuildAccessCodeTraceInput {
  submittedAt: Date | string;
  registerId: string;
  ownerId?: string | null;
  accessCode?: string | null;
  accessCodeId?: string | null;
  accessCodeLabel?: string | null;
  submissionId?: string | null;
  submittedByName?: string | null;
  submittedByRole?: string | null;
}

export function buildAccessCodeTrace(
  input: BuildAccessCodeTraceInput
): ExternalIntakeTrace {
  const accessCode = normalizeOptionalText(input.accessCode)?.toUpperCase() ?? null;

  return {
    source: "ACCESS_CODE",
    submittedAt: normalizeTimestamp(input.submittedAt),
    registerId: input.registerId,
    ownerId: normalizeOptionalText(input.ownerId),
    submissionId: normalizeOptionalText(input.submissionId),
    sourceType: "access_code",
    submittedByName: normalizeOptionalText(input.submittedByName),
    submittedByEmail: null,
    submittedByRole: normalizeOptionalText(input.submittedByRole),
    requestPath: buildAccessCodeCapturePath(accessCode),
    requestTokenId: null,
    requestCode: null,
    accessCodeId:
      normalizeOptionalText(input.accessCodeId) ??
      normalizeOptionalText(input.accessCode)?.toUpperCase() ??
      null,
    accessCode,
    accessCodeLabel: normalizeOptionalText(input.accessCodeLabel),
  };
}

export function formatExternalIntakeTrace(trace: ExternalIntakeTrace): string {
  const actor =
    normalizeOptionalText(trace.submittedByName) ??
    normalizeOptionalText(trace.submittedByEmail) ??
    normalizeOptionalText(trace.submittedByRole) ??
    "unbekannt";

  if (trace.source === "SUPPLIER_REQUEST_LINK") {
    const requestTokenId = normalizeOptionalText(trace.requestTokenId);
    const path = normalizeOptionalText(trace.requestPath);
    const via = requestTokenId
      ? `Lieferanten-Link (Token ${requestTokenId})`
      : "Lieferanten-Link";
    return path ? `${actor} via ${via} (${path})` : `${actor} via ${via}`;
  }

  const label = normalizeOptionalText(trace.accessCodeLabel);
  const code = normalizeOptionalText(trace.accessCode);
  const viaParts = ["Erfassungslink"];
  if (label) viaParts.push(`"${label}"`);
  if (code) viaParts.push(`Code ${code}`);
  return `${actor} via ${viaParts.join(" ")}`;
}
