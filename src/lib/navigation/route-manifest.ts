import {
  hasCapability,
  type FeatureCapability,
} from '../compliance-engine/capability/featureChecker';
import type { SubscriptionPlan } from '../register-first/types';

export const EXTERNAL_INBOX_FILTER = 'supplier_requests' as const;

export const ROUTE_PATHS = {
  marketingHome: '/',
  login: '/login',
  setup: '/einrichten',
  register: '/my-register',
  capture: '/capture',
  publicCapture: '/intake',
  supplierRequestPattern: '/request/[requestToken]',
  settings: '/settings',
  settingsAgentKit: '/settings/agent-kit',
  governanceSettings: '/settings/governance',
  control: '/control',
  controlWelcome: '/control/welcome',
  controlReviews: '/control/reviews',
  controlPolicies: '/control/policies',
  controlExports: '/control/exports',
  controlTrust: '/control/trust',
  controlEnterprise: '/control/organisation',
  academy: '/academy',
  law: '/law',
  downloads: '/downloads',
  developersAgentKit: '/developers/agent-kit',
  verifyPattern: '/verify/[code]',
  verifyPassPattern: '/verify/pass/[hashId]',
  publicTrustPattern: '/trust/[projectId]',
} as const;

export const ROUTE_HREFS = {
  register: ROUTE_PATHS.register,
  useCases: `${ROUTE_PATHS.register}?section=use-cases`,
  externalInbox: `${ROUTE_PATHS.register}?filter=${EXTERNAL_INBOX_FILTER}`,
  settings: ROUTE_PATHS.settings,
  settingsAgentKit: ROUTE_PATHS.settingsAgentKit,
  governanceSettings: `${ROUTE_PATHS.settings}?section=governance`,
  governanceUpgrade: `${ROUTE_PATHS.settings}?section=governance#upgrade-panel`,
  control: ROUTE_PATHS.control,
  controlWelcome: ROUTE_PATHS.controlWelcome,
  controlReviews: ROUTE_PATHS.controlReviews,
  controlPolicies: ROUTE_PATHS.controlPolicies,
  controlExports: ROUTE_PATHS.controlExports,
  controlTrust: ROUTE_PATHS.controlTrust,
  controlEnterprise: ROUTE_PATHS.controlEnterprise,
  academy: ROUTE_PATHS.academy,
  developersAgentKit: ROUTE_PATHS.developersAgentKit,
} as const;

export type ProductAreaId =
  | 'public_marketing'
  | 'public_external_intake'
  | 'signed_in_free_register'
  | 'paid_governance_control';

export interface ProductAreaDefinition {
  id: ProductAreaId;
  shellLabel: string;
  shortLabel: string;
  headline: string;
  description: string;
  primaryHref: string;
  primaryCtaLabel: string;
  secondaryHref?: string;
  secondaryCtaLabel?: string;
}

export const PRODUCT_AREA_DEFINITIONS: Record<
  ProductAreaId,
  ProductAreaDefinition
> = {
  public_marketing: {
    id: 'public_marketing',
    shellLabel: 'Public Marketing',
    shortLabel: 'Start',
    headline: 'AI Register Entry',
    description:
      'Public entry point for new register creation, existing login and special contexts such as invite, import or checkout return.',
    primaryHref: ROUTE_PATHS.marketingHome,
    primaryCtaLabel: 'Get started',
    secondaryHref: '/?mode=login',
    secondaryCtaLabel: 'Sign in',
  },
  public_external_intake: {
    id: 'public_external_intake',
    shellLabel: 'Public Intake',
    shortLabel: 'Intake',
    headline: 'Submit information securely',
    description:
      'Public forms for structured submissions via access code or signed supplier link.',
    primaryHref: ROUTE_PATHS.publicCapture,
    primaryCtaLabel: 'Use access code',
    secondaryHref: '/?mode=signup&intent=create_register',
    secondaryCtaLabel: 'Start your own register',
  },
  signed_in_free_register: {
    id: 'signed_in_free_register',
    shellLabel: 'Register',
    shortLabel: 'Register',
    headline: 'Document and review',
    description:
      'Signed-in workspace for use cases, external submissions and register settings.',
    primaryHref: ROUTE_HREFS.register,
    primaryCtaLabel: 'Open register',
    secondaryHref: ROUTE_HREFS.externalInbox,
    secondaryCtaLabel: 'External Inbox',
  },
  paid_governance_control: {
    id: 'paid_governance_control',
    shellLabel: 'Governance',
    shortLabel: 'Report',
    headline: 'Governance Report',
    description:
      'Register-based analysis for maturity level, reviews, evidence and advanced governance areas.',
    primaryHref: ROUTE_HREFS.control,
    primaryCtaLabel: 'Open report',
    secondaryHref: ROUTE_HREFS.controlPolicies,
    secondaryCtaLabel: 'Policies',
  },
};

