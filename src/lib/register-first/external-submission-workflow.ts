import type {
  ExternalSubmission,
  ExternalSubmissionStatus,
  Register,
} from './types';

export interface ExternalSubmissionWorkflow {
  status: ExternalSubmissionStatus;
  statusLabel: string;
  ownerLabel: string;
  nextActionLabel: string;
}

const STATUS_LABELS: Record<ExternalSubmissionStatus, string> = {
  submitted: 'Eingegangen',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
  merged: 'Übernommen',
};

function resolveOwnerLabel(register: Register | null): string {
  return (
    register?.orgSettings?.raci?.reviewOwner?.name?.trim() ||
    register?.orgSettings?.contactPerson?.name?.trim() ||
    'Registerverantwortung'
  );
}

function resolveNextActionLabel(submission: ExternalSubmission): string {
  if (submission.status === 'submitted') {
    return 'Interne Prüfung erforderlich';
  }

  if (
    submission.status === 'approved' &&
    submission.sourceType === 'supplier_request' &&
    !submission.linkedUseCaseId
  ) {
    return 'Use Case anlegen';
  }

  if (submission.status === 'merged') {
    return 'Im Register weiterführen';
  }

  if (submission.status === 'rejected') {
    return 'Keine weitere Aktion';
  }

  return 'Dokumentiert';
}

export function resolveExternalSubmissionWorkflow(
  submission: ExternalSubmission,
  register: Register | null,
): ExternalSubmissionWorkflow {
  return {
    status: submission.status,
    statusLabel: STATUS_LABELS[submission.status],
    ownerLabel: resolveOwnerLabel(register),
    nextActionLabel: resolveNextActionLabel(submission),
  };
}
