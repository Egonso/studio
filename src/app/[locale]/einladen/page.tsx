import { redirect } from 'next/navigation';

import { buildAuthPath, type AuthRouteOptions } from '@/lib/auth/login-routing';

interface InviteRedirectPageProps {
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

export default async function InviteRedirectPage({
  searchParams,
}: InviteRedirectPageProps) {
  const resolved = (await searchParams) ?? {};
  const options: AuthRouteOptions = {
    code: readSingleValue(resolved.code),
    email: readSingleValue(resolved.email),
    intent: 'join_register',
    mode: 'signup',
    sessionId:
      readSingleValue(resolved.session_id) ??
      readSingleValue(resolved.checkout_session_id),
  };

  redirect(buildAuthPath(options));
}
