import { NextRequest, NextResponse } from 'next/server';
import { db, hasFirebaseAdminCredentials } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ZodError } from 'zod';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { normalizeCaptureByCodeSelections } from '@/lib/capture-by-code/selections';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';
import { validateSharedCaptureFields } from '@/lib/register-first/shared-capture-fields';
import { getRegisterFirstFeatureFlags } from '@/lib/register-first/flags';
import {
  buildAccessCodeSubmissionSnapshot,
  buildExternalSubmissionRecord,
  buildUseCaseFromAccessCodeSubmission,
} from '@/lib/register-first/external-submissions';

interface CaptureByCodeBody {
  code: string;
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  systems?: Array<{
    entryId?: string;
    toolId?: string;
    toolFreeText?: string;
  }>;
  workflowConnectionMode?: string | null;
  workflowSummary?: string | null;
  usageContext?: string;
  usageContexts?: string[];
  dataCategory?: string;
  dataCategories?: string[];
  decisionInfluence?: string | null;
  ownerRole?: string;
  ownerName?: string;
  contactPersonName?: string;
  organisation?: string;
}

const RATE_LIMIT_PER_CODE = 10; // 10 submissions per hour per code
const RATE_LIMIT_PER_IP = 100; // 100 submissions per day per IP
const RATE_WINDOW_CODE = 60 * 60 * 1000; // 1 hour
const RATE_WINDOW_IP = 24 * 60 * 60 * 1000; // 24 hours
const TEMPORARY_UNAVAILABLE_MESSAGE =
  'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Minuten erneut.';

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function parseExpiresAt(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function parsePathSegment(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('/')) return null;
  return trimmed;
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeFirestoreData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveCodeScope(
  codeData: Record<string, unknown>,
): { ownerId: string; registerId: string } | null {
  const ownerId =
    parsePathSegment(codeData.ownerId) ??
    parsePathSegment(codeData.userId) ??
    parsePathSegment(codeData.ownerUid);
  const registerId =
    parsePathSegment(codeData.registerId) ??
    parsePathSegment(codeData.targetRegisterId) ??
    parsePathSegment(codeData.projectId);

  if (!ownerId || !registerId) return null;
  return { ownerId, registerId };
}

function isDeletedRegisterData(
  data: Record<string, unknown> | undefined,
): boolean {
  return data?.isDeleted === true;
}

function mapOperationalError(error: unknown): {
  status: number;
  message: string;
} {
  const message = String(
    (error as { message?: unknown } | undefined)?.message ?? '',
  ).toLowerCase();
  const code = String(
    (error as { code?: unknown } | undefined)?.code ?? '',
  ).toLowerCase();
  const details = String(
    (error as { details?: unknown } | undefined)?.details ?? '',
  ).toLowerCase();
  const status = Number(
    (error as { status?: unknown; statusCode?: unknown } | undefined)?.status ??
      (error as { statusCode?: unknown } | undefined)?.statusCode ??
      0,
  );
  const signature = `${message} ${code} ${details}`;

  if ([401, 403, 429, 500, 502, 503, 504].includes(status)) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    message.includes('could not load the default credentials') ||
    message.includes('failed to determine service account') ||
    code.includes('invalid-credential')
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    code.includes('permission-denied') ||
    code.includes('unauthenticated') ||
    code.includes('unavailable') ||
    code.includes('deadline-exceeded') ||
    code.includes('resource-exhausted') ||
    message.includes('permission_denied')
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    signature.includes('permission denied') ||
    signature.includes('missing or insufficient permissions') ||
    signature.includes('service unavailable') ||
    signature.includes('deadline exceeded') ||
    signature.includes('network error') ||
    signature.includes('socket hang up')
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  return { status: 500, message: 'Interner Fehler' };
}

// GET: Validate code and return register info
export async function GET(req: NextRequest) {
  try {
    if (!hasFirebaseAdminCredentials()) {
      logWarn('capture_by_code_admin_credentials_missing', {
        route: '/api/capture-by-code',
        method: 'GET',
      });
      return NextResponse.json(
        { error: TEMPORARY_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }

    const rawCode = req.nextUrl.searchParams.get('code');
    const code = rawCode ? normalizeCode(rawCode) : '';
    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter required' },
        { status: 400 },
      );
    }
    if (code.length < 4) {
      return NextResponse.json({ error: 'Ungültiger Code' }, { status: 400 });
    }

    const codeDoc = await db.doc(`registerAccessCodes/${code}`).get();
    if (!codeDoc.exists) {
      return NextResponse.json({ error: 'Ungültiger Code' }, { status: 404 });
    }

    const codeData = codeDoc.data()!;
    if (!codeData.isActive) {
      const isRegisterDeleted =
        (codeData.deactivatedReason as string | undefined) ===
        'REGISTER_DELETED';
      return NextResponse.json(
        {
          error: isRegisterDeleted
            ? 'Dieses Register wurde deaktiviert.'
            : 'Dieser Code ist nicht mehr aktiv',
        },
        { status: 410 },
      );
    }

    const expiresAt = parseExpiresAt(codeData.expiresAt);
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Dieser Code ist abgelaufen' },
        { status: 410 },
      );
    }

    // Get register name for display
    const scope = resolveCodeScope(codeData as Record<string, unknown>);
    if (!scope) {
      logWarn('access_code_scope_invalid', {
        code,
        keys: Object.keys(codeData ?? {}),
      });
      return NextResponse.json({ error: 'Ungültiger Code' }, { status: 404 });
    }

    const registerDoc = await db
      .doc(`users/${scope.ownerId}/registers/${scope.registerId}`)
      .get();
    if (!registerDoc.exists || isDeletedRegisterData(registerDoc.data())) {
      return NextResponse.json(
        { error: 'Dieses Register wurde deaktiviert.' },
        { status: 410 },
      );
    }

    const registerName =
      registerDoc.data()?.organisationName || registerDoc.data()?.name || null;

    return NextResponse.json({
      valid: true,
      code,
      label: codeData.label,
      organisationName: registerName,
    });
  } catch (error: any) {
    captureException(error, {
      boundary: 'app',
      component: 'capture-by-code-get-route',
      route: '/api/capture-by-code',
    });
    const mapped = mapOperationalError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}

