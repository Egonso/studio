import AuthEntryPage from '@/components/auth/auth-entry-page';

import ExperienceClient from './experience/experience-client';

/**
 * Root landing.
 *
 * - Without query parameters: the cinematic "Der Nachweis" landing
 *   (src/app/[locale]/experience/experience-client.tsx).
 * - With auth context parameters (mode, intent, code, returnTo, ...):
 *   the classic auth entry page, because every login/signup/join flow
 *   links to `/?mode=...` (see src/lib/auth/login-routing.ts).
 *
 * To restore the classic landing as default, render <AuthEntryPage />
 * unconditionally again (git history: "landing: replace root with
 * experience page").
 */

const AUTH_CONTEXT_PARAMS = [
  'mode',
  'intent',
  'code',
  'email',
  'returnTo',
  'workspaceInvite',
  'importUseCase',
  'session_id',
  'checkout_session_id',
] as const;

export default async function RootPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const hasAuthContext = AUTH_CONTEXT_PARAMS.some((key) => {
    const value = resolvedSearchParams[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });

  if (hasAuthContext) {
    return <AuthEntryPage />;
  }

  return <ExperienceClient locale={locale} />;
}
