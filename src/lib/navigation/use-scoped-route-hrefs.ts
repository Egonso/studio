'use client';

import { useMemo } from 'react';

import { ROUTE_HREFS } from './route-manifest';
import { appendWorkspaceScope } from './workspace-scope';
import { useWorkspaceScope } from './use-workspace-scope';

export function useScopedRouteHrefs() {
  const workspaceScope = useWorkspaceScope();

  return useMemo(
    () => ({
      register: appendWorkspaceScope(ROUTE_HREFS.register, workspaceScope),
      useCases: appendWorkspaceScope(ROUTE_HREFS.useCases, workspaceScope),
      externalInbox: appendWorkspaceScope(
        ROUTE_HREFS.externalInbox,
        workspaceScope,
      ),
      settings: appendWorkspaceScope(ROUTE_HREFS.settings, workspaceScope),
      settingsAgentKit: appendWorkspaceScope(
        ROUTE_HREFS.settingsAgentKit,
        workspaceScope,
      ),
      control: appendWorkspaceScope(ROUTE_HREFS.control, workspaceScope),
      controlReviews: appendWorkspaceScope(
        ROUTE_HREFS.controlReviews,
        workspaceScope,
      ),
      governanceSettings: appendWorkspaceScope(
        ROUTE_HREFS.governanceSettings,
        workspaceScope,
      ),
      controlPolicies: appendWorkspaceScope(
        ROUTE_HREFS.controlPolicies,
        workspaceScope,
      ),
      controlExports: appendWorkspaceScope(
        ROUTE_HREFS.controlExports,
        workspaceScope,
      ),
      controlTrust: appendWorkspaceScope(
        ROUTE_HREFS.controlTrust,
        workspaceScope,
      ),
      controlEnterprise: appendWorkspaceScope(
        ROUTE_HREFS.controlEnterprise,
        workspaceScope,
      ),
      academy: appendWorkspaceScope(ROUTE_HREFS.academy, workspaceScope),
    }),
    [workspaceScope],
  );
}
