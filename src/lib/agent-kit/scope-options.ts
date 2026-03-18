import type { WorkspaceRole } from '@/lib/enterprise/workspace';

export interface AgentKitScopeOption {
  orgId: string;
  orgName: string;
  role: WorkspaceRole;
  scopeType: 'personal' | 'workspace';
}

export interface AgentKitWorkspaceOption {
  orgId: string;
  name: string;
  role: WorkspaceRole;
}

export function buildAgentKitScopeOptions(input: {
  userId: string;
  workspaces: AgentKitWorkspaceOption[];
}): AgentKitScopeOption[] {
  return [
    {
      orgId: input.userId,
      orgName: 'Mein Register',
      role: 'OWNER',
      scopeType: 'personal',
    },
    ...input.workspaces
      .filter((workspace) => workspace.orgId !== input.userId)
      .map((workspace) => ({
        orgId: workspace.orgId,
        orgName: workspace.name,
        role: workspace.role,
        scopeType: 'workspace' as const,
      })),
  ];
}
