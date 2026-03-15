import { ROUTE_PATHS, type ProductAreaId } from './route-manifest';

interface ResolveAppHeaderBrandHrefOptions {
  area: ProductAreaId | null | undefined;
  isAuthenticated: boolean;
  scopedRegisterHref: string;
  scopedControlHref: string;
  overrideHref?: string | null;
}

export function resolveAppHeaderBrandHref({
  area,
  isAuthenticated,
  scopedRegisterHref,
  scopedControlHref,
  overrideHref,
}: ResolveAppHeaderBrandHrefOptions): string {
  if (!isAuthenticated) {
    return ROUTE_PATHS.marketingHome;
  }

  const normalizedOverrideHref = overrideHref?.trim();
  if (normalizedOverrideHref) {
    return normalizedOverrideHref;
  }

  return area === 'paid_governance_control'
    ? scopedControlHref
    : scopedRegisterHref;
}
