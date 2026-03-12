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
      return ROUTE_HREFS.controlReviews;
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
      return 'Governance Settings öffnen';
    case 'reviewWorkflow':
      return 'Bericht öffnen';
    case 'policyEngine':
      return 'Policies öffnen';
    case 'auditExport':
      return 'Exports öffnen';
    case 'trustPortal':
      return 'Trust Portal öffnen';
    case 'competencyMatrix':
      return 'Academy öffnen';
    default:
      return 'Bericht öffnen';
  }
}
