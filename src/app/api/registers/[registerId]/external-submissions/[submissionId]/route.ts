import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import {
  applyExternalSubmissionReview,
  buildUseCaseFromSupplierSubmission,
  isKmuRegisterMode,
} from '@/lib/register-first/external-submissions';
import { sanitizeSupplierRequestCard } from '@/lib/register-first/supplier-requests';
import {
  ServerAuthError,
  requireRegisterOwner,
} from '@/lib/server-auth';

const ReviewExternalSubmissionSchema = z.object({
  action: z.enum(['approve', 'reject', 'merge']),
  note: z.string().trim().max(1000).nullable().optional(),
});

interface RouteContext {
  params: Promise<{ registerId: string; submissionId: string }>;
}

function createUseCaseId(): string {
  return `uc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function handleRegisterRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Freigabe-Aktion.' },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message === 'APPROVAL_PENDING') {
    return NextResponse.json(
      {
        error:
          'Die Einreichung braucht weitere Freigaben, bevor sie uebernommen werden kann.',
      },
      { status: 409 },
    );
  }

  console.error('Register external submission route failed:', error);
  return NextResponse.json(
    { error: 'Externe Einreichung konnte nicht aktualisiert werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { registerId, submissionId } = await context.params;

  try {
    const authorization = await requireRegisterOwner(
      req.headers.get('authorization'),
      registerId,
    );

    const snapshot = await db
      .doc(
        `users/${authorization.user.uid}/registers/${registerId}/externalSubmissions/${submissionId}`,
      )
      .get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: 'Externe Einreichung nicht gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      submission: {
        ...snapshot.data(),
        registerName: authorization.register.name,
        organisationName: authorization.register.organisationName ?? null,
      },
    });
  } catch (error) {
    return handleRegisterRouteError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { registerId, submissionId } = await context.params;

  try {
    const authorization = await requireRegisterOwner(
      req.headers.get('authorization'),
      registerId,
    );
    const payload = ReviewExternalSubmissionSchema.parse(await req.json());
    const reviewedAt = new Date().toISOString();
    const reviewNote = payload.note?.trim() || null;
    const submissionRef = db.doc(
      `users/${authorization.user.uid}/registers/${registerId}/externalSubmissions/${submissionId}`,
    );
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
      return NextResponse.json(
        { error: 'Externe Einreichung nicht gefunden.' },
        { status: 404 },
      );
    }

    const submission =
      submissionSnapshot.data() as Parameters<
        typeof applyExternalSubmissionReview
      >[0]['submission'];

    const approvalPending =
      payload.action === 'merge' &&
      submission.approvalWorkflow &&
      submission.approvalWorkflow.status !== 'approved';
    if (approvalPending) {
      throw new Error('APPROVAL_PENDING');
    }

    const batch = db.batch();
    let linkedUseCaseId = submission.linkedUseCaseId ?? null;
    const autoCreateOnApproval = isKmuRegisterMode(authorization.register);

    if (payload.action === 'approve') {
      const shouldAutoCreate =
        submission.sourceType === 'supplier_request' &&
        !linkedUseCaseId &&
        autoCreateOnApproval;

      if (shouldAutoCreate) {
        linkedUseCaseId = createUseCaseId();
        const card = buildUseCaseFromSupplierSubmission({
          useCaseId: linkedUseCaseId,
          registerId,
          ownerId: authorization.user.uid,
          organisationName:
            authorization.register.organisationName ??
            authorization.register.orgSettings?.organisationName ??
            authorization.register.name ??
            null,
          requestTokenId: submission.requestTokenId,
          submission: {
            ...submission,
            linkedUseCaseId,
          },
          now: new Date(reviewedAt),
        });

        batch.set(
          db.doc(
            `users/${authorization.user.uid}/registers/${registerId}/useCases/${linkedUseCaseId}`,
          ),
          sanitizeSupplierRequestCard(card),
        );
      }
    } else if (
      payload.action === 'merge' &&
      submission.sourceType === 'supplier_request' &&
      !linkedUseCaseId
    ) {
      linkedUseCaseId = createUseCaseId();
      const card = buildUseCaseFromSupplierSubmission({
        useCaseId: linkedUseCaseId,
        registerId,
        ownerId: authorization.user.uid,
        organisationName:
          authorization.register.organisationName ??
          authorization.register.orgSettings?.organisationName ??
          authorization.register.name ??
          null,
        requestTokenId: submission.requestTokenId,
        submission: {
          ...submission,
          linkedUseCaseId,
        },
        now: new Date(reviewedAt),
      });

      batch.set(
        db.doc(
          `users/${authorization.user.uid}/registers/${registerId}/useCases/${linkedUseCaseId}`,
        ),
        sanitizeSupplierRequestCard(card),
      );
    }

    const updatedSubmission = applyExternalSubmissionReview({
      submission,
      action: payload.action,
      linkedUseCaseId,
      reviewedAt,
      reviewedBy: authorization.user.uid,
      reviewNote,
      actorRole: null,
    });

    batch.set(submissionRef, updatedSubmission);
    await batch.commit();

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error) {
    return handleRegisterRouteError(error);
  }
}
