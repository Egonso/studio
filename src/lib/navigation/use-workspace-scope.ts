'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  getActiveWorkspaceScope,
  resolveWorkspaceScope,
  syncActiveWorkspaceScope,
} from './workspace-scope';

export function useWorkspaceScope(): string | null {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const explicitWorkspaceScope = searchParams.get('workspace');

  useEffect(() => {
    if (explicitWorkspaceScope === null) {
      return;
    }

    syncActiveWorkspaceScope(explicitWorkspaceScope);
  }, [explicitWorkspaceScope]);

  return useMemo(
    () => resolveWorkspaceScope(searchParams, getActiveWorkspaceScope()),
    [searchParams],
  );
}
