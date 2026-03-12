import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import { buildImmutableAuditExport } from '@/lib/enterprise/immutable-audit';
import type { GovernanceSignOffRecord } from '@/lib/enterprise/governance-signoff';
import {
  getWorkspaceRecord,
  listPendingWorkspaceInvites,
  listWorkspaceMembers,
} from '@/lib/workspace-admin';
import { ServerAuthError, requireWorkspaceReviewer } from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Workspace audit export failed:', error);
  return NextResponse.json(
    { error: 'Audit-Export konnte nicht erzeugt werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    await requireWorkspaceReviewer(req.headers.get('authorization'), orgId);
    const [workspace, members, pendingInvites, signOffSnapshot] = await Promise.all([
      getWorkspaceRecord(orgId),
      listWorkspaceMembers(orgId),
      listPendingWorkspaceInvites(orgId),
      db
        .collection('workspaces')
        .doc(orgId)
        .collection('governanceSignOffs')
        .get(),
    ]);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace nicht gefunden.' },
        { status: 404 },
      );
    }

    const exportBundle = buildImmutableAuditExport({
      workspace,
      members,
      pendingInvites,
      signOffs: signOffSnapshot.docs.map(
        (doc) => doc.data() as GovernanceSignOffRecord,
      ),
    });

    return NextResponse.json(exportBundle, {
      headers: {
        'content-disposition': `attachment; filename="immutable-audit-${orgId}.json"`,
      },
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
