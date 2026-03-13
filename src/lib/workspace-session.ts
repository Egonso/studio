const ACTIVE_WORKSPACE_SESSION_KEY = 'activeWorkspaceId';

export function setActiveWorkspaceId(workspaceId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (workspaceId) {
    window.sessionStorage.setItem(ACTIVE_WORKSPACE_SESSION_KEY, workspaceId);
  } else {
    window.sessionStorage.removeItem(ACTIVE_WORKSPACE_SESSION_KEY);
  }
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(ACTIVE_WORKSPACE_SESSION_KEY);
}

export function clearActiveWorkspaceId(): void {
  setActiveWorkspaceId(null);
}
