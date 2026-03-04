import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { getPublicAppOrigin } from "@/lib/app-url";

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EXTERNAL_OFFICER", "ADMIN", "MEMBER"]),
  targetOrgId: z.string().min(1),
  targetOrgName: z.string().min(1),
});

function buildWorkspaceInviteLink(email: string, inviteId: string): string {
  const query = new URLSearchParams({
    mode: "signup",
    email,
    workspaceInvite: inviteId,
  });
  return `${getPublicAppOrigin()}/login?${query.toString()}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = InviteSchema.parse(await req.json());
    const normalizedEmail = payload.email.trim().toLowerCase();

    const usersSnap = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    // Existing user: grant access directly.
    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data();
      const currentWorkspaces = Array.isArray(userData.workspaces) ? userData.workspaces : [];
      const isAlreadyMember = currentWorkspaces.some(
        (ws: any) => ws?.orgId === payload.targetOrgId
      );

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: "Benutzer ist bereits Mitglied dieses Workspaces." },
          { status: 400 }
        );
      }

      const newWorkspace = {
        orgId: payload.targetOrgId,
        orgName: payload.targetOrgName,
        role: payload.role,
      };

      await userDoc.ref.update({
        workspaces: [...currentWorkspaces, newWorkspace],
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

    // New user: create pending invite + shareable signup link.
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ??
            "Ungültige Eingabe. Erwartet: email, role, targetOrgId, targetOrgName.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
