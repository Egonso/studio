import '@/lib/server-only-guard';

import { isPersonalAgentKitScope } from '@/lib/agent-kit/api-keys';
import {
  findRegisterLocationById,
  type ServerRegisterLocation,
} from '@/lib/register-first/register-admin';
import {
  requireUser,
  requireWorkspaceReviewer,
} from '@/lib/server-auth';

export interface AgentOperatorCandidateReviewAuthorization {
  location: ServerRegisterLocation;
  scopeType: 'personal' | 'workspace';
}

export async function authorizeAgentOperatorCandidateReview(input: {
  authorizationHeader: string | null;
  orgId: string;
  registerId: string;
}): Promise<AgentOperatorCandidateReviewAuthorization | null> {
  const authOptions = {
    enforceSessionAge: false,
  } as const;
  const user = await requireUser(input.authorizationHeader, authOptions);

  if (isPersonalAgentKitScope(input.orgId, user.uid)) {
    const location = await findRegisterLocationById(input.registerId, {
      ownerId: user.uid,
    });

    return location
      ? {
          location,
          scopeType: 'personal',
        }
      : null;
  }

  await requireWorkspaceReviewer(
    input.authorizationHeader,
    input.orgId,
  );
  const location = await findRegisterLocationById(input.registerId, {
    workspaceId: input.orgId,
  });

  return location
    ? {
        location,
        scopeType: 'workspace',
      }
    : null;
}
