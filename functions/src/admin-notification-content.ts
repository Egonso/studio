export type AdminNotificationContent = {
  subject: string;
  text: string;
  html: string;
};

type RegistrationNotificationInput = {
  email?: string | null;
  displayName?: string | null;
  createdAt?: string | null;
  emailVerified: boolean;
  providers: string[];
};

type FeedbackNotificationInput = {
  type?: string | null;
  message?: string | null;
  path?: string | null;
  userEmail?: string | null;
  createdAt?: string | null;
};

const ADMIN_URL = 'https://kiregister.com/de/admin';
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_ADMIN_RECIPIENTS = [
  'mo.feich@gmail.com',
  'zoltangal@web.de',
] as const;

function singleLine(
  value: string | null | undefined,
  fallback = 'Nicht angegeben',
): string {
  const normalized = value?.replace(/[\r\n\t]+/g, ' ').trim();
  return normalized || fallback;
}

function messageText(value: string | null | undefined): string {
  const normalized = value?.replace(/\r\n?/g, '\n').trim();
  return normalized || 'Keine Nachricht angegeben.';
}

function subjectPart(value: string): string {
  return singleLine(value).slice(0, 160);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatViennaDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Nicht angegeben';
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return 'Nicht angegeben';
  }

  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Europe/Vienna',
  }).format(parsed);
}

function feedbackLabel(value: string | null | undefined): string {
  switch (value) {
    case 'bug':
      return 'Bug-Report';
    case 'feature':
      return 'Feature Request';
    case 'support':
      return 'Support-Anfrage';
    default:
      return 'Feedback';
  }
}

function detailsHtml(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('');
}

export function parseAdminNotificationRecipients(value: string): string[] {
  const rawRecipients = value
    .split(/[;,]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (rawRecipients.length === 0) {
    throw new Error('ADMIN_NOTIFICATION_EMAILS enthält keine Empfänger.');
  }

  const invalid = rawRecipients.filter(
    (recipient) => !SIMPLE_EMAIL_PATTERN.test(recipient),
  );
  if (invalid.length > 0) {
    throw new Error('ADMIN_NOTIFICATION_EMAILS enthält ungültige Empfänger.');
  }

  const recipients = [...new Set(rawRecipients)];
  if (
    recipients.length !== REQUIRED_ADMIN_RECIPIENTS.length ||
    REQUIRED_ADMIN_RECIPIENTS.some(
      (requiredRecipient) => !recipients.includes(requiredRecipient),
    )
  ) {
    throw new Error(
      'ADMIN_NOTIFICATION_EMAILS muss exakt die beiden KIRegister-Admins enthalten.',
    );
  }

  return recipients;
}

export function buildRegistrationNotification(
  input: RegistrationNotificationInput,
): AdminNotificationContent {
  const email = singleLine(input.email, 'Keine E-Mail-Adresse');
  const name = singleLine(input.displayName);
  const createdAt = formatViennaDateTime(input.createdAt);
  const providers =
    input.providers.length > 0
      ? input.providers.map((provider) => singleLine(provider)).join(', ')
      : 'Admin/API oder nicht angegeben';
  const verified = input.emailVerified ? 'Ja' : 'Nein';
  const rows: Array<[string, string]> = [
    ['Zeit', createdAt],
    ['E-Mail', email],
    ['Name', name],
    ['Anmeldung über', providers],
    ['E-Mail bestätigt', verified],
  ];

  return {
    subject: `[KIRegister] Neue Anmeldung: ${subjectPart(email)}`,
    text: [
      'Neue Anmeldung bei KIRegister.com',
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      `Admin: ${ADMIN_URL}`,
    ].join('\n'),
    html: [
      '<h1>Neue Anmeldung bei KIRegister.com</h1>',
      detailsHtml(rows),
      `<p><a href="${ADMIN_URL}">Admin öffnen</a></p>`,
    ].join(''),
  };
}

export function buildFeedbackNotification(
  input: FeedbackNotificationInput,
): AdminNotificationContent {
  const label = feedbackLabel(input.type);
  const createdAt = formatViennaDateTime(input.createdAt);
  const email = singleLine(input.userEmail, 'Keine E-Mail-Adresse');
  const path = singleLine(input.path);
  const message = messageText(input.message);
  const rows: Array<[string, string]> = [
    ['Eingang', createdAt],
    ['Kontaktangabe', `${email} (nicht als Absender verifiziert)`],
    ['Seite', path],
  ];

  return {
    subject: `[KIRegister] Neuer ${label}`,
    text: [
      `${label} bei KIRegister.com`,
      '',
      ...rows.map(([rowLabel, value]) => `${rowLabel}: ${value}`),
      '',
      'Nachricht:',
      message,
      '',
      `Admin: ${ADMIN_URL}`,
    ].join('\n'),
    html: [
      `<h1>${escapeHtml(label)} bei KIRegister.com</h1>`,
      detailsHtml(rows),
      '<p><strong>Nachricht:</strong></p>',
      `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>`,
      `<p><a href="${ADMIN_URL}">Admin öffnen</a></p>`,
    ].join(''),
  };
}
