import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import {
  ServerAuthError,
  requireRegisterOwner,
} from '@/lib/server-auth';
import { parseExternalSubmission } from '@/lib/register-first/schema';
import type { ExternalSubmission } from '@/lib/register-first/types';

type ExternalSubmissionListEntry = ExternalSubmission & {
  organisationName: string | null;
  registerName: string;
};

interface RouteContext {
  params: Promise<{ registerId: string }>;
}

function handleRegisterRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Register external submissions route failed:', error);
  return NextResponse.json(
    { error: 'Externe Einreichungen konnten nicht geladen werden.' },
    { status: 500 },
  );
}

function matchesSearch(
  submission: ExternalSubmissionListEntry,
  searchText: string | null,
): boolean {
  if (!searchText) {
    return true;
  }

  const searchable = [
    submission.submissionId,
    submission.requestTokenId ?? '',
    submission.accessCodeId ?? '',
    submission.submittedByName ?? '',
    submission.submittedByEmail ?? '',
    submission.registerName ?? '',
    submission.organisationName ?? '',
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

  return searchable.includes(searchText);
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { registerId } = await context.params;

  try {
    const authorization = await requireRegisterOwner(
      req.headers.get('authorization'),
      registerId,
    );
    const statusFilter = req.nextUrl.searchParams.get('status');
    const sourceTypeFilter = req.nextUrl.searchParams.get('sourceType');
    const linkedUseCaseIdFilter =
      req.nextUrl.searchParams.get('linkedUseCaseId');
    const searchText = req.nextUrl.searchParams
      .get('searchText')
      ?.trim()
      .toLowerCase();

    const snapshot = await db
      .doc(`users/${authorization.user.uid}/registers/${registerId}`)
      .collection('externalSubmissions')
      .get();

    const submissions = snapshot.docs
      .map((document) => {
        try {
          return {
            ...parseExternalSubmission(document.data()),
            registerName: authorization.register.name,
            organisationName: authorization.register.organisationName ?? null,
          };
        } catch (error) {
          console.warn('Skipping invalid register external submission', {
            registerId,
            documentId: document.id,
            error,
          });
          return null;
        }
      })
      .filter(
        (
          entry,
        ): entry is ExternalSubmissionListEntry => entry !== null,
      )
      .filter((entry) =>
        statusFilter ? entry.status === statusFilter : true,
      )
      .filter((entry) =>
        sourceTypeFilter ? entry.sourceType === sourceTypeFilter : true,
      )
      .filter((entry) =>
        linkedUseCaseIdFilter
          ? entry.linkedUseCaseId === linkedUseCaseIdFilter
          : true,
      )
      .filter((entry) => matchesSearch(entry, searchText ?? null))
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));

    return NextResponse.json({
      submissions,
      registerId,
    });
  } catch (error) {
    return handleRegisterRouteError(error);
  }
}