export interface CanonicalRouteEntry {
  segment: ProductAreaId;
  href: string;
  label: string;
  description: string;
  notes?: string;
}

export const CANONICAL_ROUTE_MAP: CanonicalRouteEntry[] = [
  {
    segment: 'public_marketing',
    href: ROUTE_PATHS.marketingHome,
    label: 'Auth Entry',
    description:
      'Single public auth entry for new register creation, login, join and checkout-return context.',
    notes: 'All landingpage variants and legacy auth routes redirect here.',
  },
  {
    segment: 'public_external_intake',
    href: ROUTE_PATHS.publicCapture,
    label: 'Public Capture',
    description: 'Code-based external intake for third-party submissions.',
  },
  {
    segment: 'public_external_intake',
    href: ROUTE_PATHS.supplierRequestPattern,
    label: 'Supplier Request Link',
    description: 'Register-scoped supplier intake form with provenance.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_HREFS.register,
    label: 'Register Home',
    description: 'Canonical signed-in register workspace.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_HREFS.useCases,
    label: 'Use Cases',
    description: 'Use-case focused lens inside the register workspace.',
    notes: 'Same canonical register surface, different lens.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_HREFS.externalInbox,
    label: 'External Inbox',
    description: 'Supplier/external intake lens inside the register workspace.',
    notes:
      'Same canonical register surface, filtered to traced external submissions.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_PATHS.capture,
    label: 'Quick Capture',
    description: 'Signed-in quick capture for internal teams.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_PATHS.settings,
    label: 'Settings',
    description: 'User and governance settings.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_PATHS.settingsAgentKit,
    label: 'Agent Kit Settings',
    description: 'Signed-in setup for Agent Kit API keys and direct submissions.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.control,
    label: 'Governance Report',
    description:
      'Register-based analysis and entry to advanced governance areas.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.controlReviews,
    label: 'Reviews',
    description: 'Action Queue and formal review focus.',
  },
  {
    segment: 'signed_in_free_register',
    href: ROUTE_HREFS.governanceSettings,
    label: 'Governance Settings',
    description: 'Governance section inside the canonical settings surface.',
    notes: 'Also linked as a premium governance destination.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.controlPolicies,
    label: 'Policies',
    description: 'Canonical policy engine destination.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.controlExports,
    label: 'Exports',
    description: 'Canonical audit/export destination.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.controlTrust,
    label: 'Trust Portal',
    description:
      'Canonical trust and public disclosure management destination.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.controlEnterprise,
    label: 'Organisation',
    description:
      'Workspace administration, approvals, procurement, identity and provisioning.',
  },
  {
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.academy,
    label: 'Academy',
    description: 'Canonical governance learning destination.',
  },
];

export interface DeprecatedRouteAlias {
  source: string;
  destination: string;
  permanent: boolean;
  reason: string;
}

export type LegacyRouteDisposition = 'archive' | 'keep_isolated' | 'migrate';

export interface LegacyRouteInventoryEntry {
  source: string;
  disposition: LegacyRouteDisposition;
  canonicalDestination: string;
  reason: string;
}

