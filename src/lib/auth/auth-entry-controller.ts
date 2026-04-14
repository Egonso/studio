import type { Auth, UserCredential } from 'firebase/auth';

import { getPublicAppOrigin } from '@/lib/app-url';
import { buildBillingWelcomePath } from '@/lib/billing/post-checkout';
import { invalidateEntitlementCache } from '@/lib/compliance-engine/capability/useCapability';
import {
  captureException,
  createErrorTrackingPayload,
} from '@/lib/observability/error-tracking';
import { logError, logInfo, logWarn } from '@/lib/observability/logger';
import { getCaptureByCodeErrorCopy } from '@/lib/capture-by-code/error-copy';
import { accessCodeService } from '@/lib/register-first/access-code-service';
import { syncRegisterEntitlement } from '@/lib/register-first/entitlement-client';
import { registerService } from '@/lib/register-first/register-service';
import {
  getActiveRegisterId,
  setActiveRegisterId,
} from '@/lib/register-first/register-settings-client';
import type { Register, SubscriptionPlan } from '@/lib/register-first/types';

import { buildAuthPath, type AuthRouteOptions } from './login-routing';

export type AuthAction = 'login' | 'signup';

export interface AuthEntryContext extends AuthRouteOptions {
  mode: 'login' | 'signup';
  intent: 'create_register' | 'join_register';
}

export interface AuthenticatedActionResult {
  credential: UserCredential;
  syncedPlan: SubscriptionPlan | null;
  syncNeedsRegister: boolean;
  requiresEmailVerification: boolean;
}

export interface JoinCodeValidationSuccess {
  ok: true;
  code: string;
  organisationName: string | null;
  label: string | null;
}

export interface JoinCodeValidationFailure {
  ok: false;
  error: {
    title: string;
    description: string;
  };
}

export type JoinCodeValidationResult =
  | JoinCodeValidationSuccess
  | JoinCodeValidationFailure;

export interface RegisterSetupResult {
  existingRegisterUsed: boolean;
  importedUseCase: boolean;
  inviteCode: string;
  captureLink: string;
  registerId: string;
  syncedPlan: SubscriptionPlan | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

async function guardAuthAttempt(
  action: 'login' | 'signup' | 'password_reset',
  email: string,
): Promise<void> {
  const response = await fetch('/api/auth/attempts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      email: normalizeEmail(email),
    }),
  });

  if (response.ok) {
    return;
  }

  const error = new Error(
    action === 'password_reset'
      ? 'Zu viele Passwort-Reset-Anfragen in kurzer Zeit.'
      : 'Zu viele Anmeldeversuche in kurzer Zeit.',
  ) as Error & { code?: string };

  if (response.status === 429) {
    error.code = 'auth/too-many-requests';
  } else {
    error.code = 'auth/network-request-failed';
  }

  throw error;
}

async function sendVerificationEmail(user: UserCredential['user']): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/auth/email-verification', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Verification email failed with status ${response.status}.`,
    );
  }
}

function encodeCapturePath(code: string): string {
  return `/erfassen?code=${encodeURIComponent(code)}`;
}

function getErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

function selectTargetRegister(registers: Register[]): Register | null {
  if (registers.length === 0) {
    return null;
  }

  const activeRegisterId = getActiveRegisterId();
  return (
    registers.find((register) => register.registerId === activeRegisterId) ??
    registers[0]
  );
}

async function importPublicUseCaseIntoRegister(
  registerId: string,
  importUseCaseId: string,
): Promise<boolean> {
  try {
    const { getFirebaseDb } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const db = await getFirebaseDb();
    const publicSnap = await getDoc(doc(db, 'publicUseCases', importUseCaseId));

    if (!publicSnap.exists()) {
      logWarn('auth_entry_import_missing', {
        importUseCaseId,
        registerId,
      });
      return false;
    }

    const publicData = publicSnap.data() as
      | {
          purpose?: string | null;
          toolName?: string | null;
        }
      | undefined;

    await registerService.createUseCaseFromCapture(
      {
        purpose:
          publicData?.purpose ?? 'Importierter Use Case aus Netzwerkfreigabe',
        toolFreeText:
          publicData?.toolName ?? 'Importiertes KI-System aus Netzwerkfreigabe',
      },
      { registerId },
    );

    return true;
  } catch (error) {
    logError('auth_entry_import_failed', {
      importUseCaseId,
      registerId,
      errorCode: getErrorCode(error),
    });
    captureException(error, {
      boundary: 'app',
      component: 'auth_entry_controller',
      route: '/',
      tags: {
        operation: 'import_public_use_case',
        registerId,
      },
    });
    return false;
  }
}

