import { captureException } from '@/lib/observability/error-tracking';

declare global {
  // eslint-disable-next-line no-var
  var __KI_REGISTER_PROCESS_HOOKS_INSTALLED__: boolean | undefined;
}

export function registerProcessErrorHooks(): void {
  if (globalThis.__KI_REGISTER_PROCESS_HOOKS_INSTALLED__ === true) {
    return;
  }

  process.on('uncaughtException', (error) => {
    captureException(error, {
      boundary: 'process',
      component: 'uncaughtException',
    });
  });

  process.on('unhandledRejection', (reason) => {
    captureException(reason, {
      boundary: 'process',
      component: 'unhandledRejection',
    });
  });

  globalThis.__KI_REGISTER_PROCESS_HOOKS_INSTALLED__ = true;
}
