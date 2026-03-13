import assert from 'node:assert/strict';
import test from 'node:test';

import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { getGovernanceUpgradePrompt } from './governance-upgrade';

test('free workspaces with review pressure are routed to control overview', () => {
  const prompt = getGovernanceUpgradePrompt({
    plan: 'free',
    totalUseCases: 4,
    openReviews: 2,
    externalInboxCount: 1,
    publicCount: 0,
    hasExtendedGovernanceConfig: false,
  });

  assert.ok(prompt);
  assert.equal(prompt?.href, ROUTE_HREFS.control);
});

test('free workspaces with visible public evidence are routed to trust', () => {
  const prompt = getGovernanceUpgradePrompt({
    plan: 'free',
    totalUseCases: 3,
    openReviews: 0,
    externalInboxCount: 0,
    publicCount: 1,
    hasExtendedGovernanceConfig: true,
  });

  assert.ok(prompt);
  assert.equal(prompt?.href, ROUTE_HREFS.controlTrust);
});

test('paid plans do not see free-to-premium prompts', () => {
  const prompt = getGovernanceUpgradePrompt({
    plan: 'pro',
    totalUseCases: 9,
    openReviews: 4,
    externalInboxCount: 3,
    publicCount: 2,
    hasExtendedGovernanceConfig: false,
  });

  assert.equal(prompt, null);
});
