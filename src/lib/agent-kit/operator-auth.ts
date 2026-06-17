import '@/lib/server-only-guard';

import {
  authenticateAgentKitApiKey,
  hasAgentKitApiKeyScopes,
  type AgentKitApiKeyAuthenticationResult,
  type AgentKitApiKeyRecord,
  type AgentKitApiKeyScope,
} from '@/lib/agent-kit/api-keys';

export function resolveAgentKitApiKeyFromHeaders(
  headers: Pick<Headers, 'get'>,
): string | null {
  const xApiKey = headers.get('x-api-key');
  if (xApiKey?.trim()) {
    return xApiKey.trim();
  }

  const authorization = headers.get('authorization');
  if (!authorization?.trim()) {
    return null;
  }

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return authorization.trim();
}

export function mapAgentKitAuthenticationError(reason: string): {
  error: string;
  status: number;
} {
  switch (reason) {
    case 'revoked':
      return {
        error: 'Agent-Kit-API-Key wurde widerrufen.',
        status: 403,
      };
    case 'workspace_access_revoked':
      return {
        error:
          'Der User hinter diesem Agent-Kit-API-Key hat keinen aktiven Workspace-Zugang mehr.',
        status: 403,
      };
    case 'not_found':
    case 'token_mismatch':
    case 'hash_mismatch':
      return {
        error: 'Agent-Kit-API-Key ist ungueltig.',
        status: 401,
      };
    default:
      return {
        error: 'Agent-Kit-API-Key fehlt oder ist ungueltig formatiert.',
        status: 401,
      };
  }
}

export async function authenticateAgentKitHeaders(
  headers: Pick<Headers, 'get'>,
): Promise<AgentKitApiKeyAuthenticationResult> {
  return authenticateAgentKitApiKey(resolveAgentKitApiKeyFromHeaders(headers));
}

export function findMissingAgentKitScopes(
  record: AgentKitApiKeyRecord,
  requiredScopes: readonly AgentKitApiKeyScope[],
): AgentKitApiKeyScope[] {
  if (hasAgentKitApiKeyScopes(record, requiredScopes)) {
    return [];
  }

  return requiredScopes.filter(
    (scope) => !hasAgentKitApiKeyScopes(record, [scope]),
  );
}