// POST: Create use case via access code (no auth required)
export async function POST(req: NextRequest) {
  try {
    const featureFlags = getRegisterFirstFeatureFlags();
    if (!hasFirebaseAdminCredentials()) {
      logWarn('capture_by_code_admin_credentials_missing', {
        route: '/api/capture-by-code',
        method: 'POST',
      });
      return NextResponse.json(
        { error: TEMPORARY_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }

    const body: CaptureByCodeBody = await req.json();
    const {
      code: rawCode,
      purpose,
      toolId,
      toolFreeText,
      systems,
      workflowConnectionMode,
      workflowSummary,
      usageContext,
      usageContexts,
      dataCategory,
      dataCategories,
      decisionInfluence,
      ownerRole,
      ownerName,
      contactPersonName,
      organisation,
    } = body;
    const code = rawCode ? normalizeCode(rawCode) : '';
    const normalizedOwnerRole =
      normalizeOptionalText(ownerRole) ?? normalizeOptionalText(ownerName);
    const normalizedOrganisation = normalizeOptionalText(organisation);
    const normalizedSelections = normalizeCaptureByCodeSelections({
      usageContext,
      usageContexts,
      dataCategory,
      dataCategories,
      decisionInfluence,
    });
    const validation = validateSharedCaptureFields({
      purpose,
      ownerRole: normalizedOwnerRole ?? '',
      contactPersonName,
      toolId,
      toolFreeText,
      systems,
      workflowConnectionMode,
      workflowSummary,
      usageContexts: normalizedSelections.usageContexts,
      dataCategories: normalizedSelections.dataCategories,
      decisionInfluence: normalizedSelections.decisionInfluence,
    }, {
      multisystemEnabled: featureFlags.multisystemCapture,
    });

    if (code) {
      const codeRateLimit = await checkPublicRateLimit({
        namespace: 'capture-by-code:code',
        key: code,
        limit: RATE_LIMIT_PER_CODE,
        windowMs: RATE_WINDOW_CODE,
      });
      if (!codeRateLimit.ok) {
        return NextResponse.json(
          { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
          { status: 429 },
        );
      }
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const ipRateLimit = await checkPublicRateLimit({
      namespace: 'capture-by-code:ip',
      key: ip,
      limit: RATE_LIMIT_PER_IP,
      windowMs: RATE_WINDOW_IP,
    });
    if (!ipRateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen von Ihrer IP-Adresse.' },
        { status: 429 },
      );
    }

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { error: 'Code, Use-Case Name und Owner-Rolle sind Pflichtfelder' },
        { status: 400 },
      );
    }

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error:
            validation.errors.purpose ??
            validation.errors.ownerRole ??
            'Bitte überprüfe die eingegebenen Pflichtfelder.',
        },
        { status: 400 },
      );
    }

    // Validate code
    const codeDoc = await db.doc(`registerAccessCodes/${code}`).get();
    if (!codeDoc.exists) {
      return NextResponse.json({ error: 'Ungültiger Code' }, { status: 404 });
    }

    const codeData = codeDoc.data()!;
    if (!codeData.isActive) {
      const isRegisterDeleted =
        (codeData.deactivatedReason as string | undefined) ===
        'REGISTER_DELETED';
      return NextResponse.json(
        {
          error: isRegisterDeleted
            ? 'Dieses Register wurde deaktiviert.'
            : 'Dieser Code ist nicht mehr aktiv',
        },
        { status: 410 },
      );
    }

    const expiresAt = parseExpiresAt(codeData.expiresAt);
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Dieser Code ist abgelaufen' },
        { status: 410 },
      );
    }

    const scope = resolveCodeScope(codeData as Record<string, unknown>);
    if (!scope) {
      return NextResponse.json({ error: 'Ungültiger Code' }, { status: 404 });
    }
    const { ownerId, registerId } = scope;
    const registerDoc = await db
      .doc(`users/${ownerId}/registers/${registerId}`)
      .get();

    if (!registerDoc.exists || isDeletedRegisterData(registerDoc.data())) {
      return NextResponse.json(
        { error: 'Dieses Register wurde deaktiviert.' },
        { status: 410 },
      );
    }

    const useCaseId = crypto.randomUUID();
    const snapshot = buildAccessCodeSubmissionSnapshot({
      purpose: validation.normalized.purpose,
      toolId: validation.normalized.toolId,
      toolFreeText: validation.normalized.toolFreeText,
      workflow: validation.normalized.workflow,
      usageContexts: validation.normalized.usageContexts,
      dataCategories: validation.normalized.dataCategories ?? [],
      decisionInfluence: validation.normalized.decisionInfluence,
      ownerRole: validation.normalized.ownerRole,
      contactPersonName: validation.normalized.contactPersonName,
      organisation: normalizedOrganisation,
    });
    const submission = buildExternalSubmissionRecord({
      registerId,
      ownerId,
      sourceType: 'access_code',
      accessCodeId: code,
      submittedByName: validation.normalized.contactPersonName,
      submittedByEmail: null,
      submittedAt: new Date(),
      rawPayloadSnapshot: snapshot,
      status: 'merged',
      linkedUseCaseId: useCaseId,
      reviewedAt: new Date().toISOString(),
      reviewedBy: ownerId,
      reviewNote: 'Use case created directly from access code capture.',
    });
    const card = buildUseCaseFromAccessCodeSubmission({
      useCaseId,
      registerId,
      ownerId,
      accessCode: code,
      accessCodeLabel:
        typeof codeData.label === 'string' ? codeData.label : null,
      submissionId: submission.submissionId,
      snapshot,
      now: new Date(),
    });

    const batch = db.batch();
    batch.set(
      db.doc(`users/${ownerId}/registers/${registerId}/useCases/${useCaseId}`),
      sanitizeFirestoreData(card),
    );
    batch.set(
      db.doc(
        `users/${ownerId}/registers/${registerId}/externalSubmissions/${submission.submissionId}`,
      ),
      sanitizeFirestoreData(submission),
    );
    batch.update(db.doc(`registerAccessCodes/${code}`), {
      usageCount: FieldValue.increment(1),
    });
    await batch.commit();

    logInfo('access_code_submission_created', {
      accessCodeId: submission.accessCodeId,
      ownerId,
      registerId,
      submissionId: submission.submissionId,
      useCaseId,
    });

    return NextResponse.json({
      success: true,
      useCaseId,
      purpose: card.purpose,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Bitte überprüfe die eingegebenen Angaben.' },
        { status: 400 },
      );
    }
    captureException(error, {
      boundary: 'app',
      component: 'capture-by-code-post-route',
      route: '/api/capture-by-code',
    });
    const mapped = mapOperationalError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}
