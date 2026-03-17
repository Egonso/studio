export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type Primitive = string | number | boolean | null;
type StructuredValue =
  | Primitive
  | Primitive[]
  | Record<string, Primitive | Primitive[] | undefined>;

export interface LogContext {
  [key: string]: StructuredValue | undefined;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|secret|token|password|api[_-]?key|private[_-]?key/i;

function sanitizeStringValue(value: string): string {
  if (/^bearer\s+/i.test(value)) {
    return '[REDACTED]';
  }

  if (value.length > 80 && /[A-Za-z0-9_-]{24,}/.test(value)) {
    return '[REDACTED]';
  }

  return value;
}

function sanitizeContextValue(
  value: unknown,
  key?: string,
): StructuredValue | undefined {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }

  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeStringValue(value);
  }

  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Primitive =>
        entry === null ||
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean',
    ).map((entry) =>
      typeof entry === 'string' ? sanitizeStringValue(entry) : entry,
    );
  }

  if (typeof value === 'object') {
    const normalized = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeContextValue(entry, key),
      ]),
    ) as Record<string, Primitive | Primitive[] | undefined>;
    return normalized;
  }

  return undefined;
}

function toLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
): LogEntry {
  const normalizedContext =
    context && Object.keys(context).length > 0
      ? Object.fromEntries(
          Object.entries(context).map(([key, value]) => [
            key,
            sanitizeContextValue(value, key),
          ]),
        )
      : undefined;

  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: normalizedContext,
  };
}

function emit(entry: LogEntry): void {
  const serialized = JSON.stringify(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'error':
      console.error(serialized);
      break;
    default:
      console.info(serialized);
  }
}

export function logDebug(message: string, context?: LogContext): void {
  emit(toLogEntry('debug', message, context));
}

export function logInfo(message: string, context?: LogContext): void {
  emit(toLogEntry('info', message, context));
}

export function logWarn(message: string, context?: LogContext): void {
  emit(toLogEntry('warn', message, context));
}

export function logError(message: string, context?: LogContext): void {
  emit(toLogEntry('error', message, context));
}
