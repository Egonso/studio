'use client';

import { getFirebaseAuth } from '@/lib/firebase';
import {
  resolveClientRegisterScopeContext,
} from '@/lib/register-first/register-scope';

import { parseExternalSubmission } from './schema';
import {
  getExternalSubmissionActor,
  getExternalSubmissionSystemNames,
  getExternalSubmissionTitle,
} from './external-submissions';
import type {
  ExternalSubmission,
  ExternalSubmissionStatus,
  ExternalSubmissionSourceType,
  Register,
  RegisterScopeContext,
} from './types';
import type { WorkspaceRole } from '@/lib/enterprise/workspace';

export interface ExternalSubmissionFilters {
  status?: ExternalSubmissionStatus | 'all';
  sourceType?: ExternalSubmissionSourceType | 'all';
  searchText?: string;
}

export interface ReviewExternalSubmissionInput {
  registerId: string;
  register?: Register | null;
  submissionId: string;
  scopeContext?: RegisterScopeContext | null;
  action: 'approve' | 'reject' | 'merge';
  note?: string | null;
  actorRole?: WorkspaceRole | null;
}

export interface FindRelatedExternalSubmissionInput {
  registerId: string;
  useCaseId: string;
  submissionId?: string | null;
  scopeContext?: RegisterScopeContext | null;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isExternalSubmissionPermissionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (code.includes('permission-denied')) {
      return true;
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (/missing or insufficient permissions/i.test(message)) {
      return true;
    }
  }

  return false;
}

async function resolveUserIdOrThrow(): Promise<string> {
  const auth = await getFirebaseAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('UNAUTHENTICATED');
  }
  return userId;
}

async function authFetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function resolveScopeContext(
  requestedScope?: RegisterScopeContext | null,
): Promise<{ userId: string; scopeContext: RegisterScopeContext }> {
  const userId = await resolveUserIdOrThrow();
  const scopeContext = await resolveClientRegisterScopeContext({
    userId,
    requestedScope,
  });

  return {
    userId,
    scopeContext,
  };
}

