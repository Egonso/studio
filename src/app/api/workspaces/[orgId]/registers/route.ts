import { NextResponse } from 'next/server';

import { listWorkspaceRegisters } from '@/lib/register-first/register-admin';
import { requireWorkspaceMember, ServerAuthError } from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{
    orgId: string;
  }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { orgId } = await context.params;
    const authorizationHeader = req.headers.get('authorization');

    await requireWorkspaceMember(authorizationHeader, orgId);

    const locations = await listWorkspaceRegisters(orgId);
    const registers = locations.map((location) => ({
      ...location.register,
      ownerId: location.ownerId,
      registerId: location.registerId,
    }));

    return NextResponse.json({
      registers,
    });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('workspace_registers_list_failed', error);
    return NextResponse.json(
      { error: 'Workspace-Register konnten nicht geladen werden.' },
      { status: 500 },
    );
  }
}
