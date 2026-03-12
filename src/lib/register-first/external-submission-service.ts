'use client';

import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';

import { parseExternalSubmission } from './schema';
import {
  applyExternalSubmissionReview,
  buildUseCaseFromSupplierSubmission,
  getExternalSubmissionActor,
  getExternalSubmissionTitle,
  isKmuRegisterMode,
} from './external-submissions';
import { sanitizeSupplierRequestCard } from './supplier-requests';
import type {
  ExternalSubmission,
  ExternalSubmissionStatus,
  ExternalSubmissionSourceType,
  Register,
} from './types';
import type { WorkspaceRole } from '@/lib/enterprise/workspace';

export interface ExternalSubmissionFilters {
  status?: ExternalSubmissionStatus | 'all';
  sourceType?: ExternalSubmissionSourceType | 'all';
  searchText?: string;
}

export interface ReviewExternalSubmissionInput {
  registerId: string;
  register?: Register | null;
  submissionId: string;
  action: 'approve' | 'reject' | 'merge';
  note?: string | null;
  actorRole?: WorkspaceRole | null;
}

export interface FindRelatedExternalSubmissionInput {
  registerId: string;
  useCaseId: string;
  submissionId?: string | null;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isExternalSubmissionPermissionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (code.includes('permission-denied')) {
      return true;
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (/missing or insufficient permissions/i.test(message)) {
      return true;
    }
  }

  return false;
}

async function resolveUserIdOrThrow(): Promise<string> {
  const auth = await getFirebaseAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('UNAUTHENTICATED');
  }
  return userId;
}

