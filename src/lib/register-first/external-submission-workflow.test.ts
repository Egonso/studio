import assert from 'node:assert/strict';
import test from 'node:test';

import type { ExternalSubmission, Register } from './types';
import { resolveExternalSubmissionWorkflow } from './external-submission-workflow';

const baseSubmission: ExternalSubmission = {
  submissionId: 'submission_1',
  registerId: 'register_1',
  ownerId: 'owner_1',
  sourceType: 'supplier_request',
  submittedAt: '2026-07-16T12:00:00.000Z',
  rawPayloadSnapshot: {},
  status: 'submitted',
};

const register: Register = {
  registerId: 'register_1',
  name: 'KI-Register',
  createdAt: '2026-07-16T12:00:00.000Z',
  orgSettings: {
    organisationName: 'Muster GmbH',
    industry: 'Dienstleistung',
    contactPerson: { name: 'Kontaktperson', email: 'kontakt@example.com' },
    raci: {
      reviewOwner: { name: 'Review Owner', email: 'review@example.com' },
    },
  },
};

test('submitted supplier work is assigned to the review owner', () => {
  const workflow = resolveExternalSubmissionWorkflow(baseSubmission, register);

  assert.equal(workflow.statusLabel, 'Eingegangen');
  assert.equal(workflow.ownerLabel, 'Review Owner');
  assert.equal(workflow.nextActionLabel, 'Interne Prüfung erforderlich');
});

test('approved supplier work without a use case exposes the next real action', () => {
  const workflow = resolveExternalSubmissionWorkflow(
    { ...baseSubmission, status: 'approved' },
    register,
  );

  assert.equal(workflow.nextActionLabel, 'Use Case anlegen');
});
