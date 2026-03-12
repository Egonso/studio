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
  publicCapture: '/erfassen',
  supplierRequestPattern: '/request/[requestToken]',
  settings: '/settings',
  governanceSettings: '/settings/governance',
  control: '/control',
  controlReviews: '/control/reviews',
  controlPolicies: '/control/policies',
  controlExports: '/control/exports',
  controlTrust: '/control/trust',
  controlEnterprise: '/control/organisation',
  academy: '/academy',
  law: '/gesetz',
  downloads: '/downloads',
  verifyPattern: '/verify/[code]',
  verifyPassPattern: '/verify/pass/[hashId]',
  publicTrustPattern: '/trust/[projectId]',
} as const;

export const ROUTE_HREFS = {
  register: ROUTE_PATHS.register,
  useCases: `${ROUTE_PATHS.register}?section=use-cases`,
  externalInbox: `${ROUTE_PATHS.register}?filter=${EXTERNAL_INBOX_FILTER}`,
  settings: ROUTE_PATHS.settings,
  control: ROUTE_PATHS.control,
  controlReviews: ROUTE_PATHS.controlReviews,
  governanceSettings: ROUTE_PATHS.governanceSettings,
  controlPolicies: ROUTE_PATHS.controlPolicies,
  controlExports: ROUTE_PATHS.controlExports,
  controlTrust: ROUTE_PATHS.controlTrust,
  controlEnterprise: ROUTE_PATHS.controlEnterprise,
  academy: ROUTE_PATHS.academy,
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
    headline: 'KI-Register Einstieg',
    description:
      'Öffentlicher Einstieg für neues Register, bestehende Anmeldung und Sonderkontexte wie Invite, Import oder Checkout-Rückkehr.',
    primaryHref: ROUTE_PATHS.marketingHome,
    primaryCtaLabel: 'Neu starten',
    secondaryHref: '/?mode=login',
    secondaryCtaLabel: 'Anmelden',
  },
  public_external_intake: {
    id: 'public_external_intake',
    shellLabel: 'Public Intake',
    shortLabel: 'Intake',
    headline: 'Externe Angaben sicher einreichen',
    description:
      'Öffentliche Formulare zur strukturierten Einreichung über Zugangscode oder signierten Lieferantenlink.',
    primaryHref: ROUTE_PATHS.publicCapture,
    primaryCtaLabel: 'Zugangscode verwenden',
    secondaryHref: '/?mode=signup&intent=create_register',
    secondaryCtaLabel: 'Eigenes Register starten',
  },
  signed_in_free_register: {
    id: 'signed_in_free_register',
    shellLabel: 'Register',
    shortLabel: 'Register',
    headline: 'Dokumentieren und prüfen',
    description:
      'Signed-in Arbeitsbereich für Use Cases, externe Einreichungen und Register-Einstellungen.',
    primaryHref: ROUTE_HREFS.register,
    primaryCtaLabel: 'Register öffnen',
    secondaryHref: ROUTE_HREFS.externalInbox,
    secondaryCtaLabel: 'External Inbox',
  },
  paid_governance_control: {
    id: 'paid_governance_control',
    shellLabel: 'Governance',
    shortLabel: 'Bericht',
    headline: 'Governance-Bericht',
    description:
      'Registerbasierte Analyse für Reifegrad, Prüfungen, Nachweise und weiterführende Governance-Bereiche.',
    primaryHref: ROUTE_HREFS.control,
    primaryCtaLabel: 'Bericht öffnen',
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
    segment: 'paid_governance_control',
    href: ROUTE_HREFS.control,
    label: 'Governance-Bericht',
    description: 'Registerbasierte Analyse und Einstieg in weiterführende Governance-Bereiche.',
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
    description:
      'Organisation-wide governance settings used by register and control.',
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
      'Workspace-Administration, Freigaben, Beschaffung, Identity und Provisionierung.',
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
    pathname === ROUTE_PATHS.governanceSettings ||
    pathname.startsWith(`${ROUTE_PATHS.governanceSettings}/`) ||
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
  if (pathname === '/') {
    return false;
  }

  const area = getProductAreaForPathname(pathname);
  return area === null;
}

export function showSiteChatbotForPathname(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login') {
    return false;
  }

  const area = getProductAreaForPathname(pathname);
  return area === null || area === 'public_marketing';
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
    label: 'Bericht',
    href: ROUTE_HREFS.control,
    group: 'governance',
    premiumFeature: 'reviewWorkflow',
    description: 'Registerbasierte Governance-Analyse.',
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
    label: 'Bericht',
    href: ROUTE_HREFS.control,
    description:
      'Registerbasierte Analyse zu Reifegrad, Prüfungen, Kursfortschritt und Nachweisen.',
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
  void searchParams;

  switch (item.id) {
    case 'overview':
      return pathname === ROUTE_PATHS.control;
    case 'reviews':
      return pathname.startsWith(ROUTE_PATHS.controlReviews);
    case 'governanceSettings':
      return pathname.startsWith(ROUTE_PATHS.governanceSettings);
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