export const DEPRECATED_ROUTE_ALIASES: DeprecatedRouteAlias[] = [
  {
    source: '/login',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Login now lives inside the canonical root auth entry.',
  },
  {
    source: '/einrichten',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Register setup now lives inside the canonical root auth entry.',
  },
  {
    source: '/einladen',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Invite-based join now lives inside the canonical root auth entry.',
  },
  {
    source: '/control/enterprise',
    destination: ROUTE_HREFS.controlEnterprise,
    permanent: false,
    reason: 'Organisation is the canonical route for workspace administration.',
  },
  {
    source: '/projects',
    destination: ROUTE_HREFS.register,
    permanent: false,
    reason: 'Legacy project list is replaced by the register-first workspace.',
  },
  {
    source: '/ai-management',
    destination: ROUTE_HREFS.control,
    permanent: false,
    reason: 'Legacy AI management shell is folded into Control.',
  },
  {
    source: '/aims',
    destination: ROUTE_HREFS.control,
    permanent: false,
    reason: 'Legacy AIMS setup is no longer a primary flow.',
  },
  {
    source: '/assessment',
    destination: ROUTE_HREFS.register,
    permanent: false,
    reason:
      'Project assessment flow is superseded by register-first capture and use-case review.',
  },
  {
    source: '/assessment/:path*',
    destination: ROUTE_HREFS.register,
    permanent: false,
    reason: 'Nested assessment screens now resolve into the register workflow.',
  },
  {
    source: '/portfolio',
    destination: '/control/portfolio',
    permanent: false,
    reason:
      'Legacy portfolio screen now resolves into the Control portfolio module.',
  },
  {
    source: '/audit-report',
    destination: ROUTE_HREFS.controlExports,
    permanent: false,
    reason: 'Legacy audit dossier screen is replaced by the org export center.',
  },
  {
    source: '/cbs',
    destination: ROUTE_HREFS.controlPolicies,
    permanent: false,
    reason: 'Policy engine now lives under Control.',
  },
  {
    source: '/cbd',
    destination: ROUTE_HREFS.control,
    permanent: false,
    reason: 'Compliance-by-design is no longer a primary route.',
  },
  {
    source: '/kurs',
    destination: ROUTE_HREFS.academy,
    permanent: false,
    reason: 'Academy is the canonical learning route.',
  },
  {
    source: '/dashboard/cbs',
    destination: ROUTE_HREFS.controlPolicies,
    permanent: false,
    reason: 'Broken legacy dashboard deep link now resolves to Policies.',
  },
  {
    source: ROUTE_PATHS.governanceSettings,
    destination: ROUTE_HREFS.governanceSettings,
    permanent: false,
    reason: 'Governance settings now live inside the unified settings page.',
  },
  {
    source: '/landingpage',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingpage2',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingpage3',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingsimple',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingsimple1',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingsimple2',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/landingsimple4',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing variant.',
  },
  {
    source: '/simplelanding',
    destination: ROUTE_PATHS.marketingHome,
    permanent: false,
    reason: 'Legacy landing alias.',
  },
  {
    source: '/erfassen',
    destination: ROUTE_PATHS.publicCapture,
    permanent: true,
    reason: 'German route migrated to English /intake.',
  },
  {
    source: '/gesetz',
    destination: ROUTE_PATHS.law,
    permanent: true,
    reason: 'German route migrated to English /law.',
  },
  {
    source: '/datenschutz',
    destination: '/privacy',
    permanent: true,
    reason: 'German route migrated to English /privacy.',
  },
  {
    source: '/impressum',
    destination: '/legal-notice',
    permanent: true,
    reason: 'German route migrated to English /legal-notice.',
  },
  {
    source: '/agb',
    destination: '/terms',
    permanent: true,
    reason: 'German route migrated to English /terms.',
  },
];

export const LEGACY_ROUTE_INVENTORY: LegacyRouteInventoryEntry[] = [
  {
    source: '/ai-management',
    disposition: 'archive',
    canonicalDestination: ROUTE_HREFS.control,
    reason: 'Legacy AI management shell is retained only as a redirected archive entry.',
  },
  {
    source: '/aims',
    disposition: 'archive',
    canonicalDestination: ROUTE_HREFS.control,
    reason: 'Legacy AIMS wizard is no longer a primary product flow.',
  },
  {
    source: '/assessment',
    disposition: 'archive',
    canonicalDestination: ROUTE_HREFS.register,
    reason: 'Assessment is subsumed by register-first capture and detail review.',
  },
  {
    source: '/portfolio',
    disposition: 'migrate',
    canonicalDestination: '/control/portfolio',
    reason: 'Portfolio remains available only through the Control module.',
  },
  {
    source: '/audit-report',
    disposition: 'migrate',
    canonicalDestination: ROUTE_HREFS.controlExports,
    reason: 'Legacy audit dossier functionality is replaced by the export center.',
  },
  {
    source: '/landingpage',
    disposition: 'archive',
    canonicalDestination: ROUTE_PATHS.marketingHome,
    reason: 'Legacy landing variants now resolve into the canonical auth entry.',
  },
  {
    source: '/landingpage2',
    disposition: 'archive',
    canonicalDestination: ROUTE_PATHS.marketingHome,
    reason: 'Legacy landing variants now resolve into the canonical auth entry.',
  },
  {
    source: '/landingpage3',
    disposition: 'archive',
    canonicalDestination: ROUTE_PATHS.marketingHome,
    reason: 'Legacy landing variants now resolve into the canonical auth entry.',
  },
  {
    source: '/projects',
    disposition: 'keep_isolated',
    canonicalDestination: ROUTE_HREFS.register,
    reason: 'Project-era flows remain isolated until the remaining project services are retired.',
  },
];

