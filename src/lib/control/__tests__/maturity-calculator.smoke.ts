import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import type { OrgSettings, UseCaseCard } from '@/lib/register-first/types';
import { calculateControlOverview } from '../maturity-calculator';

function createBaseUseCase(useCaseId: string): UseCaseCard {
  return {
    cardVersion: '1.1',
    useCaseId,
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
    purpose: 'Dokumentierter KI-Einsatzfall',
    usageContexts: ['INTERNAL_ONLY'],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: null,
    },
    decisionImpact: 'YES',
    affectedParties: ['INTERNAL_PROCESSES'],
    status: 'UNREVIEWED',
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  };
}

function createOrgSettings(): OrgSettings {
  return {
    organisationName: 'EUKI Test Organisation',
    industry: 'Education',
    contactPerson: {
      name: 'Test Person',
      email: 'test@example.com',
    },
    aiPolicy: {
      url: 'https://example.com/ai-policy',
    },
    incidentProcess: {
      url: 'https://example.com/incident-process',
    },
  };
}

function createPartialMaturitySet(now: Date): UseCaseCard[] {
  const dueInTenDays = new Date(
    now.getTime() + 10 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const overdueByFiveDays = new Date(
    now.getTime() - 5 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const controlledHighRisk: UseCaseCard = {
    ...createBaseUseCase('uc_controlled'),
    governanceAssessment: {
      core: {
        aiActCategory: 'Hochrisiko',
        oversightDefined: true,
        reviewCycleDefined: true,
        documentationLevelDefined: true,
      },
      flex: {
        policyLinks: ['POL-1'],
        iso: {
          reviewCycle: 'quarterly',
          oversightModel: 'HITL',
          documentationLevel: 'extended',
          lifecycleStatus: 'active',
          nextReviewAt: dueInTenDays,
        },
      },
    },
    reviews: [
      {
        reviewId: 'review-1',
        reviewedAt: '2026-02-15T10:00:00.000Z',
        reviewedBy: 'owner-1',
        nextStatus: 'REVIEWED',
      },
    ],
    statusHistory: [
      {
        from: 'UNREVIEWED',
        to: 'REVIEWED',
        changedAt: '2026-02-15T10:00:00.000Z',
        changedBy: 'owner-1',
        changedByName: 'Owner One',
      },
    ],
    proof: {
      verifyUrl: 'https://example.com/proof/1',
      generatedAt: '2026-02-16T10:00:00.000Z',
      verification: {
        isReal: true,
        isCurrent: true,
        scope: 'Test Scope',
      },
    },
  };

  const weakSystem: UseCaseCard = {
    ...createBaseUseCase('uc_weak'),
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: null,
    },
    governanceAssessment: {
      core: {
        aiActCategory: 'Minimales Risiko',
      },
      flex: {
        iso: {
          reviewCycle: 'unknown',
          oversightModel: 'unknown',
          documentationLevel: 'unknown',
          lifecycleStatus: 'pilot',
          nextReviewAt: overdueByFiveDays,
        },
      },
    },
  };

  return [controlledHighRisk, weakSystem];
}

function createAuditReadySet(now: Date): UseCaseCard[] {
  const useCases = ['uc_a', 'uc_b', 'uc_c'].map((id, index) => {
    const nextReviewAt = new Date(
      now.getTime() + (index + 7) * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      ...createBaseUseCase(id),
      governanceAssessment: {
        core: {
          aiActCategory: index === 0 ? 'Hochrisiko' : 'Minimales Risiko',
          oversightDefined: true,
          reviewCycleDefined: true,
          documentationLevelDefined: true,
        },
        flex: {
          policyLinks: ['POL-BASE', `POL-${index + 1}`],
          iso: {
            reviewCycle: 'quarterly',
            oversightModel: 'HITL',
            documentationLevel: 'extended',
            lifecycleStatus: 'active',
            nextReviewAt,
          },
        },
      },
      reviews: [
        {
          reviewId: `review-${id}`,
          reviewedAt: '2026-02-18T10:00:00.000Z',
          reviewedBy: `owner-${id}`,
          nextStatus: 'REVIEWED',
        },
      ],
      statusHistory: [
        {
          from: 'UNREVIEWED',
          to: 'REVIEWED',
          changedAt: '2026-02-18T10:00:00.000Z',
          changedBy: `owner-${id}`,
          changedByName: `Owner ${id}`,
        },
      ],
      proof: {
        verifyUrl: `https://example.com/proof/${id}`,
        generatedAt: '2026-02-19T10:00:00.000Z',
        verification: {
          isReal: true,
          isCurrent: true,
          scope: 'Audit Scope',
        },
      },
    } satisfies UseCaseCard;
  });

  return useCases;
}

function createReviewGapSet(): UseCaseCard[] {
  const reviewGap: UseCaseCard = {
    ...createBaseUseCase('uc_review_gap'),
    governanceAssessment: {
      core: {
        aiActCategory: 'Minimales Risiko',
      },
      flex: {
        iso: {
          reviewCycle: 'unknown',
          oversightModel: 'unknown',
          documentationLevel: 'unknown',
          lifecycleStatus: 'pilot',
        },
      },
    },
  };

  return [reviewGap];
}

export function runMaturityCalculatorSmoke() {
  const now = new Date('2026-02-26T12:00:00.000Z');

  const partialOverview = calculateControlOverview(
    createPartialMaturitySet(now),
    null,
    now,
  );
  assert.equal(partialOverview.kpis.totalSystems, 2);
  assert.equal(partialOverview.kpis.highRiskCount, 1);
  assert.equal(partialOverview.kpis.highRiskPercent, 50);
  assert.equal(partialOverview.kpis.reviewsDue, 1);
  assert.equal(partialOverview.kpis.reviewsOverdue, 1);
  assert.equal(partialOverview.kpis.systemsWithoutOwner, 1);
  assert.equal(partialOverview.kpis.governanceScore, 75);
  assert.equal(partialOverview.kpis.isoReadinessPercent, 68);
  assert.equal(partialOverview.maturity.currentLevel, 1);
  assert.equal(partialOverview.maturity.levels[0].fulfilled, true);
  assert.equal(partialOverview.maturity.levels[1].fulfilled, false);
  assert.match(
    partialOverview.maturity.levels[1].criteria[1].actionHref ?? '',
    /^\/my-register\/[^?]+\?focus=owner&edit=1$/,
  );
  assert.equal(
    partialOverview.maturity.levels[1].criteria[1].actionLabel,
    'Owner ergänzen',
  );

  const reviewGapOverview = calculateControlOverview(
    createReviewGapSet(),
    null,
    now,
  );
  assert.match(
    reviewGapOverview.maturity.levels[2].criteria[1].actionHref ?? '',
    /^\/my-register\/[^?]+\?focus=governance&edit=1&field=reviewCycle$/,
  );
  assert.equal(
    partialOverview.maturity.levels[3].criteria[2].actionHref,
    '/settings?section=governance',
  );
  assert.match(
    partialOverview.maturity.levels[4].criteria[1].actionHref ?? '',
    /^\/my-register\/[^?]+\?focus=governance&field=history$/,
  );

  const auditReadyOverview = calculateControlOverview(
    createAuditReadySet(now),
    createOrgSettings(),
    now,
  );
  assert.equal(auditReadyOverview.kpis.totalSystems, 3);
  assert.equal(auditReadyOverview.kpis.highRiskCount, 1);
  assert.equal(auditReadyOverview.kpis.systemsWithoutOwner, 0);
  assert.equal(auditReadyOverview.kpis.governanceScore, 100);
  assert.equal(auditReadyOverview.kpis.isoReadinessPercent, 100);
  assert.equal(auditReadyOverview.maturity.currentLevel, 5);
  assert.equal(auditReadyOverview.maturity.levels[4].fulfilled, true);

  console.log('Control maturity-calculator smoke tests passed.');
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runMaturityCalculatorSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
