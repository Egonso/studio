import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';

import {
  normalizePrivateKey,
  parseServiceAccountJson,
  validatePrivateKey,
} from '@/lib/firebase-admin-credentials';

function createTestPrivateKey(): string {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  return privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }) as string;
}

test('normalizePrivateKey repairs escaped newline PEM values', () => {
  const privateKey = createTestPrivateKey();
  const escaped = privateKey.replace(/\n/g, '\\n');

  assert.equal(normalizePrivateKey(escaped), privateKey);
});

test('validatePrivateKey accepts whitespace-compressed PEM values', () => {
  const privateKey = createTestPrivateKey();
  const singleLine = privateKey.replace(/\n/g, ' ');
  const result = validatePrivateKey(singleLine);

  assert.equal(result.ok, true);
});

test('validatePrivateKey rejects truncated PEM values', () => {
  const result = validatePrivateKey(
    '-----BEGIN PRIVATE KEY----- invalid -----END PRIVATE KEY-----',
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /decoder|pem|unsupported|invalid/i);
});

test('parseServiceAccountJson parses nested string payloads', () => {
  const payload = JSON.stringify(
    JSON.stringify({
      project_id: 'project-1',
      client_email: 'firebase-admin@example.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    }),
  );

  const parsed = parseServiceAccountJson(payload);

  assert.deepEqual(parsed, {
    project_id: 'project-1',
    client_email: 'firebase-admin@example.com',
    private_key: '-----BEGIN PRIVATE KEY-----\\\\nabc\\\\n-----END PRIVATE KEY-----\\\\n',
  });
});
