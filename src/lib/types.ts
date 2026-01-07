export type ComplianceStatus = 'Compliant' | 'At Risk' | 'Non-Compliant';

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  details: string;
}

export type TrustTonePreset = 'standard' | 'human' | 'conservative';

export interface TrustPortalConfig {
  isPublished: boolean;
  lastPublishedAt?: string;
  urlSlug?: string;

  // Content
  tonePreset: TrustTonePreset;
  portalTitle: string;
  introduction: string;
  governanceStatement: string;
  responsibilityText: string;
  contactText: string;
  contactEmail: string;

  // Visibility
  showRiskCategory: boolean;
  showHumanOversight: boolean;
  showPolicies: boolean;

  // Snapshot Data (stored here or in separate collection? Storing locally in config for "Preview" is good, but "Public" version needs to be separate doc. 
  // We'll use this config to generate the public doc.)
}

export interface PublicTrustPortal {
  id: string; // usually projectId
  projectId: string;
  ownerId: string; // Added for security rules
  publishedAt: string;

  title: string;
  introduction: string;
  governanceStatement: string;
  responsibilityText: string;
  contactText: string;
  contactEmail: string;

  trustScore: number;

  // AI Systems Snapshot
  aiSystems: {
    name: string;
    purpose: string;
    riskCategory?: string;
    humanOversight?: string;
  }[];

  showRiskCategory: boolean;
  showHumanOversight: boolean;
  showPolicies: boolean;
}
