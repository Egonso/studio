import type {
  ExternalSubmission,
  Register,
  UseCaseCard,
} from './types';

export type RegisterActivationActionKind =
  | 'capture_first'
  | 'external_submission'
  | 'assign_owner'
  | 'review_overdue'
  | 'review_due'
  | 'review_recommended'
  | 'share_pass'
  | 'start_review';

export interface RegisterActivationAction {
  kind: RegisterActivationActionKind;
  useCaseId?: string;
  submissionId?: string;
  owner: string;
  reasonKey:
    | 'no_use_cases'
    | 'external_response_waiting'
    | 'owner_missing'
    | 'review_overdue'
    | 'review_due'
    | 'review_recommended'
    | 'proof_ready'
    | 'first_review';
}

export interface RegisterActivationProgress {
  documentedUseCases: number;
  targetUseCases: number;
  useCasesWithOwner: number;
  completedReviews: number;
  sharedPasses: number;
}

export interface RegisterActivationSnapshot {
  nextAction: RegisterActivationAction;
  progress: RegisterActivationProgress;
}

function hasOwner(useCase: UseCaseCard): boolean {
  return (
    useCase.responsibility.isCurrentlyResponsible ||
    Boolean(useCase.responsibility.responsibleParty?.trim())
  );
}

function resolveRegisterReviewOwner(register: Register | null): string {
  return (
    register?.orgSettings?.raci?.reviewOwner?.name?.trim() ||
    register?.orgSettings?.contactPerson?.name?.trim() ||
    'Registerverantwortung'
  );
}

function resolveUseCaseOwner(useCase: UseCaseCard, register: Register | null): string {
  return (
    useCase.responsibility.responsibleParty?.trim() ||
    useCase.responsibility.contactPersonName?.trim() ||
    resolveRegisterReviewOwner(register)
  );
}

function reviewState(
  useCase: UseCaseCard,
  now: Date,
): 'none' | 'due' | 'overdue' {
  const nextReviewAt = useCase.governanceAssessment?.flex?.iso?.nextReviewAt;
  if (!nextReviewAt) return 'none';
  const timestamp = Date.parse(nextReviewAt);
  if (Number.isNaN(timestamp)) return 'none';
  if (timestamp < now.getTime()) return 'overdue';
  if (timestamp <= now.getTime() + 30 * 24 * 60 * 60 * 1000) return 'due';
  return 'none';
}

function oldestFirst(useCases: UseCaseCard[]): UseCaseCard[] {
  return [...useCases].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt);
    const rightTime = Date.parse(right.updatedAt);
    return (Number.isNaN(leftTime) ? 0 : leftTime) -
      (Number.isNaN(rightTime) ? 0 : rightTime);
  });
}

export function buildRegisterActivationSnapshot(input: {
  useCases: UseCaseCard[];
  externalSubmissions: ExternalSubmission[];
  register: Register | null;
  now?: Date;
}): RegisterActivationSnapshot {
  const now = input.now ?? new Date();
  const useCases = oldestFirst(
    input.useCases.filter((useCase) => !useCase.isDeleted),
  );
  const progress: RegisterActivationProgress = {
    documentedUseCases: useCases.length,
    targetUseCases: 3,
    useCasesWithOwner: useCases.filter(hasOwner).length,
    completedReviews: useCases.filter(
      (useCase) =>
        useCase.status === 'REVIEWED' || useCase.status === 'PROOF_READY',
    ).length,
    sharedPasses: useCases.filter(
      (useCase) =>
        useCase.status === 'PROOF_READY' &&
        useCase.isPublicVisible === true &&
        Boolean(useCase.publicHashId),
    ).length,
  };

  if (useCases.length === 0) {
    return {
      progress,
      nextAction: {
        kind: 'capture_first',
        owner: 'Sie oder eine eingeladene Fachperson',
        reasonKey: 'no_use_cases',
      },
    };
  }

  const pendingSubmission = input.externalSubmissions
    .filter((submission) => submission.status === 'submitted')
    .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))[0];
  if (pendingSubmission) {
    return {
      progress,
      nextAction: {
        kind: 'external_submission',
        submissionId: pendingSubmission.submissionId,
        owner: resolveRegisterReviewOwner(input.register),
        reasonKey: 'external_response_waiting',
      },
    };
  }

  const missingOwner = useCases.find((useCase) => !hasOwner(useCase));
  if (missingOwner) {
    return {
      progress,
      nextAction: {
        kind: 'assign_owner',
        useCaseId: missingOwner.useCaseId,
        owner: resolveRegisterReviewOwner(input.register),
        reasonKey: 'owner_missing',
      },
    };
  }

  const overdueReview = useCases.find(
    (useCase) => reviewState(useCase, now) === 'overdue',
  );
  if (overdueReview) {
    return {
      progress,
      nextAction: {
        kind: 'review_overdue',
        useCaseId: overdueReview.useCaseId,
        owner: resolveUseCaseOwner(overdueReview, input.register),
        reasonKey: 'review_overdue',
      },
    };
  }

  const dueReview = useCases.find(
    (useCase) => reviewState(useCase, now) === 'due',
  );
  if (dueReview) {
    return {
      progress,
      nextAction: {
        kind: 'review_due',
        useCaseId: dueReview.useCaseId,
        owner: resolveUseCaseOwner(dueReview, input.register),
        reasonKey: 'review_due',
      },
    };
  }

  const recommendedReview = useCases.find(
    (useCase) => useCase.status === 'REVIEW_RECOMMENDED',
  );
  if (recommendedReview) {
    return {
      progress,
      nextAction: {
        kind: 'review_recommended',
        useCaseId: recommendedReview.useCaseId,
        owner: resolveUseCaseOwner(recommendedReview, input.register),
        reasonKey: 'review_recommended',
      },
    };
  }

  const shareablePass = useCases.find(
    (useCase) =>
      useCase.status === 'PROOF_READY' && !useCase.isPublicVisible,
  );
  if (shareablePass) {
    return {
      progress,
      nextAction: {
        kind: 'share_pass',
        useCaseId: shareablePass.useCaseId,
        owner: resolveUseCaseOwner(shareablePass, input.register),
        reasonKey: 'proof_ready',
      },
    };
  }

  const firstUnreviewed = useCases.find(
    (useCase) => useCase.status === 'UNREVIEWED',
  ) ?? useCases[0];
  return {
    progress,
    nextAction: {
      kind: 'start_review',
      useCaseId: firstUnreviewed.useCaseId,
      owner: resolveUseCaseOwner(firstUnreviewed, input.register),
      reasonKey: 'first_review',
    },
  };
}