async function acceptWorkspaceInvites(
  auth: Auth,
  email: string,
  workspaceInvite: string | null | undefined,
): Promise<void> {
  if (!workspaceInvite || !auth.currentUser?.uid) {
    return;
  }

  try {
    const authToken = await auth.currentUser.getIdToken();
    const response = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId: auth.currentUser.uid,
        email,
        workspaceInvite,
      }),
    });

    if (!response.ok) {
      logWarn('auth_entry_workspace_invite_failed', {
        email,
        responseStatus: response.status,
        workspaceInvite,
      });
    }
  } catch (error) {
    logWarn('auth_entry_workspace_invite_error', {
      email,
      errorCode: getErrorCode(error),
      workspaceInvite,
    });
  }
}

export function getAuthErrorDescription(
  error: unknown,
  action: AuthAction,
): string {
  const errorCode = getErrorCode(error);

  if (
    errorCode === 'auth/invalid-credential' ||
    errorCode === 'auth/user-not-found' ||
    errorCode === 'auth/wrong-password'
  ) {
    return 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
  }

  if (errorCode === 'auth/email-already-in-use') {
    return 'Diese E-Mail-Adresse wird bereits verwendet.';
  }

  if (errorCode === 'auth/invalid-email') {
    return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
  }

  if (
    errorCode === 'auth/configuration-not-found' ||
    errorCode === 'auth/invalid-api-key' ||
    errorCode === 'auth/network-request-failed'
  ) {
    return 'Authentifizierung ist gerade nicht verfügbar. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.';
  }

  if (errorCode === 'auth/too-many-requests') {
    return 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie kurz und versuchen Sie es erneut.';
  }

  return action === 'signup'
    ? 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
}

export async function loadAuthClient(): Promise<Auth> {
  const { getFirebaseAuth } = await import('@/lib/firebase');
  return getFirebaseAuth();
}

export async function sendPasswordReset(email: string): Promise<void> {
  await guardAuthAttempt('password_reset', email);
  const response = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizeEmail(email),
    }),
  });

  if (!response.ok) {
    throw new Error(`Password reset request failed with status ${response.status}.`);
  }

  logInfo('auth_password_reset_requested', {
    email: normalizeEmail(email),
  });
}

export async function validateJoinCode(
  rawCode: string,
): Promise<JoinCodeValidationResult> {
  const code = normalizeCode(rawCode);

  if (!code || code.length < 3) {
    return {
      ok: false,
      error: {
        title: 'Code ungültig',
        description: 'Bitte geben Sie einen gültigen Einladungscode ein.',
      },
    };
  }

  try {
    const response = await fetch(
      `/api/capture-by-code?code=${encodeURIComponent(code)}`,
    );
    const payload = (await response.json().catch(() => ({
      error: 'Code konnte nicht überprüft werden.',
    }))) as {
      error?: string;
      organisationName?: string | null;
      label?: string | null;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: getCaptureByCodeErrorCopy(
          response.status,
          payload.error,
          'validate',
        ),
      };
    }

    return {
      ok: true,
      code,
      organisationName: payload.organisationName ?? null,
      label: payload.label ?? null,
    };
  } catch (error) {
    logWarn('auth_entry_join_code_error', {
      code,
      errorCode: getErrorCode(error),
    });
    return {
      ok: false,
      error: {
        title: 'Fehler',
        description:
          'Code konnte nicht überprüft werden. Bitte versuchen Sie es erneut.',
      },
    };
  }
}

