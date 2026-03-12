import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/firebase-admin";
import {
  ensureWorkspaceRecord,
  syncUserWorkspaceAccess,
  upsertWorkspaceMemberRecord,
} from "@/lib/workspace-admin";
import { getPublicAppOrigin } from "@/lib/app-url";
import { buildLoginPath } from "@/lib/auth/login-routing";
import {
  buildWorkspaceAccessState,
} from "@/lib/server-access";
import {
  ServerAuthError,
  requireWorkspaceAdmin,
} from "@/lib/server-auth";

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EXTERNAL_OFFICER", "ADMIN", "REVIEWER", "MEMBER"]),
  targetOrgId: z.string().trim().min(1).regex(/^[^/]+$/),
  targetOrgName: z.string().trim().min(1),
});

function buildWorkspaceInviteLink(email: string, inviteId: string): string {
  return `${getPublicAppOrigin()}${buildLoginPath({
    mode: "signup",
    email,
    workspaceInvite: inviteId,
  })}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = InviteSchema.parse(await req.json());
    const normalizedEmail = payload.email.trim().toLowerCase();
    const authorizationHeader = req.headers.get("authorization");
    const actor = await requireWorkspaceAdmin(
      authorizationHeader,
      payload.targetOrgId
    );
    await ensureWorkspaceRecord({
      orgId: payload.targetOrgId,
      name: payload.targetOrgName,
      ownerUserId: payload.targetOrgId === actor.user.uid
        ? actor.user.uid
        : actor.user.uid,
      plan: 'enterprise',
    });

    const usersSnap = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data();
      const currentAccess = buildWorkspaceAccessState(userDoc.id, userData);
      if (currentAccess.orgIds.includes(payload.targetOrgId)) {
        return NextResponse.json(
          { error: "Benutzer ist bereits Mitglied dieses Workspaces." },
          { status: 400 }
        );
      }

      await syncUserWorkspaceAccess({
        userId: userDoc.id,
        email: normalizedEmail,
        orgId: payload.targetOrgId,
        orgName: payload.targetOrgName,
        role: payload.role,
      });
      await upsertWorkspaceMemberRecord({
        orgId: payload.targetOrgId,
        orgName: payload.targetOrgName,
        userId: userDoc.id,
        email: normalizedEmail,
        role: payload.role,
        displayName:
          typeof userData.displayName === 'string'
            ? userData.displayName
            : typeof userData.name === 'string'
              ? userData.name
              : null,
        source: 'direct',
        invitedByUserId: actor.user.uid,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Erfolgreich als ${payload.role} eingeladen. Zugriff wurde direkt freigeschaltet.`,
          mode: "direct",
        },
        { status: 200 }
      );
    }

    const inviteRef = db.collection("pendingWorkspaceInvites").doc();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await inviteRef.set({
      inviteId: inviteRef.id,
      email: normalizedEmail,
      role: payload.role,
      targetOrgId: payload.targetOrgId,
      targetOrgName: payload.targetOrgName,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdByUserId: actor.user.uid,
      createdByEmail: actor.user.email,
    });

    const inviteLink = buildWorkspaceInviteLink(normalizedEmail, inviteRef.id);

    return NextResponse.json(
      {
        success: true,
        mode: "pending",
        inviteLink,
        inviteId: inviteRef.id,
        message:
          "Einladung erstellt. Der Nutzer kann sich über den Link registrieren und wird danach automatisch dem Workspace hinzugefügt.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending invite:", error);

    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Ungültige Eingabe. Erwartet: email, role, targetOrgId, targetOrgName.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
