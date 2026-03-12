import assert from 'node:assert/strict';
import test from 'node:test';

import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import {
  getFeatureUpgradeCtaLabel,
  getFeatureUpgradeHref,
} from './upgrade-paths';

test('feature upgrades point to canonical premium destinations', () => {
  assert.equal(
    getFeatureUpgradeHref('extendedOrgSettings'),
    ROUTE_HREFS.governanceSettings,
  );
  assert.equal(
    getFeatureUpgradeHref('reviewWorkflow'),
    ROUTE_HREFS.controlReviews,
  );
  assert.equal(
    getFeatureUpgradeHref('policyEngine'),
    ROUTE_HREFS.controlPolicies,
  );
  assert.equal(
    getFeatureUpgradeHref('auditExport'),
    ROUTE_HREFS.controlExports,
  );
  assert.equal(getFeatureUpgradeHref('trustPortal'), ROUTE_HREFS.controlTrust);
  assert.equal(getFeatureUpgradeHref('competencyMatrix'), ROUTE_HREFS.academy);
});

test('feature upgrade CTA labels match the destination surface', () => {
  assert.equal(
    getFeatureUpgradeCtaLabel('extendedOrgSettings'),
    'Governance Settings öffnen',
  );
  assert.equal(getFeatureUpgradeCtaLabel('reviewWorkflow'), 'Bericht öffnen');
  assert.equal(getFeatureUpgradeCtaLabel('policyEngine'), 'Policies öffnen');
  assert.equal(getFeatureUpgradeCtaLabel('auditExport'), 'Exports öffnen');
  assert.equal(getFeatureUpgradeCtaLabel('trustPortal'), 'Trust Portal öffnen');
});
