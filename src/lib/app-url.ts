const DEFAULT_APP_ORIGIN = "https://kiregister.com";

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getPublicAppOrigin(): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_BASE_URL) ??
    DEFAULT_APP_ORIGIN
  );
}

export function buildPublicAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${getPublicAppOrigin()}/`).toString();
}

export function buildSupplierRequestUrl(
  registerId: string,
  ownerId?: string | null
): string {
  const url = new URL(
    `/request/${encodeURIComponent(registerId)}`,
    `${getPublicAppOrigin()}/`
  );

  if (ownerId && ownerId.trim().length > 0) {
    url.searchParams.set("owner", ownerId.trim());
  }

  return url.toString();
}
