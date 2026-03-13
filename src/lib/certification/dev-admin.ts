export interface DevAdminActor {
  uid: string;
  email: string;
  displayName?: string | null;
}

function normalizeEmail(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return 'admin@kiregister.dev';
  }

  return normalized;
}

export function requireDevAdminActor(
  request: Pick<Request, 'headers'>,
): DevAdminActor {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Not found.');
  }

  const email = normalizeEmail(request.headers.get('x-dev-admin-email'));
  const displayName = request.headers.get('x-dev-admin-name')?.trim() || 'Playwright Admin';

  return {
    uid: `dev-admin:${email}`,
    email,
    displayName,
  };
}
