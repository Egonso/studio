import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import {
  createGovernanceSignOffRecord,
} from '@/lib/enterprise/governance-signoff';
import { deliverWorkspaceNotificationHooks } from '@/lib/enterprise/notifications';
import { getWorkspaceRecord } from '@/lib/workspace-admin';
import {
  ServerAuthError,
  requireWorkspaceAdmin,
  requireWorkspaceMember,
} from '@/lib/server-auth';

const CreateGovernanceSignOffSchema = z.object({
  summary: z.string().trim().max(240).optional(),
});

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltiger Sign-off-Request.' },
      { status: 400 },
    );
  }

  console.error('Governance sign-off route failed:', error);
  return NextResponse.json(
    { error: 'Governance-Sign-offs konnten nicht verarbeitet werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    await requireWorkspaceMember(req.headers.get('authorization'), orgId);
    const snapshot = await db
      .collection('workspaces')
      .doc(orgId)
      .collection('governanceSignOffs')
      .orderBy('requestedAt', 'desc')
      .get();

    return NextResponse.json({
      signOffs: snapshot.docs.map((doc) => doc.data()),
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceAdmin(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = CreateGovernanceSignOffSchema.parse(await req.json());
    const workspace = await getWorkspaceRecord(orgId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace nicht gefunden.' },
        { status: 404 },
      );
    }

    const signOff = createGovernanceSignOffRecord({
      workspaceId: orgId,
      settings: workspace.enterpriseSettings,
      requestedByUserId: authorization.user.uid,
      requestedByEmail: authorization.user.email,
      summary: payload.summary,
    });

    await db
      .collection('workspaces')
      .doc(orgId)
      .collection('governanceSignOffs')
      .doc(signOff.signOffId)
      .set(signOff, { merge: false });

    if (signOff.status === 'pending') {
      await deliverWorkspaceNotificationHooks({
        workspaceId: orgId,
        eventType: 'approval_needed',
        eventId: signOff.signOffId,
        data: {
          kind: 'governance_signoff',
          summary: signOff.summary,
          requestedByUserId: signOff.requestedByUserId,
          requiredRoles: signOff.approvalWorkflow?.requiredRoles ?? [],
        },
      });
    }

    return NextResponse.json({ success: true, signOff }, { status: 201 });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
