import { redirect } from 'next/navigation';

import { buildAuthPath, type AuthRouteOptions } from '@/lib/auth/login-routing';

interface LoginRedirectPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function readSingleValue(
  value: string | string[] | undefined,
): string | null | undefined {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return value ?? undefined;
}

export default async function LoginRedirectPage({
  searchParams,
}: LoginRedirectPageProps) {
  const resolved = (await searchParams) ?? {};
  const options: AuthRouteOptions = {
    code: readSingleValue(resolved.code),
    email: readSingleValue(resolved.email),
    importUseCase: readSingleValue(resolved.importUseCase),
    intent:
      readSingleValue(resolved.intent) === 'join_register' ||
      readSingleValue(resolved.intent) === 'create_register'
        ? (readSingleValue(resolved.intent) as AuthRouteOptions['intent'])
        : null,
    mode:
      readSingleValue(resolved.mode) === 'login' ||
      readSingleValue(resolved.mode) === 'signup'
        ? (readSingleValue(resolved.mode) as AuthRouteOptions['mode'])
        : 'login',
    returnTo: readSingleValue(resolved.returnTo),
    sessionId:
      readSingleValue(resolved.session_id) ??
      readSingleValue(resolved.checkout_session_id),
    workspaceInvite: readSingleValue(resolved.workspaceInvite),
  };

  redirect(buildAuthPath(options));
}