export async function authenticateWithEmailPassword(input: {
  action: AuthAction;
  context: AuthEntryContext;
  displayName?: string | null;
  email: string;
  password: string;
}): Promise<AuthenticatedActionResult> {
  const email = normalizeEmail(input.email);
  const auth = await loadAuthClient();
  const {
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    setPersistence,
    signInWithEmailAndPassword,
    updateProfile,
  } = await import('firebase/auth');

  try {
    await guardAuthAttempt(input.action, email);
    await setPersistence(auth, browserSessionPersistence);

    const credential =
      input.action === 'login'
        ? await signInWithEmailAndPassword(auth, email, input.password)
        : await createUserWithEmailAndPassword(auth, email, input.password);

    if (input.action === 'signup' && input.displayName?.trim()) {
      await updateProfile(credential.user, {
        displayName: input.displayName.trim(),
      });
    }

    if (credential.user.emailVerified !== true) {
      try {
        await sendVerificationEmail(credential.user);
      } catch (verificationError) {
        logWarn('auth_entry_verification_email_failed', {
          action: input.action,
          email,
          errorCode: getErrorCode(verificationError),
        });
      }

      const { signOut } = await import('firebase/auth');
      await signOut(auth).catch(() => undefined);

      logInfo('auth_entry_verification_required', {
        action: input.action,
        email,
        intent: input.context.intent,
        mode: input.context.mode,
      });

      return {
        credential,
        syncedPlan: null,
        syncNeedsRegister: false,
        requiresEmailVerification: true,
      };
    }

    await acceptWorkspaceInvites(auth, email, input.context.workspaceInvite);

    // Affiliate attribution: if cookie is set, create referral record
    void attributeAffiliateSignup(auth).catch((err) => {
      logWarn('auth_entry_affiliate_attribution_failed', {
        email,
        errorCode: getErrorCode(err),
      });
    });

    const syncResult =
      (await syncRegisterEntitlement({
        sessionId: input.context.sessionId ?? undefined,
      }).catch((error) => {
        logWarn('auth_entry_entitlement_sync_failed', {
          action: input.action,
          email,
          errorCode: getErrorCode(error),
          sessionId: input.context.sessionId ?? null,
        });
        return null;
      })) ?? null;

    if (syncResult?.applied) {
      invalidateEntitlementCache();
    }

    logInfo('auth_entry_authenticated', {
      action: input.action,
      email,
      intent: input.context.intent,
      mode: input.context.mode,
      sessionId: input.context.sessionId ?? null,
      syncedPlan: syncResult?.plan ?? null,
    });

    return {
      credential,
      syncedPlan: syncResult?.plan ?? null,
      syncNeedsRegister: syncResult?.needsRegister ?? false,
      requiresEmailVerification: false,
    };
  } catch (error) {
    logError('auth_entry_authenticate_failed', {
      action: input.action,
      email,
      errorCode: getErrorCode(error),
      intent: input.context.intent,
      mode: input.context.mode,
      route: '/',
      sessionId: input.context.sessionId ?? null,
    });
    captureException(error, {
      boundary: 'app',
      component: 'auth_entry_controller',
      route: '/',
      tags: {
        action: input.action,
        intent: input.context.intent,
        mode: input.context.mode,
      },
    });
    throw error;
  }
}

export async function resolveAuthenticatedDestination(input: {
  context: AuthEntryContext;
  email: string;
  syncNeedsRegister?: boolean;
}): Promise<string> {
  if (input.context.code) {
    return encodeCapturePath(input.context.code);
  }

  if (input.context.importUseCase) {
    const registers = await registerService.listRegisters();
    const targetRegister = selectTargetRegister(registers);

    if (!targetRegister) {
      return buildAuthPath({
        mode: 'signup',
        intent: 'create_register',
        email: input.email,
        importUseCase: input.context.importUseCase,
        sessionId: input.context.sessionId,
      });
    }

    setActiveRegisterId(targetRegister.registerId);

    if (input.context.sessionId) {
      const entitlementResult = await syncRegisterEntitlement({
        registerId: targetRegister.registerId,
        sessionId: input.context.sessionId,
      }).catch((error) => {
        logWarn('auth_entry_register_sync_failed', {
          errorCode: getErrorCode(error),
          registerId: targetRegister.registerId,
          sessionId: input.context.sessionId,
        });
        return null;
      });

      if (entitlementResult?.applied) {
        invalidateEntitlementCache();
      }
    }

    await importPublicUseCaseIntoRegister(
      targetRegister.registerId,
      input.context.importUseCase,
    );

    return '/my-register';
  }

  if (input.context.returnTo) {
    return input.context.returnTo;
  }

  if (input.syncNeedsRegister) {
    return buildAuthPath({
      mode: 'signup',
      intent: 'create_register',
      email: input.email,
      sessionId: input.context.sessionId,
    });
  }

  if (input.context.sessionId) {
    return buildBillingWelcomePath(input.context.sessionId, {
      source: 'checkout',
    });
  }

  return '/my-register';
}

