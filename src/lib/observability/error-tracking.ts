import { logError } from './logger';

export interface ErrorTrackingContext {
  boundary?: 'app' | 'global' | 'process' | 'server-action';
  component?: string;
  route?: string;
  tags?: Record<string, string | undefined>;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    message: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

function getBrowserErrorTracker():
  | { captureException(error: unknown, context?: ErrorTrackingContext): void }
  | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (
    window as typeof window & {
      __APP_ERROR_TRACKER__?: {
        captureException(error: unknown, context?: ErrorTrackingContext): void;
      };
    }
  ).__APP_ERROR_TRACKER__;
}

function getServerErrorTracker():
  | { captureException(error: unknown, context?: ErrorTrackingContext): void }
  | undefined {
  return (
    globalThis as typeof globalThis & {
      __APP_ERROR_TRACKER__?: {
        captureException(error: unknown, context?: ErrorTrackingContext): void;
      };
    }
  ).__APP_ERROR_TRACKER__;
}

export function captureException(
  error: unknown,
  context: ErrorTrackingContext = {},
): void {
  logError('application_error', {
    boundary: context.boundary ?? 'app',
    component: context.component,
    route: context.route,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error',
    ...context.tags,
  });

  const tracker =
    typeof window === 'undefined'
      ? getServerErrorTracker()
      : getBrowserErrorTracker();
  tracker?.captureException(error, context);
}

export function createErrorTrackingPayload(
  error: unknown,
  context: ErrorTrackingContext = {},
): Record<string, unknown> {
  return {
    context,
    error: serializeError(error),
    capturedAt: new Date().toISOString(),
  };
}
