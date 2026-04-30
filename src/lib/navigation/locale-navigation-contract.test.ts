import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function readSource(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), 'utf8');
}

function assertNoNextRouter(filePath: string) {
  const source = readSource(filePath);

  assert.doesNotMatch(
    source,
    /import\s+\{[^}]*\buseRouter\b[^}]*\}\s+from\s+['"]next\/navigation['"]/,
  );
  assert.match(
    source,
    /import\s+\{[^}]*\buseRouter\b[^}]*\}\s+from\s+['"]@\/i18n\/navigation['"]/,
  );
}

test('register use-case navigation keeps the active locale prefix', () => {
  const routerFiles = [
    'src/app/[locale]/my-register/page.tsx',
    'src/app/[locale]/my-register/[useCaseId]/page.tsx',
    'src/components/register/register-board.tsx',
    'src/components/register/detail/use-case-header.tsx',
    'src/components/register/detail/use-case-metadata-section.tsx',
    'src/components/layout/workspace-switcher.tsx',
  ];

  for (const filePath of routerFiles) {
    assertNoNextRouter(filePath);
  }

  const boardSource = readSource('src/components/register/register-board.tsx');
  assert.match(boardSource, /router\.push\(\s*buildScopedUseCaseDetailHref\(/);
});

test('register detail pass links use locale-aware links', () => {
  const linkFiles = [
    'src/app/[locale]/my-register/[useCaseId]/page.tsx',
    'src/components/register/detail/proof-readiness-summary.tsx',
    'src/components/register/detail/review-section.tsx',
  ];

  for (const filePath of linkFiles) {
    const source = readSource(filePath);

    assert.doesNotMatch(source, /from\s+['"]next\/link['"]/);
    assert.match(source, /import\s+\{[^}]*\bLink\b[^}]*\}\s+from\s+['"]@\/i18n\/navigation['"]/);
  }
});
