import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const inviteRoute = readSource("src/app/api/invites/route.ts");
const inviteAcceptRoute = readSource("src/app/api/invites/accept/route.ts");
const publicInfoCheckRoute = readSource("src/app/api/tools/public-info-check/route.ts");
const draftAssessmentRoute = readSource("src/app/api/draft-assessment/route.ts");
const complianceCheckRoute = readSource("src/app/api/check-tool-compliance/route.ts");
const workspaceMembersRoute = readSource("src/app/api/workspaces/[orgId]/members/route.ts");
const workspaceMemberItemRoute = readSource("src/app/api/workspaces/[orgId]/members/[memberId]/route.ts");
const workspaceSettingsRoute = readSource("src/app/api/workspaces/[orgId]/settings/route.ts");
const workspaceAuditExportRoute = readSource("src/app/api/workspaces/[orgId]/audit-export/route.ts");
const workspaceNotificationsRoute = readSource("src/app/api/workspaces/[orgId]/notifications/dispatch/route.ts");
const workspaceSignOffsRoute = readSource("src/app/api/workspaces/[orgId]/governance-signoffs/route.ts");
const workspaceSignOffItemRoute = readSource("src/app/api/workspaces/[orgId]/governance-signoffs/[signOffId]/route.ts");
const workspaceExternalSubmissionsRoute = readSource("src/app/api/workspaces/[orgId]/external-submissions/route.ts");
const workspaceExternalSubmissionItemRoute = readSource("src/app/api/workspaces/[orgId]/external-submissions/[submissionId]/route.ts");

test("invite creation route requires workspace-admin authorization", () => {
  assert.match(inviteRoute, /requireWorkspaceAdmin\(/);
  assert.match(inviteRoute, /const authorizationHeader = req\.headers\.get\("authorization"\);/);
});

test("invite acceptance route requires auth and identity match", () => {
  assert.match(inviteAcceptRoute, /requireUser\(request\.headers\.get\("authorization"\)\)/);
  assert.match(inviteAcceptRoute, /assertAuthenticatedIdentity\(actor, \{/);
  assert.match(inviteAcceptRoute, /error instanceof AuthenticatedIdentityError/);
});

test("internal compliance helper routes require authenticated users", () => {
  assert.match(publicInfoCheckRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
  assert.match(draftAssessmentRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
  assert.match(complianceCheckRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
});

test("workspace enterprise routes enforce member, admin, and reviewer auth on the server", () => {
  assert.match(workspaceMembersRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceMemberItemRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSettingsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceSettingsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceAuditExportRoute, /requireWorkspaceReviewer\(/);
  assert.match(workspaceNotificationsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSignOffsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceSignOffsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSignOffItemRoute, /requireWorkspaceReviewer\(/);
  assert.match(workspaceExternalSubmissionsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceExternalSubmissionItemRoute, /requireWorkspaceReviewer\(/);
});