function createUseCaseId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `uc_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function matchesFilters(
  submission: ExternalSubmission,
  filters: ExternalSubmissionFilters,
): boolean {
  if (filters.status && filters.status !== 'all') {
    if (submission.status !== filters.status) {
      return false;
    }
  }

  if (filters.sourceType && filters.sourceType !== 'all') {
    if (submission.sourceType !== filters.sourceType) {
      return false;
    }
  }

  const query = filters.searchText?.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const searchable = [
    submission.submissionId,
    submission.requestTokenId ?? '',
    submission.accessCodeId ?? '',
    submission.submittedByName ?? '',
    submission.submittedByEmail ?? '',
    getExternalSubmissionActor(submission),
    getExternalSubmissionTitle(submission),
    ...Object.values(submission.rawPayloadSnapshot).map((value) =>
      typeof value === 'string'
        ? value
        : Array.isArray(value)
          ? value.join(' ')
          : '',
    ),
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes(query);
}

export const externalSubmissionService = {
  async getById(
    registerId: string,
    submissionId: string | null | undefined,
  ): Promise<ExternalSubmission | null> {
    const normalizedSubmissionId = normalizeOptionalText(submissionId);
    if (!normalizedSubmissionId) {
      return null;
    }

    const userId = await resolveUserIdOrThrow();
    const db = await getFirebaseDb();
    const { doc, getDoc } = await import('firebase/firestore');

    const snapshot = await getDoc(
      doc(
        db,
        'users',
        userId,
        'registers',
        registerId,
        'externalSubmissions',
        normalizedSubmissionId,
      ),
    );

    return snapshot.exists() ? parseExternalSubmission(snapshot.data()) : null;
  },

  async list(
    registerId: string,
    filters: ExternalSubmissionFilters = {},
  ): Promise<ExternalSubmission[]> {
    const userId = await resolveUserIdOrThrow();
    const db = await getFirebaseDb();
    const { collection, getDocs, orderBy, query } =
      await import('firebase/firestore');

    const snapshot = await getDocs(
      query(
        collection(
          db,
          'users',
          userId,
          'registers',
          registerId,
          'externalSubmissions',
        ),
        orderBy('submittedAt', 'desc'),
      ),
    );

    return snapshot.docs
      .map((doc) => parseExternalSubmission(doc.data()))
      .filter((submission) => matchesFilters(submission, filters));
  },

  async countOpen(registerId: string): Promise<number> {
    const submissions = await this.list(registerId, { status: 'submitted' });
    return submissions.length;
  },

  async findRelatedToUseCase(
    input: FindRelatedExternalSubmissionInput,
  ): Promise<ExternalSubmission | null> {
    const directMatch = await this.getById(
      input.registerId,
      input.submissionId,
    );
    if (directMatch) {
      return directMatch;
    }

    const userId = await resolveUserIdOrThrow();
    const db = await getFirebaseDb();
    const { collection, getDocs, limit, query, where } =
      await import('firebase/firestore');

    const snapshot = await getDocs(
      query(
        collection(
          db,
          'users',
          userId,
          'registers',
          input.registerId,
          'externalSubmissions',
        ),
        where('linkedUseCaseId', '==', input.useCaseId),
        limit(1),
      ),
    );

    const match = snapshot.docs[0];
    return match ? parseExternalSubmission(match.data()) : null;
  },

  async review(
    input: ReviewExternalSubmissionInput,
  ): Promise<ExternalSubmission> {
    const userId = await resolveUserIdOrThrow();
    const db = await getFirebaseDb();
    const { doc, getDoc, writeBatch } = await import('firebase/firestore');

    const submissionRef = doc(
      db,
      'users',
      userId,
      'registers',
      input.registerId,
      'externalSubmissions',
      input.submissionId,
    );
    const submissionSnapshot = await getDoc(submissionRef);
    if (!submissionSnapshot.exists()) {
      throw new Error('SUBMISSION_NOT_FOUND');
    }

    const submission = parseExternalSubmission(submissionSnapshot.data());
    const reviewedAt = new Date().toISOString();
    const reviewNote = normalizeOptionalText(input.note);
    const batch = writeBatch(db);
    let linkedUseCaseId = submission.linkedUseCaseId ?? null;
    const approvalPending =
      input.action === 'merge' &&
      submission.approvalWorkflow &&
      submission.approvalWorkflow.status !== 'approved';
    if (approvalPending) {
      throw new Error('APPROVAL_PENDING');
    }
    if (input.action === 'approve') {
      const shouldAutoCreate =
        submission.sourceType === 'supplier_request' &&
        !linkedUseCaseId &&
        isKmuRegisterMode(input.register);
      if (shouldAutoCreate) {
        linkedUseCaseId = createUseCaseId();
        const card = buildUseCaseFromSupplierSubmission({
          useCaseId: linkedUseCaseId,
          registerId: input.registerId,
          ownerId: userId,
          organisationName:
            input.register?.organisationName ??
            input.register?.orgSettings?.organisationName ??
            input.register?.name ??
            null,
          requestTokenId: submission.requestTokenId,
          submission: {
            ...submission,
            linkedUseCaseId,
          },
          now: new Date(reviewedAt),
        });
        batch.set(
          doc(
            db,
            'users',
            userId,
            'registers',
            input.registerId,
            'useCases',
            linkedUseCaseId,
          ),
          sanitizeSupplierRequestCard(card),
        );
      }
    } else {
      const shouldCreateMergedUseCase =
        input.action === 'merge' &&
        submission.sourceType === 'supplier_request' &&
        !linkedUseCaseId;
      if (shouldCreateMergedUseCase) {
        linkedUseCaseId = createUseCaseId();
        const card = buildUseCaseFromSupplierSubmission({
          useCaseId: linkedUseCaseId,
          registerId: input.registerId,
          ownerId: userId,
          organisationName:
            input.register?.organisationName ??
            input.register?.orgSettings?.organisationName ??
            input.register?.name ??
            null,
          requestTokenId: submission.requestTokenId,
          submission: {
            ...submission,
            linkedUseCaseId,
          },
          now: new Date(reviewedAt),
        });
        batch.set(
          doc(
            db,
            'users',
            userId,
            'registers',
            input.registerId,
            'useCases',
            linkedUseCaseId,
          ),
          sanitizeSupplierRequestCard(card),
        );
      }
    }

    const updatedSubmission = applyExternalSubmissionReview({
      submission,
      action: input.action,
      linkedUseCaseId,
      reviewedAt,
      reviewedBy: userId,
      reviewNote,
      actorRole: input.actorRole ?? null,
    });
    batch.set(submissionRef, updatedSubmission);
    await batch.commit();
    return updatedSubmission;
  },
};
