'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  getActiveWorkspaceScope,
  resolveWorkspaceScope,
  syncActiveWorkspaceScope,
} from './workspace-scope';

export function useWorkspaceScope(): string | null {
  const searchParams = useSearchParams();
  const explicitWorkspaceScope = searchParams?.get('workspace') ?? null;

  useEffect(() => {
    if (explicitWorkspaceScope === null) {
      return;
    }

    syncActiveWorkspaceScope(explicitWorkspaceScope);
  }, [explicitWorkspaceScope]);

  return useMemo(
    () =>
      resolveWorkspaceScope(searchParams ?? new URLSearchParams(), getActiveWorkspaceScope()),
    [searchParams],
  );
}
