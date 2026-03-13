import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_ROUTE_MAP,
  getVisiblePremiumControlNav,
  getProductAreaForPathname,
  getVisibleProductNav,
  isPremiumControlNavActive,
  LEGACY_ROUTE_INVENTORY,
  LEGACY_ROUTE_REDIRECTS,
  ROUTE_HREFS,
  showGlobalFooterForPathname,
  showSiteChatbotForPathname,
} from './route-manifest';

test('canonical route map covers the primary register and control destinations', () => {
  const hrefs = new Set(CANONICAL_ROUTE_MAP.map((entry) => entry.href));

  assert.ok(hrefs.has(ROUTE_HREFS.register));
  assert.ok(hrefs.has(ROUTE_HREFS.useCases));
  assert.ok(hrefs.has(ROUTE_HREFS.externalInbox));
  assert.ok(hrefs.has(ROUTE_HREFS.settings));
  assert.ok(hrefs.has(ROUTE_HREFS.control));
  assert.ok(hrefs.has(ROUTE_HREFS.controlReviews));
  assert.ok(hrefs.has(ROUTE_HREFS.governanceSettings));
  assert.equal(
    ROUTE_HREFS.governanceUpgrade,
    '/settings?section=governance#upgrade-panel',
  );
  assert.ok(hrefs.has(ROUTE_HREFS.controlPolicies));
  assert.ok(hrefs.has(ROUTE_HREFS.controlExports));
  assert.ok(hrefs.has(ROUTE_HREFS.controlTrust));
  assert.ok(hrefs.has(ROUTE_HREFS.controlEnterprise));
  assert.ok(hrefs.has(ROUTE_HREFS.academy));
});

test('free navigation keeps the top-level UI minimal and focused', () => {
  const itemIds = new Set<string>(
    getVisibleProductNav('free').map((item) => item.id),
  );

  assert.ok(itemIds.has('register'));
  assert.ok(itemIds.has('externalInbox'));
  assert.equal(itemIds.has('control'), false);
  assert.equal(itemIds.has('settings'), false);
  assert.equal(itemIds.has('academy'), false);
});

test('paid control navigation only shows destinations available in the active plan', () => {
  const itemIds = new Set(
    getVisiblePremiumControlNav('pro').map((item) => item.id),
  );

  assert.ok(itemIds.has('overview'));
  assert.ok(itemIds.has('reviews'));
  assert.ok(itemIds.has('governanceSettings'));
  assert.ok(itemIds.has('policies'));
  assert.ok(itemIds.has('exports'));
  assert.ok(itemIds.has('trust'));
  assert.ok(itemIds.has('academy'));
  assert.equal(itemIds.has('enterprise'), false);
});

test('legacy redirect config covers the old primary routes', () => {
  const redirects = new Map(
    LEGACY_ROUTE_REDIRECTS.map((entry) => [entry.source, entry.destination]),
  );

  assert.equal(redirects.get('/login'), '/');
  assert.equal(redirects.get('/einrichten'), '/');
  assert.equal(redirects.get('/einladen'), '/');
  assert.equal(
    redirects.get('/control/enterprise'),
    ROUTE_HREFS.controlEnterprise,
  );
  assert.equal(redirects.get('/projects'), ROUTE_HREFS.register);
  assert.equal(redirects.get('/ai-management'), ROUTE_HREFS.control);
  assert.equal(redirects.get('/assessment'), ROUTE_HREFS.register);
  assert.equal(redirects.get('/cbs'), ROUTE_HREFS.controlPolicies);
  assert.equal(redirects.get('/audit-report'), ROUTE_HREFS.controlExports);
  assert.equal(redirects.get('/kurs'), ROUTE_HREFS.academy);
  assert.equal(
    redirects.get('/settings/governance'),
    ROUTE_HREFS.governanceSettings,
  );
});

test('legacy route inventory classifies archived and migrated surfaces', () => {
  const bySource = new Map(
    LEGACY_ROUTE_INVENTORY.map((entry) => [entry.source, entry]),
  );

  assert.equal(bySource.get('/ai-management')?.disposition, 'archive');
  assert.equal(bySource.get('/aims')?.disposition, 'archive');
  assert.equal(bySource.get('/assessment')?.disposition, 'archive');
  assert.equal(bySource.get('/portfolio')?.disposition, 'migrate');
  assert.equal(bySource.get('/audit-report')?.disposition, 'migrate');
  assert.equal(bySource.get('/projects')?.disposition, 'keep_isolated');
});

test('pathname classification keeps marketing, intake, register and control separate', () => {
  assert.equal(getProductAreaForPathname('/'), 'public_marketing');
  assert.equal(
    getProductAreaForPathname('/erfassen'),
    'public_external_intake',
  );
  assert.equal(
    getProductAreaForPathname('/request/token-123'),
    'public_external_intake',
  );
  assert.equal(
    getProductAreaForPathname('/my-register'),
    'signed_in_free_register',
  );
  assert.equal(
    getProductAreaForPathname('/my-register/abc'),
    'signed_in_free_register',
  );
  assert.equal(
    getProductAreaForPathname('/control'),
    'paid_governance_control',
  );
  assert.equal(
    getProductAreaForPathname('/control/reviews'),
    'paid_governance_control',
  );
  assert.equal(
    getProductAreaForPathname('/settings/governance'),
    'signed_in_free_register',
  );
  assert.equal(
    getProductAreaForPathname('/academy'),
    'paid_governance_control',
  );
});

test('governance settings nav stays active on the unified settings page', () => {
  const governanceSettingsItem = getVisiblePremiumControlNav('pro').find(
    (item) => item.id === 'governanceSettings',
  );

  assert.ok(governanceSettingsItem);
  assert.equal(
    isPremiumControlNavActive(governanceSettingsItem!, '/settings', {
      get(name: string) {
        return name === 'section' ? 'governance' : null;
      },
    }),
    true,
  );
});

test('global chrome hides footer and chatbot on intake and app shells', () => {
  assert.equal(showGlobalFooterForPathname('/'), false);
  assert.equal(showGlobalFooterForPathname('/erfassen'), false);
  assert.equal(showGlobalFooterForPathname('/my-register'), false);
  assert.equal(showGlobalFooterForPathname('/gesetz'), true);

  assert.equal(showSiteChatbotForPathname('/'), false);
  assert.equal(showSiteChatbotForPathname('/erfassen'), false);
  assert.equal(showSiteChatbotForPathname('/control'), false);
});
