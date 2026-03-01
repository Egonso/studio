import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { email, role, targetOrgId, targetOrgName } = await req.json();

        if (!email || !role || !targetOrgId || !targetOrgName) {
            return NextResponse.json({ error: "Missing required fields: email, role, targetOrgId, targetOrgName" }, { status: 400 });
        }

        if (role !== "EXTERNAL_OFFICER" && role !== "ADMIN" && role !== "MEMBER") {
            return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
        }

        // Find the user by email (we assume they already have an account for simplicity in this sprint)
        // Normally we would use Admin Auth SDK `getUserByEmail`, but we can query the `users` collection too if sync is setup
        // For a robust approach, we add to their document:
        const usersSnap = await db.collection("users").where("email", "==", email.toLowerCase()).get();

        if (usersSnap.empty) {
            return NextResponse.json({ error: "User with this email not found. They must sign up first." }, { status: 404 });
        }

        const userDoc = usersSnap.docs[0];
        const userData = userDoc.data();

        // Check if membership already exists
        const currentWorkspaces = userData.workspaces || [];
        const isAlreadyMember = currentWorkspaces.some((ws: any) => ws.orgId === targetOrgId);

        if (isAlreadyMember) {
            return NextResponse.json({ error: "Benutzer ist bereits Mitglied dieses Workspaces." }, { status: 400 });
        }

        const newWorkspace = {
            orgId: targetOrgId,
            orgName: targetOrgName,
            role: role
        };

        // Add Workspace Membership to user's profile
        await userDoc.ref.update({
            workspaces: [...currentWorkspaces, newWorkspace]
        });

        return NextResponse.json({ success: true, message: `Erfolgreich als ${role} eingeladen!` }, { status: 200 });
    } catch (error) {
        console.error("Error sending invite:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
