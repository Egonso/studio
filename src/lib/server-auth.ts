import '@/lib/server-only-guard';

import type { DecodedIdToken } from "firebase-admin/auth";

import { isAdminEmail } from "@/lib/admin-config";
import { normalizeWorkspaceRole } from "@/lib/enterprise/workspace";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  buildWorkspaceAccessState,
  hasWorkspaceAccess,
  hasWorkspaceRole,
  type ResolvedWorkspaceRole,
  type WorkspaceAccessProfile,
  type WorkspaceAccessState,
} from "@/lib/server-access";
import type { Register } from "@/lib/register-first/types";

export class ServerAuthError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ServerAuthError";
    this.status = status;
  }
}

const DEFAULT_SESSION_MAX_AGE_HOURS = 12;

interface SessionValidationOptions {
  enforceSessionAge?: boolean;
}

function resolveSessionMaxAgeMs(): number {
  const raw = process.env.AUTH_SESSION_MAX_AGE_HOURS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SESSION_MAX_AGE_HOURS;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;
  }

  return parsed * 60 * 60 * 1000;
}

function requireResourceId(
  value: string,
  label: string
): string {
  const normalized = value.trim();
  if (!normalized || normalized.includes("/")) {
    throw new ServerAuthError(`${label} is invalid.`, 400);
  }
  return normalized;
}

function normalizeBearerToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim() || null;
  }

  return trimmed;
}

function isFirebaseAuthProjectPermissionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : '';
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : '';
  const lowered = message.toLowerCase();
  const loweredCode = code.toLowerCase();

  return (
    message.includes('serviceusage.services.use') ||
    message.includes('identitytoolkit.googleapis.com') ||
    message.includes('USER_PROJECT_DENIED') ||
    loweredCode.includes('permission-denied') ||
    loweredCode.includes('insufficient-permission') ||
    loweredCode.includes('auth/insufficient-permission') ||
    lowered.includes('the caller does not have permission') ||
    lowered.includes('permission denied') ||
    lowered.includes('permission_denied') ||
    lowered.includes('insufficient permission') ||
    lowered.includes('insufficient authentication scopes') ||
    lowered.includes('firebaseauth.users.get') ||
    lowered.includes('firebaseauth.configs.gethashconfig')
  );
}

export async function verifyFirebaseToken(
  token: string | null | undefined,
  options: SessionValidationOptions = {},
): Promise<DecodedIdToken & { email: string }> {
  const idToken = normalizeBearerToken(token);
  if (!idToken) {
    throw new ServerAuthError("Authentication required.", 401);
  }

  const auth = getAdminAuth();
  let decoded: DecodedIdToken;

  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch (error) {
    if (!isFirebaseAuthProjectPermissionError(error)) {
      throw error;
    }

    console.warn(
      'Firebase token revocation check skipped due to project permission limits:',
      error,
    );
    decoded = await auth.verifyIdToken(idToken, false);
  }

  let email = decoded.email?.toLowerCase();
  let emailVerified = decoded.email_verified === true;

  try {
    const userRecord = await auth.getUser(decoded.uid);
    email = userRecord.email?.toLowerCase() ?? email;
    emailVerified = userRecord.emailVerified === true || emailVerified;
  } catch (error) {
    if (!isFirebaseAuthProjectPermissionError(error)) {
      throw error;
    }

    console.warn(
      'Firebase Auth user lookup skipped due to project permission limits:',
      error,
    );
  }

  if (!email) {
    throw new ServerAuthError("Authenticated user must have an email.", 403);
  }

  if (!emailVerified) {
    throw new ServerAuthError(
      'Please verify your email address before continuing.',
      403,
    );
  }

  if (options.enforceSessionAge !== false) {
    const authTimeMs =
      typeof decoded.auth_time === 'number' ? decoded.auth_time * 1000 : null;
    if (!authTimeMs) {
      throw new ServerAuthError('Session metadata is missing. Please sign in again.', 401);
    }

    if (Date.now() - authTimeMs > resolveSessionMaxAgeMs()) {
      throw new ServerAuthError('Session expired. Please sign in again.', 401);
    }
  }

  return {
    ...decoded,
    email,
  };
}

export async function verifyAdminToken(
  token: string | null | undefined
): Promise<DecodedIdToken & { email: string }> {
  const decoded = await verifyFirebaseToken(token);
  if (!isAdminEmail(decoded.email)) {
    throw new ServerAuthError("Admin access denied.", 403);
  }
  return decoded;
}

export interface AuthenticatedRequestUser
  extends DecodedIdToken,
    Record<string, unknown> {
  email: string;
}

