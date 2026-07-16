import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRegisterActivationSnapshot,
} from './register-activation';
import type { ExternalSubmission, UseCaseCard } from './types';

function useCase(
  id: string,
  patch: Partial<UseCaseCard> = {},
): UseCaseCard {
  return {
    cardVersion: '1.1',
    useCaseId: id,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    purpose: `Use case ${id}`,
    usageContexts: ['INTERNAL_ONLY'],
    responsibility: { isCurrentlyResponsible: false, responsibleParty: 'Owner' },
    decisionImpact: 'UNSURE',
    affectedParties: [],
    status: 'UNREVIEWED',
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
    ...patch,
  };
}

test('activation starts with a real use case instead of zero metrics', () => {
  const snapshot = buildRegisterActivationSnapshot({
    useCases: [],
    externalSubmissions: [],
    register: null,
  });
  assert.equal(snapshot.nextAction.kind, 'capture_first');
  assert.equal(snapshot.progress.documentedUseCases, 0);
});

test('external response outranks missing owner and reviews', () => {
  const submission = {
    submissionId: 'submission_1',
    registerId: 'register_1',
    ownerId: 'owner_1',
    sourceType: 'supplier_request',
    submittedAt: '2026-07-10T00:00:00.000Z',
    rawPayloadSnapshot: {},
    status: 'submitted',
  } satisfies ExternalSubmission;
  const snapshot = buildRegisterActivationSnapshot({
    useCases: [
      useCase('uc_1', {
        responsibility: { isCurrentlyResponsible: false, responsibleParty: null },
      }),
    ],
    externalSubmissions: [submission],
    register: null,
  });
  assert.equal(snapshot.nextAction.kind, 'external_submission');
});

test('missing owner outranks overdue review and proof sharing', () => {
  const snapshot = buildRegisterActivationSnapshot({
    useCases: [
      useCase('missing_owner', {
        responsibility: { isCurrentlyResponsible: false, responsibleParty: null },
      }),
      useCase('overdue', {
        governanceAssessment: {
          core: {},
          flex: {
            iso: {
              reviewCycle: 'monthly',
              oversightModel: 'HITL',
              documentationLevel: 'standard',
              lifecycleStatus: 'active',
              nextReviewAt: '2026-07-01T00:00:00.000Z',
            },
          },
        },
      }),
    ],
    externalSubmissions: [],
    register: null,
    now: new Date('2026-07-16T00:00:00.000Z'),
  });
  assert.equal(snapshot.nextAction.kind, 'assign_owner');
  assert.equal(snapshot.nextAction.useCaseId, 'missing_owner');
});
