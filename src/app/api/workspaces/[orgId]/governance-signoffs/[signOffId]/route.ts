import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import {
  applyGovernanceSignOffDecision,
  type GovernanceSignOffRecord,
} from '@/lib/enterprise/governance-signoff';
import { ServerAuthError, requireWorkspaceReviewer } from '@/lib/server-auth';

const DecideGovernanceSignOffSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ orgId: string; signOffId: string }>;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Sign-off-Entscheidung.' },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message === 'APPROVAL_ROLE_NOT_ALLOWED') {
    return NextResponse.json(
      { error: 'Ihre Workspace-Rolle darf diesen Governance-Sign-off nicht entscheiden.' },
      { status: 403 },
    );
  }

  console.error('Governance sign-off decision failed:', error);
  return NextResponse.json(
    { error: 'Governance-Sign-off konnte nicht aktualisiert werden.' },
    { status: 500 },
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { orgId, signOffId } = await context.params;

  try {
    const authorization = await requireWorkspaceReviewer(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = DecideGovernanceSignOffSchema.parse(await req.json());
    const signOffRef = db
      .collection('workspaces')
      .doc(orgId)
      .collection('governanceSignOffs')
      .doc(signOffId);
    const snapshot = await signOffRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: 'Governance-Sign-off nicht gefunden.' },
        { status: 404 },
      );
    }

    const updated = applyGovernanceSignOffDecision({
      signOff: snapshot.data() as GovernanceSignOffRecord,
      actorRole: authorization.role,
      actorUserId: authorization.user.uid,
      decision: payload.decision,
      note: payload.note,
    });

    await signOffRef.set(updated, { merge: false });
    return NextResponse.json({ success: true, signOff: updated });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
