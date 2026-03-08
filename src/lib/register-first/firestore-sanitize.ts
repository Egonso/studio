type JsonLike =
  | null
  | string
  | number
  | boolean
  | JsonLike[]
  | { [key: string]: JsonLike };

function sanitizeInternal(value: unknown): JsonLike | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeInternal(entry))
      .filter((entry): entry is JsonLike => entry !== undefined);
  }

  if (typeof value === "object") {
    const sanitized: Record<string, JsonLike> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const next = sanitizeInternal(entry);
      if (next !== undefined) {
        sanitized[key] = next;
      }
    }
    return sanitized;
  }

  return undefined;
}

export function sanitizeFirestorePayload<T>(value: T): T {
  return (sanitizeInternal(value) ?? {}) as T;
}