export async function completeRegisterSetup(input: {
  contactEmail: string;
  contactName: string;
  importUseCase?: string | null;
  organisationName: string;
  role: string;
  sessionId?: string | null;
}): Promise<RegisterSetupResult> {
  const organisationName = input.organisationName.trim();
  const role = input.role.trim();
  const contactName = input.contactName.trim() || 'Unbenannt';
  const contactEmail = normalizeEmail(input.contactEmail);

  const existingRegisters = await registerService.listRegisters();
  const normalizedName = organisationName.toLocaleLowerCase('de-DE');
  const existing = existingRegisters.find((register) =>
    [register.organisationName, register.name]
      .filter((value): value is string => Boolean(value))
      .some(
        (value) => value.trim().toLocaleLowerCase('de-DE') === normalizedName,
      ),
  );

  const targetRegister = existing
    ? existing
    : await registerService.createRegister(organisationName);

  await registerService.updateRegisterProfile(targetRegister.registerId, {
    organisationName,
    orgSettings: {
      organisationName,
      industry: '',
      contactPerson: {
        email: contactEmail,
        name: contactName,
      },
      rolesFramework: role ? { booleanDefined: true } : null,
      ...(role
        ? {
            raci: {
              aiOwner: {
                department: role,
                ...(contactEmail ? { email: contactEmail } : {}),
                name: contactName,
              },
            },
          }
        : {}),
    },
  });

  setActiveRegisterId(targetRegister.registerId);

  const syncResult =
    (await syncRegisterEntitlement({
      registerId: targetRegister.registerId,
      sessionId: input.sessionId ?? undefined,
    }).catch((error) => {
      logWarn('auth_entry_register_entitlement_sync_failed', {
        errorCode: getErrorCode(error),
        registerId: targetRegister.registerId,
        sessionId: input.sessionId ?? null,
      });
      return null;
    })) ?? null;

  if (syncResult?.applied) {
    invalidateEntitlementCache();
  }

  const importedUseCase = input.importUseCase
    ? await importPublicUseCaseIntoRegister(
        targetRegister.registerId,
        input.importUseCase,
      )
    : false;

  const codeEntry = await accessCodeService.generateCode(targetRegister.registerId, {
    expiryOption: '90_DAYS',
    label: 'Onboarding',
  });

  return {
    captureLink: `${getPublicAppOrigin()}${encodeCapturePath(codeEntry.code)}`,
    existingRegisterUsed: Boolean(existing),
    importedUseCase,
    inviteCode: codeEntry.code,
    registerId: targetRegister.registerId,
    syncedPlan: syncResult?.plan ?? null,
  };
}

async function attributeAffiliateSignup(auth: Auth): Promise<void> {
  const cookieMatch = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('kiregister_ref='));

  if (!cookieMatch) return;

  const slug = cookieMatch.split('=')[1];
  if (!slug) return;

  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const response = await fetch('/api/affiliate/attribute-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ slug }),
  });

  if (response.ok) {
    // Fire-and-forget click tracking for the initial referral visit
    void fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }
}

export function buildAuthDiagnostics(input: {
  action: AuthAction;
  context: AuthEntryContext;
  email: string;
  error: unknown;
}): Record<string, unknown> {
  return createErrorTrackingPayload(input.error, {
    boundary: 'app',
    component: 'auth_entry_controller',
    route: '/',
    tags: {
      action: input.action,
      email: normalizeEmail(input.email),
      intent: input.context.intent,
      mode: input.context.mode,
      sessionId: input.context.sessionId ?? undefined,
    },
  });
}
