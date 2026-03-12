import { logInfo } from '@/lib/observability/logger';
import { installServerWebStorageShim } from '@/lib/runtime/server-web-storage';

export async function register() {
  installServerWebStorageShim();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerProcessErrorHooks } = await import(
      '@/lib/observability/process-hooks'
    );
    registerProcessErrorHooks();
  }
  logInfo('instrumentation_registered', { runtime: process.env.NEXT_RUNTIME });
}
