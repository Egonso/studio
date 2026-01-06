export type ComplianceStatus = 'Compliant' | 'At Risk' | 'Non-Compliant';

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  details: string;
}

export interface TrustPortalConfig {
  isPublished: boolean;
  lastPublishedAt?: string;
  urlSlug?: string;
  governanceStatement: string;
  contactEmail: string;
  showRiskCategory: boolean;
  showHumanOversight: boolean;
  showPolicies: boolean;
}
