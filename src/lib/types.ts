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
  organizationName: string;
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

  organizationName: string;
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

export interface ComplianceCheckResult {
  gdpr_compliance_claimed: boolean;
  ai_act_mentioned: boolean;
  trust_center_available: boolean;
  key_findings: string[];
  summary: string;
  citations?: string[];
  lastCheckedAt?: string; // ISO date string
}

export type ToolType = 'saas' | 'model' | 'internal' | 'other';
export type ReviewStatus = 'pending' | 'reviewed' | 'approved_internal' | 'approved_public' | 'rejected';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type FlagStatus = 'yes' | 'no' | 'not_found';

export interface ToolReview {
  status: ReviewStatus;
  reviewedBy: string | null; // User ID or Name
  reviewedAt: string | null; // ISO Date
  notes: string | null;
}

export interface PublicInfoSource {
  title: string;
  url: string;
  type: 'trust_center' | 'privacy' | 'terms' | 'dpa' | 'scc' | 'blog' | 'other';
  accessedAt: string; // ISO Date
}

export interface ToolPublicInfo {
  lastCheckedAt: string | null; // ISO Date
  checker: 'perplexity' | 'manual' | 'web' | null;
  summary: string | null; // Max 300 chars, neutral
  flags: {
    gdprClaim: FlagStatus;
    aiActClaim: FlagStatus;
    trustCenterFound: FlagStatus;
    privacyPolicyFound: FlagStatus;
    dpaOrSccMention: FlagStatus;
  };
  confidence: ConfidenceLevel;
  sources: PublicInfoSource[];
  disclaimerVersion: string; // e.g. "v1"
}

export interface ProjectTool {
  id: string; // Firestore Doc ID
  name: string;
  vendor: string | null;
  type: ToolType;
  url: string | null;
  category: string | null; // UX grouping

  dataCategories: {
    personal: boolean;
    sensitive: boolean;
    none: boolean;
    unknown: boolean;
  };

  review: ToolReview;
  publicInfo: ToolPublicInfo | null; // Can be null if never checked

  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}
