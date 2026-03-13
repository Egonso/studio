import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import { listWorkspaceRegisters } from '@/lib/register-first/register-admin';
import { ServerAuthError, requireWorkspaceMember } from '@/lib/server-auth';
import type { ExternalSubmission } from '@/lib/register-first/types';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Workspace external submissions route failed:', error);
  return NextResponse.json(
    { error: 'Externe Einreichungen konnten nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    await requireWorkspaceMember(req.headers.get('authorization'), orgId);
    const statusFilter = req.nextUrl.searchParams.get('status');
    const sourceTypeFilter = req.nextUrl.searchParams.get('sourceType');
    const registerIdFilter = req.nextUrl.searchParams.get('registerId');
    const linkedUseCaseIdFilter =
      req.nextUrl.searchParams.get('linkedUseCaseId');
    const searchText = req.nextUrl.searchParams
      .get('searchText')
      ?.trim()
      .toLowerCase();
    const registers = await listWorkspaceRegisters(orgId);

    const nestedResults = await Promise.all(
      registers.map(async (location) => {
        if (
          registerIdFilter &&
          registerIdFilter.trim().length > 0 &&
          location.registerId !== registerIdFilter
        ) {
          return [];
        }

        const snapshot = await db
          .doc(`users/${location.ownerId}/registers/${location.registerId}`)
          .collection('externalSubmissions')
          .get();

        return snapshot.docs.map((document) => ({
          ...(document.data() as ExternalSubmission),
          registerName: location.register.name,
          organisationName: location.register.organisationName ?? null,
        }));
      }),
    );

    const submissions = nestedResults
      .flat()
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
      .filter((entry) => {
        if (!searchText) {
          return true;
        }

        const searchable = [
          entry.submissionId,
          entry.requestTokenId ?? '',
          entry.accessCodeId ?? '',
          entry.submittedByName ?? '',
          entry.submittedByEmail ?? '',
          entry.registerName ?? '',
          entry.organisationName ?? '',
          ...Object.values(entry.rawPayloadSnapshot).map((value) =>
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
      })
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));

    return NextResponse.json({
      submissions,
      registerCount: registers.length,
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
