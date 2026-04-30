import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDeterministicPolicyPreview } from '@/lib/control/policy/coverage';
import type { OrgSettings, Register, UseCaseCard } from '@/lib/register-first/types';

const register = {
  registerId: 'reg_localization',
  organisationName: 'Localization Test GmbH',
} as unknown as Register;

const orgSettings = {
  organisationName: 'Localization Test GmbH',
  industry: 'Software',
  contactPerson: {
    name: 'Alex Example',
    email: 'alex@example.test',
  },
} as unknown as OrgSettings;

const useCases = [
  {
    useCaseId: 'uc_limited',
    purpose: 'Customer chatbot',
    usageContexts: ['CUSTOMERS'],
    governanceAssessment: {
      core: {
        aiActCategory: 'LIMITED',
      },
      flex: {
        policyLinks: ['pol_test'],
      },
    },
  },
] as unknown as UseCaseCard[];

test('policy preview renders English section titles and copy for English locale', () => {
  const preview = buildDeterministicPolicyPreview(
    register,
    useCases,
    orgSettings,
    3,
    new Date('2026-04-26T12:00:00.000Z'),
    'en',
  );

  assert.match(preview.markdown, /## Transparency Obligations/);
  assert.match(preview.markdown, /Transparency obligations under Art\. 50/);
  assert.doesNotMatch(
    preview.markdown,
    /Transparenzpflichten|Hochrisiko|Richtlinie|Überprüfung|Aufsicht|Einsatzfall|Vorfälle/
  );
});

test('policy preview renders German section titles and copy for German locale', () => {
  const preview = buildDeterministicPolicyPreview(
    register,
    useCases,
    orgSettings,
    3,
    new Date('2026-04-26T12:00:00.000Z'),
    'de',
  );

  assert.match(preview.markdown, /## Transparenzpflichten/);
  assert.match(preview.markdown, /Transparenzpflichten nach Art\. 50/);
  assert.doesNotMatch(preview.markdown, /## Transparency Obligations/);
});