function matchesFilters(
  submission: ExternalSubmission,
  filters: ExternalSubmissionFilters,
): boolean {
  if (filters.status && filters.status !== 'all') {
    if (submission.status !== filters.status) {
      return false;
    }
  }

  if (filters.sourceType && filters.sourceType !== 'all') {
    if (submission.sourceType !== filters.sourceType) {
      return false;
    }
  }

  const query = filters.searchText?.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const searchable = [
    submission.submissionId,
    submission.requestTokenId ?? '',
    submission.accessCodeId ?? '',
    submission.submittedByName ?? '',
    submission.submittedByEmail ?? '',
    getExternalSubmissionActor(submission),
    getExternalSubmissionTitle(submission),
    ...getExternalSubmissionSystemNames(submission),
    ...Object.values(submission.rawPayloadSnapshot).map((value) =>
      typeof value === 'string'
        ? value
        : Array.isArray(value)
          ? value.join(' ')
          : '',
    ),
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes(query);
}

export const externalSubmissionService = {
  async getById(
    registerId: string,
    submissionId: string | null | undefined,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<ExternalSubmission | null> {
    const normalizedSubmissionId = normalizeOptionalText(submissionId);
    if (!normalizedSubmissionId) {
      return null;
    }

    const resolved = await resolveScopeContext(scopeContext);
    if (resolved.scopeContext.kind === 'workspace') {
      const payload = await authFetchJson<{
        submission?: ExternalSubmission | null;
      }>(
        `/api/workspaces/${resolved.scopeContext.workspaceId}/external-submissions/${normalizedSubmissionId}?registerId=${encodeURIComponent(registerId)}`,
      );
      return payload.submission ? parseExternalSubmission(payload.submission) : null;
    }

    const payload = await authFetchJson<{
      submission?: ExternalSubmission | null;
    }>(
      `/api/registers/${encodeURIComponent(registerId)}/external-submissions/${encodeURIComponent(normalizedSubmissionId)}`,
    );
    return payload.submission ? parseExternalSubmission(payload.submission) : null;
  },

  async list(
    registerId: string,
    filters: ExternalSubmissionFilters = {},
    scopeContext?: RegisterScopeContext | null,
  ): Promise<ExternalSubmission[]> {
    const resolved = await resolveScopeContext(scopeContext);
    if (resolved.scopeContext.kind === 'workspace') {
      const searchParams = new URLSearchParams();
      searchParams.set('registerId', registerId);
      if (filters.status && filters.status !== 'all') {
        searchParams.set('status', filters.status);
      }
      if (filters.sourceType && filters.sourceType !== 'all') {
        searchParams.set('sourceType', filters.sourceType);
      }
      if (filters.searchText?.trim()) {
        searchParams.set('searchText', filters.searchText.trim());
      }

      const payload = await authFetchJson<{
        submissions: ExternalSubmission[];
      }>(
        `/api/workspaces/${resolved.scopeContext.workspaceId}/external-submissions?${searchParams.toString()}`,
      );

      return payload.submissions.map((submission) =>
        parseExternalSubmission(submission),
      );
    }

    const searchParams = new URLSearchParams();
    if (filters.status && filters.status !== 'all') {
      searchParams.set('status', filters.status);
    }
    if (filters.sourceType && filters.sourceType !== 'all') {
      searchParams.set('sourceType', filters.sourceType);
    }
    if (filters.searchText?.trim()) {
      searchParams.set('searchText', filters.searchText.trim());
    }

    const payload = await authFetchJson<{
      submissions: ExternalSubmission[];
    }>(
      `/api/registers/${encodeURIComponent(registerId)}/external-submissions?${searchParams.toString()}`,
    );

    return payload.submissions
      .map((submission) => parseExternalSubmission(submission))
      .filter((submission) => matchesFilters(submission, filters));
  },

  async countOpen(
    registerId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<number> {
    const submissions = await this.list(
      registerId,
      { status: 'submitted' },
      scopeContext,
    );
    return submissions.length;
  },

  async findRelatedToUseCase(
    input: FindRelatedExternalSubmissionInput,
  ): Promise<ExternalSubmission | null> {
    const directMatch = await this.getById(
      input.registerId,
      input.submissionId,
      input.scopeContext,
    );
    if (directMatch) {
      return directMatch;
    }

    const resolved = await resolveScopeContext(input.scopeContext);
    if (resolved.scopeContext.kind === 'workspace') {
      const searchParams = new URLSearchParams({
        linkedUseCaseId: input.useCaseId,
        registerId: input.registerId,
      });
      const payload = await authFetchJson<{
        submissions: ExternalSubmission[];
      }>(
        `/api/workspaces/${resolved.scopeContext.workspaceId}/external-submissions?${searchParams.toString()}`,
      );
      return payload.submissions[0]
        ? parseExternalSubmission(payload.submissions[0])
        : null;
    }

    const searchParams = new URLSearchParams({
      linkedUseCaseId: input.useCaseId,
    });
    const payload = await authFetchJson<{
      submissions: ExternalSubmission[];
    }>(
      `/api/registers/${encodeURIComponent(input.registerId)}/external-submissions?${searchParams.toString()}`,
    );
    return payload.submissions[0]
      ? parseExternalSubmission(payload.submissions[0])
      : null;
  },

  async review(
    input: ReviewExternalSubmissionInput,
  ): Promise<ExternalSubmission> {
    const resolved = await resolveScopeContext(input.scopeContext);
    const reviewNote = normalizeOptionalText(input.note);
    if (resolved.scopeContext.kind === 'workspace') {
      const payload = await authFetchJson<{
        submission: ExternalSubmission;
      }>(
        `/api/workspaces/${resolved.scopeContext.workspaceId}/external-submissions/${input.submissionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            action: input.action,
            registerId: input.registerId,
            ...(reviewNote ? { note: reviewNote } : {}),
          }),
        },
      );
      return parseExternalSubmission(payload.submission);
    }

    const payload = await authFetchJson<{
      submission: ExternalSubmission;
    }>(
      `/api/registers/${encodeURIComponent(input.registerId)}/external-submissions/${encodeURIComponent(input.submissionId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          action: input.action,
          ...(reviewNote ? { note: reviewNote } : {}),
        }),
      },
    );
    return parseExternalSubmission(payload.submission);
  },
};
