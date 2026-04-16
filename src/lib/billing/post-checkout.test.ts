import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBillingWelcomePath } from './post-checkout';

test('buildBillingWelcomePath keeps checkout state on the welcome route', () => {
  assert.equal(
    buildBillingWelcomePath('cs_live_123', { source: 'checkout', first_run: true }),
    '/control/welcome?checkout_session_id=cs_live_123&source=checkout&first_run=true',
  );
});

test('buildBillingWelcomePath carries a return target for post-checkout redirects', () => {
  assert.equal(
    buildBillingWelcomePath('cs_live_123', {
      returnTo: '/de/academy/grundkurs/das-fehlende-bindeglied',
      source: 'checkout',
    }),
    '/control/welcome?checkout_session_id=cs_live_123&returnTo=%2Fde%2Facademy%2Fgrundkurs%2Fdas-fehlende-bindeglied&source=checkout',
  );
});
