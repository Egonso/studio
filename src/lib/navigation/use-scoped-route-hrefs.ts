'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';

import { localizeHref } from '@/lib/i18n/localize-href';
import { ROUTE_HREFS } from './route-manifest';
import { appendWorkspaceScope } from './workspace-scope';
import { useWorkspaceScope } from './use-workspace-scope';

export function useScopedRouteHrefs() {
  const locale = useLocale();
  const workspaceScope = useWorkspaceScope();

  return useMemo(
    () => ({
      register: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.register, workspaceScope),
      ),
      useCases: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.useCases, workspaceScope),
      ),
      externalInbox: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.externalInbox, workspaceScope),
      ),
      settings: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.settings, workspaceScope),
      ),
      settingsAgentKit: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.settingsAgentKit, workspaceScope),
      ),
      control: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.control, workspaceScope),
      ),
      controlReviews: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.controlReviews, workspaceScope),
      ),
      governanceSettings: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.governanceSettings, workspaceScope),
      ),
      controlPolicies: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.controlPolicies, workspaceScope),
      ),
      controlExports: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.controlExports, workspaceScope),
      ),
      controlTrust: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.controlTrust, workspaceScope),
      ),
      controlEnterprise: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.controlEnterprise, workspaceScope),
      ),
      academy: localizeHref(
        locale,
        appendWorkspaceScope(ROUTE_HREFS.academy, workspaceScope),
      ),
    }),
    [locale, workspaceScope],
  );
}