export const LEGACY_ROUTE_REDIRECTS = DEPRECATED_ROUTE_ALIASES.map((alias) => ({
  source: alias.source,
  destination: alias.destination,
  permanent: alias.permanent,
}));

export function getProductAreaForPathname(
  pathname: string | null | undefined,
): ProductAreaId | null {
  if (!pathname) {
    return null;
  }

  if (pathname === '/' || pathname === '/landingpage') {
    return 'public_marketing';
  }

  if (
    pathname === ROUTE_PATHS.publicCapture ||
    pathname.startsWith('/request/')
  ) {
    return 'public_external_intake';
  }

  if (
    pathname === ROUTE_PATHS.control ||
    pathname.startsWith(`${ROUTE_PATHS.control}/`) ||
    pathname === ROUTE_PATHS.academy ||
    pathname.startsWith(`${ROUTE_PATHS.academy}/`) ||
    pathname === '/kurs' ||
    pathname === '/exam'
  ) {
    return 'paid_governance_control';
  }

  if (
    pathname === ROUTE_PATHS.register ||
    pathname.startsWith(`${ROUTE_PATHS.register}/`) ||
    pathname === ROUTE_PATHS.capture ||
    pathname === ROUTE_PATHS.settings ||
    pathname === ROUTE_PATHS.governanceSettings ||
    pathname.startsWith(`${ROUTE_PATHS.governanceSettings}/`) ||
    pathname.startsWith(`${ROUTE_PATHS.settings}/`) ||
    pathname.startsWith('/pass/')
  ) {
    return 'signed_in_free_register';
  }

  return null;
}

export function isSignedInProductArea(
  area: ProductAreaId | null | undefined,
): boolean {
  return (
    area === 'signed_in_free_register' || area === 'paid_governance_control'
  );
}

export function showGlobalFooterForPathname(pathname: string): boolean {
  if (!pathname) {
    return false;
  }
  return true;
}

export function showSiteChatbotForPathname(pathname: string): boolean {
  if (!pathname) {
    return false;
  }

  if (
    pathname === ROUTE_PATHS.publicCapture ||
    pathname.startsWith('/request/') ||
    pathname === '/exam'
  ) {
    return false;
  }

  return true;
}

export interface ProductNavItem {
  id: 'register' | 'externalInbox' | 'control';
  label: string;
  href: string;
  group: 'core' | 'governance';
  premiumFeature?: FeatureCapability;
  description: string;
}

export const PRODUCT_NAV_MANIFEST: ProductNavItem[] = [
  {
    id: 'register',
    label: 'Register',
    href: ROUTE_HREFS.register,
    group: 'core',
    description: 'Register overview and onboarding shell.',
  },
  {
    id: 'externalInbox',
    label: 'External Inbox',
    href: ROUTE_HREFS.externalInbox,
    group: 'core',
    description: 'Externally submitted intake items.',
  },
  {
    id: 'control',
    label: 'Report',
    href: ROUTE_HREFS.control,
    group: 'governance',
    premiumFeature: 'reviewWorkflow',
    description: 'Register-based governance analysis.',
  },
];

export function isPremiumNavItemLocked(
  item: ProductNavItem,
  plan: SubscriptionPlan | null | undefined,
): boolean {
  if (!item.premiumFeature) {
    return false;
  }

  return !hasCapability(plan ?? 'free', item.premiumFeature);
}

export function getVisibleProductNav(
  plan: SubscriptionPlan | null | undefined,
): ProductNavItem[] {
  return PRODUCT_NAV_MANIFEST.filter((item) => {
    if (!item.premiumFeature) return true;
    return hasCapability(plan ?? 'free', item.premiumFeature);
  });
}

export interface PremiumControlNavItem {
  id:
    | 'overview'
    | 'reviews'
    | 'governanceSettings'
    | 'policies'
    | 'exports'
    | 'trust'
    | 'enterprise'
    | 'academy';
  label: string;
  href: string;
  description: string;
  premiumFeature: FeatureCapability;
}

