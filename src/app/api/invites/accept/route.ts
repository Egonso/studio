import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/firebase-admin";
import {
  AuthenticatedIdentityError,
  assertAuthenticatedIdentity,
} from "@/lib/server-access";
import { ServerAuthError, requireUser } from "@/lib/server-auth";
import {
  ensureWorkspaceRecord,
  syncUserWorkspaceAccess,
  upsertWorkspaceMemberRecord,
} from '@/lib/workspace-admin';

const AcceptInviteSchema = z.object({
  userId: z.string().trim().min(1).regex(/^[^/]+$/),
  email: z.string().email(),
  workspaceInvite: z.string().trim().regex(/^[^/]+$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = AcceptInviteSchema.parse(await request.json());
    const actor = await requireUser(request.headers.get("authorization"));
    assertAuthenticatedIdentity(actor, {
      userId: payload.userId,
      email: payload.email,
    });

    const normalizedEmail = payload.email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const userRef = db.collection("users").doc(payload.userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};

    let inviteDocs: any[] = [];

    if (payload.workspaceInvite) {
      const singleInvite = await db
        .collection("pendingWorkspaceInvites")
        .doc(payload.workspaceInvite)
        .get();
      if (
        singleInvite.exists &&
        singleInvite.data()?.status === "pending" &&
        String(singleInvite.data()?.email ?? "").toLowerCase() === normalizedEmail &&
        String(singleInvite.data()?.expiresAt ?? nowIso) > nowIso
      ) {
        inviteDocs = [singleInvite];
      }
    } else {
      const invitesSnap = await db
        .collection("pendingWorkspaceInvites")
        .where("email", "==", normalizedEmail)
        .where("status", "==", "pending")
        .where("expiresAt", ">", nowIso)
        .get();
      inviteDocs = invitesSnap.docs;
    }

    if (inviteDocs.length === 0) {
      return NextResponse.json({ success: true, applied: 0 });
    }

    for (const inviteDoc of inviteDocs) {
      const invite = inviteDoc.data();
      if (!invite?.targetOrgId) continue;
      const orgName = invite.targetOrgName || 'KI-Register Workspace';
      await ensureWorkspaceRecord({
        orgId: invite.targetOrgId,
        name: orgName,
        ownerUserId: invite.targetOrgId,
        plan: 'enterprise',
      });
      await syncUserWorkspaceAccess({
        userId: payload.userId,
        email: normalizedEmail,
        orgId: invite.targetOrgId,
        orgName,
        role: invite.role || 'MEMBER',
      });
      await upsertWorkspaceMemberRecord({
        orgId: invite.targetOrgId,
        orgName,
        userId: payload.userId,
        email: normalizedEmail,
        role: invite.role || 'MEMBER',
        displayName:
          typeof userData.displayName === 'string'
            ? userData.displayName
            : typeof userData.name === 'string'
              ? userData.name
              : null,
        source: 'invite',
        invitedByUserId:
          typeof invite.createdByUserId === 'string'
            ? invite.createdByUserId
            : null,
      });

      await inviteDoc.ref.update({
        status: "accepted",
        acceptedAt: nowIso,
        acceptedByUserId: payload.userId,
        acceptedByEmail: normalizedEmail,
      });
    }

    await userRef.set(
      {
        email: normalizedEmail,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      applied: inviteDocs.length,
    });
  } catch (error: any) {
    console.error("Invite accept error:", error);

    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof AuthenticatedIdentityError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Ungültige Eingaben." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Einladung konnte nicht übernommen werden." },
      { status: 500 }
    );
  }
}
