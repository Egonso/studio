import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from '@/lib/data-service';

export const PERSONAL_WORKSPACE_SCOPE = 'personal' as const;

type SearchParamReader = {
  get(name: string): string | null;
};

export function normalizeWorkspaceScope(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === PERSONAL_WORKSPACE_SCOPE) {
    return null;
  }
  return normalized;
}

export function getActiveWorkspaceScope(): string | null {
  return normalizeWorkspaceScope(getActiveWorkspaceId());
}

export function syncActiveWorkspaceScope(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeWorkspaceScope(value);
  setActiveWorkspaceId(normalized);
  return normalized;
}

export function resolveWorkspaceScope(
  searchParams?: SearchParamReader | null,
  fallbackScope?: string | null,
): string | null {
  const rawScope = searchParams?.get('workspace');
  if (rawScope !== null && rawScope !== undefined) {
    return normalizeWorkspaceScope(rawScope);
  }

  return normalizeWorkspaceScope(fallbackScope);
}

export function appendWorkspaceScope(
  href: string,
  workspaceScope: string | null | undefined,
): string {
  const hashIndex = href.indexOf('#');
  const hrefWithoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const queryIndex = hrefWithoutHash.indexOf('?');
  const pathname =
    queryIndex >= 0 ? hrefWithoutHash.slice(0, queryIndex) : hrefWithoutHash;
  const queryString =
    queryIndex >= 0 ? hrefWithoutHash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(queryString);
  const normalizedScope = normalizeWorkspaceScope(workspaceScope);

  if (normalizedScope) {
    params.set('workspace', normalizedScope);
  } else {
    params.delete('workspace');
  }

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}

export function buildScopedRegisterHref(
  workspaceScope: string | null | undefined,
  options: {
    filter?: string | null;
    section?: string | null;
    onboarding?: boolean | null;
  } = {},
): string {
  const params = new URLSearchParams();

  if (options.filter) {
    params.set('filter', options.filter);
  }

  if (options.section) {
    params.set('section', options.section);
  }

  if (options.onboarding) {
    params.set('onboarding', 'true');
  }

  const href = params.toString()
    ? `/my-register?${params.toString()}`
    : '/my-register';
  return appendWorkspaceScope(href, workspaceScope);
}

export function buildScopedUseCaseDetailHref(
  useCaseId: string,
  workspaceScope: string | null | undefined,
): string {
  return appendWorkspaceScope(
    `/my-register/${encodeURIComponent(useCaseId)}`,
    workspaceScope,
  );
}

export function buildScopedUseCasePassHref(
  useCaseId: string,
  workspaceScope: string | null | undefined,
): string {
  return appendWorkspaceScope(
    `/pass/${encodeURIComponent(useCaseId)}`,
    workspaceScope,
  );
}
