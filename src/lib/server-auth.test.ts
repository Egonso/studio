import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_EMAILS, isAdminEmail } from "@/lib/admin-config";

const serverAuthSource = readFileSync(
  resolve(process.cwd(), "src/lib/server-auth.ts"),
  "utf8"
);

test("server auth exports canonical auth helpers", () => {
  assert.match(serverAuthSource, /export async function requireUser\(/);
  assert.match(serverAuthSource, /export async function requireAdmin\(/);
  assert.match(serverAuthSource, /export async function requireWorkspaceMember\(/);
  assert.match(serverAuthSource, /export async function requireRegisterOwner\(/);
});

test("server auth enforces revocation, verified email, and session age", () => {
  assert.match(serverAuthSource, /verifyIdToken\(idToken, true\)/);
  assert.match(serverAuthSource, /decoded\.email_verified === true/);
  assert.match(serverAuthSource, /isFirebaseAuthProjectPermissionError/);
  assert.match(serverAuthSource, /decoded\.auth_time/);
  assert.match(serverAuthSource, /Session expired\. Please sign in again\./);
});

test("admin allowlist contains only the two canonical admin emails", () => {
  assert.deepEqual(ADMIN_EMAILS, [
    "mo.feich@gmail.com",
    "zoltangal@web.de",
  ]);
  assert.equal(isAdminEmail("mo.feich@gmail.com"), true);
  assert.equal(isAdminEmail("  ZOLTANGAL@WEB.DE "), true);
  assert.equal(isAdminEmail("zoltangal@web.com"), false);
  assert.equal(isAdminEmail("someone@example.com"), false);
});

test("server auth validates path-safe resource identifiers", () => {
  assert.match(serverAuthSource, /function requireResourceId\(/);
  assert.match(serverAuthSource, /normalized\.includes\("\/"\)/);
  assert.match(serverAuthSource, /throw new ServerAuthError\(`\$\{label\} is invalid\.`\, 400\)/);
});

test("workspace authorization resolves against persisted membership state", () => {
  assert.match(serverAuthSource, /const profile = await getUserProfile\(user\.uid\);/);
  assert.match(serverAuthSource, /const access = buildWorkspaceAccessState\(user\.uid, profile\);/);
  assert.match(serverAuthSource, /hasWorkspaceAccess\(access, normalizedOrgId\)/);
});
