import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { resolveAppHeaderBrandHref } from './app-header-brand';

function readSource(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), 'utf8');
}

test('app header brand link keeps default routing but allows explicit overrides', () => {
  assert.equal(
    resolveAppHeaderBrandHref({
      area: 'signed_in_free_register',
      isAuthenticated: true,
      scopedRegisterHref: '/my-register?workspace=acme',
      scopedControlHref: '/control?workspace=acme',
    }),
    '/my-register?workspace=acme',
  );

  assert.equal(
    resolveAppHeaderBrandHref({
      area: 'paid_governance_control',
      isAuthenticated: true,
      scopedRegisterHref: '/my-register?workspace=acme',
      scopedControlHref: '/control?workspace=acme',
    }),
    '/control?workspace=acme',
  );

  assert.equal(
    resolveAppHeaderBrandHref({
      area: 'paid_governance_control',
      isAuthenticated: true,
      scopedRegisterHref: '/my-register?workspace=acme',
      scopedControlHref: '/control?workspace=acme',
      overrideHref: '/my-register?workspace=acme',
    }),
    '/my-register?workspace=acme',
  );

  assert.equal(
    resolveAppHeaderBrandHref({
      area: null,
      isAuthenticated: true,
      scopedRegisterHref: '/my-register?workspace=acme',
      scopedControlHref: '/control?workspace=acme',
    }),
    '/my-register?workspace=acme',
  );

  assert.equal(
    resolveAppHeaderBrandHref({
      area: 'paid_governance_control',
      isAuthenticated: false,
      scopedRegisterHref: '/my-register?workspace=acme',
      scopedControlHref: '/control?workspace=acme',
      overrideHref: '/my-register?workspace=acme',
    }),
    '/',
  );
});

test('signed-in frame passes an explicit brandHref contract into AppHeader', () => {
  const shellSource = readSource('src/components/product-shells.tsx');

  assert.match(shellSource, /brandHref\?: string;/);
  assert.match(shellSource, /<AppHeader brandHref={brandHref} \/>/);
});

test('free report mode overrides the brand back to the register while trust keeps the default control brand', () => {
  const controlSource = readSource('src/app/control/page.tsx');
  const trustSource = readSource('src/app/control/trust/page.tsx');

  assert.match(
    controlSource,
    /const headerBrandHref = isReportOnlyMode \? scopedHrefs\.register : undefined;/,
  );
  assert.match(controlSource, /brandHref={headerBrandHref}/);
  assert.doesNotMatch(trustSource, /brandHref=/);
});
