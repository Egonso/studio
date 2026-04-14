import type { FeatureCapability } from './featureChecker';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';

export function getFeatureUpgradeHref(feature: FeatureCapability): string {
  switch (feature) {
    case 'extendedOrgSettings':
    case 'governanceWizard':
      return ROUTE_HREFS.governanceSettings;
    case 'policyEngine':
      return ROUTE_HREFS.controlPolicies;
    case 'auditExport':
      return ROUTE_HREFS.controlExports;
    case 'reviewWorkflow':
      return ROUTE_HREFS.control;
    case 'trustPortal':
      return ROUTE_HREFS.controlTrust;
    case 'competencyMatrix':
      return ROUTE_HREFS.academy;
    case 'benchmarkInsights':
    case 'apiAccess':
    case 'executiveReporting':
    case 'multiOrgStructure':
    case 'supplyChainAssessment':
      return ROUTE_HREFS.control;
    default:
      return ROUTE_HREFS.control;
  }
}

export function getFeatureUpgradeCtaLabel(feature: FeatureCapability): string {
  switch (feature) {
    case 'extendedOrgSettings':
    case 'governanceWizard':
      return 'Open Governance Settings';
    case 'reviewWorkflow':
      return 'Open Report';
    case 'policyEngine':
      return 'Open Policies';
    case 'auditExport':
      return 'Open Exports';
    case 'trustPortal':
      return 'Open Trust Portal';
    case 'competencyMatrix':
      return 'Open Academy';
    default:
      return 'Open Report';
  }
}
