import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";

const AcceptInviteSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  workspaceInvite: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = AcceptInviteSchema.parse(await request.json());
    const normalizedEmail = payload.email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const userRef = db.collection("users").doc(payload.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Benutzerprofil nicht gefunden." }, { status: 404 });
    }

    const userData = userSnap.data() ?? {};
    const userWorkspaces = Array.isArray(userData.workspaces) ? userData.workspaces : [];

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
        inviteDocs = [singleInvite as any];
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

    const workspaceByOrg = new Map<string, any>();
    for (const workspace of userWorkspaces) {
      if (workspace?.orgId) {
        workspaceByOrg.set(workspace.orgId, workspace);
      }
    }

    for (const inviteDoc of inviteDocs) {
      const invite = inviteDoc.data();
      if (!invite?.targetOrgId) continue;

      if (!workspaceByOrg.has(invite.targetOrgId)) {
        workspaceByOrg.set(invite.targetOrgId, {
          orgId: invite.targetOrgId,
          orgName: invite.targetOrgName || "KI-Register Workspace",
          role: invite.role || "MEMBER",
        });
      }

      await inviteDoc.ref.update({
        status: "accepted",
        acceptedAt: nowIso,
        acceptedByUserId: payload.userId,
      });
    }

    await userRef.set(
      {
        workspaces: Array.from(workspaceByOrg.values()),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      applied: inviteDocs.length,
    });
  } catch (error: any) {
    console.error("Invite accept error:", error);

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
