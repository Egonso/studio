import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { NextRequest } from 'next/server';

import middlewareModule from './middleware';

type MiddlewareFn = (request: NextRequest) => Response;

const runMiddleware: MiddlewareFn =
  typeof middlewareModule === 'function'
    ? middlewareModule
    : (middlewareModule as { default: MiddlewareFn }).default;

function requestFor(url: string, headers?: HeadersInit): NextRequest {
  return new NextRequest(new Request(url, { headers }));
}

test('root middleware re-exports the consolidated src middleware', () => {
  const rootMiddleware = readFileSync(resolve(process.cwd(), 'middleware.ts'), 'utf8');

  assert.match(rootMiddleware, /export \{ config, default \} from '\.\/src\/middleware';/);
});

test('kiregister root redirects to the German locale and keeps query params', () => {
  const response = runMiddleware(requestFor('https://kiregister.com/?utm=test'));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://kiregister.com/de?utm=test');
  assert.match(response.headers.get('set-cookie') ?? '', /NEXT_LOCALE=de/);
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
});

test('legacy favicon paths redirect to the canonical register logo', () => {
  const response = runMiddleware(
    requestFor('https://kiregister.com/favicon.ico?cache=old'),
  );

  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://kiregister.com/register-logo.png');
});

test('course sales domain rewrites the root to the EU AI Act officer landing page', () => {
  const response = runMiddleware(requestFor('https://eukigesetz.com/'));

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('x-middleware-rewrite'),
    'https://eukigesetz.com/de/kurse/eu-ai-act-officer',
  );
});