export interface WorkspaceAuthorizationResult {
  user: AuthenticatedRequestUser;
  orgId: string;
  role: ResolvedWorkspaceRole;
  profile: WorkspaceAccessProfile | null;
  access: WorkspaceAccessState;
}

export interface RegisterAuthorizationResult {
  user: AuthenticatedRequestUser;
  registerId: string;
  register: Register;
}

async function getUserProfile(
  userId: string
): Promise<WorkspaceAccessProfile | null> {
  const snapshot = await getAdminDb().collection("users").doc(userId).get();
  return snapshot.exists ? ((snapshot.data() as WorkspaceAccessProfile) ?? null) : null;
}

async function getWorkspaceRoleFromWorkspaceDoc(
  userId: string,
  orgId: string,
): Promise<ResolvedWorkspaceRole | null> {
  const workspaceSnapshot = await getAdminDb().collection('workspaces').doc(orgId).get();
  if (!workspaceSnapshot.exists) {
    return null;
  }

  const workspaceData = workspaceSnapshot.data() as
    | { ownerUserId?: string | null }
    | undefined;

  if (workspaceData?.ownerUserId === userId) {
    return 'OWNER';
  }

  const memberSnapshot = await getAdminDb()
    .collection('workspaces')
    .doc(orgId)
    .collection('members')
    .doc(userId)
    .get();

  if (!memberSnapshot.exists) {
    return null;
  }

  const memberData = memberSnapshot.data() as { role?: string | null } | undefined;
  const role = normalizeWorkspaceRole(memberData?.role);
  return role === 'OWNER' ? 'ADMIN' : role;
}

export async function requireUser(
  token: string | null | undefined,
  options: SessionValidationOptions = {},
): Promise<AuthenticatedRequestUser> {
  return verifyFirebaseToken(token, options);
}

export async function requireAdmin(
  token: string | null | undefined
): Promise<AuthenticatedRequestUser> {
  return verifyAdminToken(token);
}

export async function requireWorkspaceMember(
  token: string | null | undefined,
  orgId: string,
  allowedRoles?: ResolvedWorkspaceRole[],
  options: SessionValidationOptions = {},
): Promise<WorkspaceAuthorizationResult> {
  const normalizedOrgId = requireResourceId(orgId, "orgId");
  const user = await requireUser(token, options);
  const profile = await getUserProfile(user.uid);
  const access = buildWorkspaceAccessState(user.uid, profile);
  const workspaceDocRole = await getWorkspaceRoleFromWorkspaceDoc(
    user.uid,
    normalizedOrgId,
  );

  if (workspaceDocRole) {
    if (allowedRoles && !allowedRoles.includes(workspaceDocRole)) {
      throw new ServerAuthError("Workspace role is not sufficient.", 403);
    }

    return {
      user,
      orgId: normalizedOrgId,
      role: workspaceDocRole,
      profile,
      access,
    };
  }

  if (!hasWorkspaceAccess(access, normalizedOrgId)) {
    throw new ServerAuthError("Workspace access denied.", 403);
  }

  const role = access.rolesByOrg[normalizedOrgId];
  if (!role) {
    throw new ServerAuthError("Workspace access denied.", 403);
  }

  if (allowedRoles && !hasWorkspaceRole(access, normalizedOrgId, allowedRoles)) {
    throw new ServerAuthError("Workspace role is not sufficient.", 403);
  }

  return {
    user,
    orgId: normalizedOrgId,
    role,
    profile,
    access,
  };
}

export async function requireWorkspaceAdmin(
  token: string | null | undefined,
  orgId: string
): Promise<WorkspaceAuthorizationResult> {
  return requireWorkspaceMember(token, orgId, ["OWNER", "ADMIN"]);
}

export async function requireWorkspaceReviewer(
  token: string | null | undefined,
  orgId: string,
): Promise<WorkspaceAuthorizationResult> {
  return requireWorkspaceMember(token, orgId, [
    'OWNER',
    'ADMIN',
    'REVIEWER',
    'EXTERNAL_OFFICER',
  ]);
}

export async function requireRegisterOwner(
  token: string | null | undefined,
  registerId: string
): Promise<RegisterAuthorizationResult> {
  const normalizedRegisterId = requireResourceId(registerId, "registerId");
  const user = await requireUser(token);
  const snapshot = await getAdminDb()
    .doc(`users/${user.uid}/registers/${normalizedRegisterId}`)
    .get();
  const data = snapshot.data() as Register | undefined;

  if (!snapshot.exists || !data || data.isDeleted === true) {
    throw new ServerAuthError("Register not found.", 404);
  }

  return {
    user,
    registerId: normalizedRegisterId,
    register: data,
  };
}
