import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { deliverWorkspaceNotificationHooks } from '@/lib/enterprise/notifications';
import { ServerAuthError, requireWorkspaceAdmin } from '@/lib/server-auth';

const DispatchSchema = z.object({
  eventType: z.enum(['submission_received', 'review_due', 'approval_needed']),
  data: z.record(z.string(), z.unknown()).optional(),
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
      { error: error.issues[0]?.message ?? 'Ungueltiger Webhook-Dispatch.' },
      { status: 400 },
    );
  }

  console.error('Workspace notification dispatch failed:', error);
  return NextResponse.json(
    { error: 'Notification-Hooks konnten nicht ausgeliefert werden.' },
    { status: 500 },
  );
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceAdmin(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = DispatchSchema.parse(await req.json());

    await deliverWorkspaceNotificationHooks({
      workspaceId: orgId,
      eventType: payload.eventType,
      eventId: `manual_${payload.eventType}_${Date.now()}`,
      data: {
        ...(payload.data ?? {}),
        triggeredByUserId: authorization.user.uid,
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
