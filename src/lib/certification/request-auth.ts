import { requireUser } from '@/lib/server-auth';

export interface CertificationRequestActor {
  uid: string;
  email: string;
  displayName?: string | null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export async function requireCertificationActor(
  request: Pick<Request, 'headers'>,
): Promise<CertificationRequestActor> {
  const authorization = request.headers.get('authorization');

  if (authorization) {
    const user = await requireUser(authorization);
    return {
      uid: user.uid,
      email: user.email,
      displayName:
        typeof user.name === 'string' && user.name.trim().length > 0
          ? user.name
          : null,
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    const devEmail = normalizeEmail(request.headers.get('x-dev-auth-email'));
    if (devEmail) {
      return {
        uid: `dev:${devEmail}`,
        email: devEmail,
        displayName: request.headers.get('x-dev-auth-name') || devEmail,
      };
    }
  }

  throw new Error('Authentication required.');
}
