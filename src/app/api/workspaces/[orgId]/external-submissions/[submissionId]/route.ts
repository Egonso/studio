import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import { deliverWorkspaceNotificationHooks } from '@/lib/enterprise/notifications';
import { applyExternalSubmissionReview, buildUseCaseFromSupplierSubmission, isKmuRegisterMode } from '@/lib/register-first/external-submissions';
import { findWorkspaceExternalSubmissionById } from '@/lib/register-first/register-admin';
import { sanitizeSupplierRequestCard } from '@/lib/register-first/supplier-requests';
import {
  ServerAuthError,
  requireWorkspaceMember,
  requireWorkspaceReviewer,
} from '@/lib/server-auth';
import { getWorkspaceSettingsForRegister } from '@/lib/workspace-admin';

const ReviewExternalSubmissionSchema = z.object({
  action: z.enum(['approve', 'reject', 'merge']),
  note: z.string().trim().max(1000).nullable().optional(),
});

interface RouteContext {
  params: Promise<{ orgId: string; submissionId: string }>;
}

function createUseCaseId(): string {
  return `uc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Freigabe-Aktion.' },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    switch (error.message) {
      case 'APPROVAL_PENDING':
        return NextResponse.json(
          { error: 'Die Einreichung braucht weitere Freigaben, bevor sie uebernommen werden kann.' },
          { status: 409 },
        );
      case 'APPROVAL_ROLE_NOT_ALLOWED':
        return NextResponse.json(
          { error: 'Ihre Workspace-Rolle darf diese Einreichung nicht freigeben.' },
          { status: 403 },
        );
      default:
        break;
    }
  }

  console.error('Workspace external submission review failed:', error);
  return NextResponse.json(
    { error: 'Externe Einreichung konnte nicht aktualisiert werden.' },
    { status: 500 },
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { orgId, submissionId } = await context.params;

  try {
    const authorization = await requireWorkspaceReviewer(
      req.headers.get('authorization'),
      orgId,
    );
    const payload = ReviewExternalSubmissionSchema.parse(await req.json());
    const location = await findWorkspaceExternalSubmissionById({
      workspaceId: orgId,
      submissionId,
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Externe Einreichung nicht gefunden.' },
        { status: 404 },
      );
    }

    const reviewedAt = new Date().toISOString();
    const reviewNote = payload.note?.trim() || null;
    const batch = db.batch();
    const submissionRef = db.doc(
      `users/${location.ownerId}/registers/${location.registerId}/externalSubmissions/${submissionId}`,
    );

    let linkedUseCaseId = location.submission.linkedUseCaseId ?? null;
    const approvalPending =
      payload.action === 'merge' &&
      location.submission.approvalWorkflow &&
      location.submission.approvalWorkflow.status !== 'approved';
    if (approvalPending) {
      throw new Error('APPROVAL_PENDING');
    }

    const workspaceSettings = await getWorkspaceSettingsForRegister({
      registerWorkspaceId: location.register.workspaceId,
      registerOwnerId: location.ownerId,
    });
    const autoCreateOnApproval =
      workspaceSettings?.approvalPolicy.autoCreateUseCaseOnApproval === true ||
      isKmuRegisterMode(location.register);

    if (payload.action === 'approve') {
      const shouldAutoCreate =
        location.submission.sourceType === 'supplier_request' &&
        !linkedUseCaseId &&
        autoCreateOnApproval;

      if (shouldAutoCreate) {
        linkedUseCaseId = createUseCaseId();
        const card = buildUseCaseFromSupplierSubmission({
          useCaseId: linkedUseCaseId,
          registerId: location.registerId,
          ownerId: location.ownerId,
          organisationName:
            location.register.organisationName ??
            location.register.orgSettings?.organisationName ??
            location.register.name ??
            null,
          requestTokenId: location.submission.requestTokenId,
          submission: {
            ...location.submission,
            linkedUseCaseId,
          },
          now: new Date(reviewedAt),
        });

        batch.set(
          db.doc(
            `users/${location.ownerId}/registers/${location.registerId}/useCases/${linkedUseCaseId}`,
          ),
          sanitizeSupplierRequestCard(card),
        );
      }
    } else if (
      payload.action === 'merge' &&
      location.submission.sourceType === 'supplier_request' &&
      !linkedUseCaseId
    ) {
      linkedUseCaseId = createUseCaseId();
      const card = buildUseCaseFromSupplierSubmission({
        useCaseId: linkedUseCaseId,
        registerId: location.registerId,
        ownerId: location.ownerId,
        organisationName:
          location.register.organisationName ??
          location.register.orgSettings?.organisationName ??
          location.register.name ??
          null,
        requestTokenId: location.submission.requestTokenId,
        submission: {
          ...location.submission,
          linkedUseCaseId,
        },
        now: new Date(reviewedAt),
      });

      batch.set(
        db.doc(
          `users/${location.ownerId}/registers/${location.registerId}/useCases/${linkedUseCaseId}`,
        ),
        sanitizeSupplierRequestCard(card),
      );
    }

    const updatedSubmission = applyExternalSubmissionReview({
      submission: location.submission,
      action: payload.action,
      linkedUseCaseId,
      reviewedAt,
      reviewedBy: authorization.user.uid,
      reviewNote,
      actorRole: authorization.role,
    });

    batch.set(submissionRef, updatedSubmission, { merge: false });
    await batch.commit();

    if (
      updatedSubmission.approvalWorkflow?.status === 'pending' &&
      payload.action === 'approve'
    ) {
      await deliverWorkspaceNotificationHooks({
        workspaceId: orgId,
        eventType: 'approval_needed',
        eventId: `${submissionId}_pending`,
        data: {
          kind: 'external_submission',
          submissionId: updatedSubmission.submissionId,
          registerId: updatedSubmission.registerId,
          requiredRoles: updatedSubmission.approvalWorkflow.requiredRoles,
        },
      });
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId, submissionId } = await context.params;

  try {
    await requireWorkspaceMember(req.headers.get('authorization'), orgId);
    const location = await findWorkspaceExternalSubmissionById({
      workspaceId: orgId,
      submissionId,
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Externe Einreichung nicht gefunden.' },
        { status: 404 },
      );
    }

    const requestedRegisterId = req.nextUrl.searchParams.get('registerId');
    if (requestedRegisterId && requestedRegisterId !== location.registerId) {
      return NextResponse.json(
        { error: 'Externe Einreichung nicht im angefragten Register gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      submission: {
        ...location.submission,
        registerName: location.register.name,
        organisationName: location.register.organisationName ?? null,
      },
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
