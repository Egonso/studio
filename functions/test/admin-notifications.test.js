const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildFeedbackNotification,
  buildRegistrationNotification,
  parseAdminNotificationRecipients,
} = require('../lib/admin-notification-content.js');
const {
  notificationDocumentId,
  resolveClaimState,
} = require('../lib/admin-notification-state.js');
const {
  EmailitApiError,
  EmailitNetworkError,
  isRetryableEmailitError,
  sendEmailitRawEmail,
} = require('../lib/emailit.js');

test('parses the two configured admin recipients and rejects invalid input', () => {
  assert.deepEqual(
    parseAdminNotificationRecipients(
      'mo.feich@gmail.com, zoltangal@web.de;MO.FEICH@gmail.com',
    ),
    ['mo.feich@gmail.com', 'zoltangal@web.de'],
  );
  assert.throws(() => parseAdminNotificationRecipients(''));
  assert.throws(() => parseAdminNotificationRecipients('not-an-email'));
  assert.throws(() =>
    parseAdminNotificationRecipients('mo.feich@gmail.com'),
  );
  assert.throws(() =>
    parseAdminNotificationRecipients(
      'mo.feich@gmail.com,zoltangal@web.de,extra@example.com',
    ),
  );
});

test('claims new or retryable events and respects terminal states and leases', () => {
  const now = Date.parse('2026-07-30T07:00:00.000Z');

  assert.equal(resolveClaimState(undefined, 0, now), 'claim');
  assert.equal(resolveClaimState('failed_retryable', 0, now), 'claim');
  assert.equal(resolveClaimState('attempting', now - 1, now), 'claim');
  assert.equal(resolveClaimState('attempting', now + 60_000, now), 'busy');
  assert.equal(resolveClaimState('accepted', 0, now), 'complete');
  assert.equal(resolveClaimState('failed_permanent', 0, now), 'complete');
});

test('uses deterministic and event-specific delivery document ids', () => {
  const authId = notificationDocumentId('auth_user_created', 'same-source');
  const repeatedAuthId = notificationDocumentId(
    'auth_user_created',
    'same-source',
  );
  const feedbackId = notificationDocumentId(
    'feedback_created',
    'same-source',
  );

  assert.equal(authId, repeatedAuthId);
  assert.notEqual(authId, feedbackId);
  assert.match(authId, /^auth_user_created_[a-f0-9]{32}$/);
});

test('builds a concise registration notification', () => {
  const content = buildRegistrationNotification({
    email: 'person@example.com',
    displayName: 'Person',
    createdAt: '2026-07-30T07:00:00.000Z',
    emailVerified: false,
    providers: ['password'],
  });

  assert.equal(
    content.subject,
    '[KIRegister] Neue Anmeldung: person@example.com',
  );
  assert.match(content.text, /E-Mail bestätigt: Nein/);
  assert.match(content.text, /30\.07\.2026, 09:00:00/);
  assert.match(content.html, /Admin öffnen/);
});

test('escapes untrusted feedback in HTML and keeps it readable in text', () => {
  const content = buildFeedbackNotification({
    type: 'bug',
    message: '<img src=x onerror=alert(1)>',
    path: '/de/control',
    userEmail: 'person@example.com',
    createdAt: '2026-07-30T07:00:00.000Z',
  });

  assert.equal(content.subject, '[KIRegister] Neuer Bug-Report');
  assert.doesNotMatch(content.html, /<img/);
  assert.match(content.html, /&lt;img/);
  assert.match(content.text, /<img src=x onerror=alert\(1\)>/);
  assert.doesNotMatch(content.html, /userAgent/i);
});

test('sends raw Emailit payload with text and HTML but no template', async () => {
  const originalFetch = global.fetch;
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({ id: 'em_test', status: 'pending' }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const result = await sendEmailitRawEmail({
      apiKey: 'test-key',
      from: 'sender@example.com',
      to: ['one@example.com', 'two@example.com'],
      subject: 'Subject',
      html: '<p>Body</p>',
      text: 'Body',
      idempotencyKey: 'notification-test',
    });

    assert.deepEqual(result, { id: 'em_test', status: 'pending' });
    assert.equal(requestBody.template, undefined);
    assert.equal(requestBody.subject, 'Subject');
    assert.equal(requestBody.html, '<p>Body</p>');
    assert.equal(requestBody.text, 'Body');
    assert.deepEqual(requestBody.to, ['one@example.com', 'two@example.com']);
  } finally {
    global.fetch = originalFetch;
  }
});

test('retries only Emailit 429, 5xx, and network failures', async () => {
  const originalFetch = global.fetch;

  try {
    for (const [status, retryable] of [
      [400, false],
      [401, false],
      [429, true],
      [500, true],
    ]) {
      global.fetch = async () =>
        new Response(JSON.stringify({ message: 'failed' }), {
          status,
          headers: { 'content-type': 'application/json' },
        });

      await assert.rejects(
        sendEmailitRawEmail({
          apiKey: 'test-key',
          from: 'sender@example.com',
          to: 'one@example.com',
          subject: 'Subject',
          html: '<p>Body</p>',
          text: 'Body',
        }),
        (error) =>
          error instanceof EmailitApiError &&
          error.status === status &&
          error.retryable === retryable &&
          isRetryableEmailitError(error) === retryable,
      );
    }

    global.fetch = async () => {
      throw new TypeError('network unavailable');
    };
    await assert.rejects(
      sendEmailitRawEmail({
        apiKey: 'test-key',
        from: 'sender@example.com',
        to: 'one@example.com',
        subject: 'Subject',
        html: '<p>Body</p>',
        text: 'Body',
      }),
      (error) =>
        error instanceof EmailitNetworkError &&
        isRetryableEmailitError(error),
    );

    assert.equal(isRetryableEmailitError(new Error('programming error')), false);
  } finally {
    global.fetch = originalFetch;
  }
});