export const PREMIUM_CONTROL_NAV_MANIFEST: PremiumControlNavItem[] = [
  {
    id: 'overview',
    label: 'Report',
    href: ROUTE_HREFS.control,
    description:
      'Register-based analysis of maturity level, reviews, course progress and evidence.',
    premiumFeature: 'reviewWorkflow',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    href: ROUTE_HREFS.controlReviews,
    description: 'Action Queue, overdue reviews and formal review workload.',
    premiumFeature: 'reviewWorkflow',
  },
  {
    id: 'governanceSettings',
    label: 'Governance Settings',
    href: ROUTE_HREFS.governanceSettings,
    description:
      'Organisation-wide governance rules, roles, review cycles and access codes.',
    premiumFeature: 'extendedOrgSettings',
  },
  {
    id: 'policies',
    label: 'Policy Engine',
    href: ROUTE_HREFS.controlPolicies,
    description: 'Generate and maintain governance policies.',
    premiumFeature: 'policyEngine',
  },
  {
    id: 'exports',
    label: 'Exports / Audit',
    href: ROUTE_HREFS.controlExports,
    description: 'Audit dossier and export center.',
    premiumFeature: 'auditExport',
  },
  {
    id: 'trust',
    label: 'Trust Portal',
    href: ROUTE_HREFS.controlTrust,
    description: 'External trust signals and public disclosure.',
    premiumFeature: 'trustPortal',
  },
  {
    id: 'enterprise',
    label: 'Organisation',
    href: ROUTE_HREFS.controlEnterprise,
    description:
      'Rollen, Mitglieder, Identity, SCIM, Procurement und formale Freigaben.',
    premiumFeature: 'multiOrgStructure',
  },
  {
    id: 'academy',
    label: 'Academy',
    href: ROUTE_HREFS.academy,
    description: 'Course progress, learning content and certification flow.',
    premiumFeature: 'competencyMatrix',
  },
];

export function isPremiumControlNavItemLocked(
  item: PremiumControlNavItem,
  plan: SubscriptionPlan | null | undefined,
): boolean {
  return !hasCapability(plan ?? 'free', item.premiumFeature);
}

export function getVisiblePremiumControlNav(
  plan: SubscriptionPlan | null | undefined,
): PremiumControlNavItem[] {
  return PREMIUM_CONTROL_NAV_MANIFEST.filter((item) =>
    hasCapability(plan ?? 'free', item.premiumFeature),
  );
}

type SearchParamsLike = {
  get(name: string): string | null;
};

export function isNavItemActive(
  item: ProductNavItem,
  pathname: string,
  searchParams?: SearchParamsLike | null,
): boolean {
  const section = searchParams?.get('section');
  const filter = searchParams?.get('filter');

  switch (item.id) {
    case 'register':
      return (
        pathname === ROUTE_PATHS.register &&
        filter !== EXTERNAL_INBOX_FILTER &&
        section !== 'use-cases'
      );
    case 'externalInbox':
      return (
        pathname === ROUTE_PATHS.register && filter === EXTERNAL_INBOX_FILTER
      );
    case 'control':
      return getProductAreaForPathname(pathname) === 'paid_governance_control';
    default:
      return false;
  }
}

export function isPremiumControlNavActive(
  item: PremiumControlNavItem,
  pathname: string,
  searchParams?: SearchParamsLike | null,
): boolean {
  switch (item.id) {
    case 'overview':
      return pathname === ROUTE_PATHS.control;
    case 'reviews':
      return pathname.startsWith(ROUTE_PATHS.controlReviews);
    case 'governanceSettings':
      return (
        (pathname === ROUTE_PATHS.settings &&
          searchParams?.get('section') === 'governance') ||
        pathname.startsWith(ROUTE_PATHS.governanceSettings)
      );
    case 'policies':
      return pathname.startsWith(ROUTE_PATHS.controlPolicies);
    case 'exports':
      return pathname.startsWith(ROUTE_PATHS.controlExports);
    case 'trust':
      return pathname.startsWith(ROUTE_PATHS.controlTrust);
    case 'enterprise':
      return pathname.startsWith(ROUTE_PATHS.controlEnterprise);
    case 'academy':
      return pathname.startsWith(ROUTE_PATHS.academy) || pathname === '/kurs';
    default:
      return false;
  }
}
