import { redirect } from 'next/navigation';

import { buildAuthPath, type AuthRouteOptions } from '@/lib/auth/login-routing';

interface SetupRedirectPageProps {
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

export default async function SetupRedirectPage({
  searchParams,
}: SetupRedirectPageProps) {
  const resolved = (await searchParams) ?? {};
  const options: AuthRouteOptions = {
    email: readSingleValue(resolved.email),
    importUseCase: readSingleValue(resolved.import),
    intent: 'create_register',
    mode: 'signup',
    sessionId:
      readSingleValue(resolved.session_id) ??
      readSingleValue(resolved.checkout_session_id),
  };

  redirect(buildAuthPath(options));
}
