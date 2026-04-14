import '@/lib/server-only-guard';

import { randomUUID } from 'node:crypto';

import { getPublicAppOrigin } from '@/lib/app-url';
import {
  DOCUMENTERO_API_URL,
  resolveDocumenteroApiKey,
  resolveDocumenteroCertificationTemplateId,
} from '@/lib/documentero';
import {
  getAdminDb,
  hasFirebaseAdminCredentials,
} from '@/lib/firebase-admin';

import { buildCertificateBadgeMarkup, CERTIFICATE_BADGE_ASSET_URL } from './badge';
import { LEGACY_EXAM_DEFINITION } from './legacy-question-bank';
import { buildCertificateVerifyUrl } from './public';
import type {
  AdminCertificateDetail,
  AdminCertificationOverview,
  CertificateAuditEvent,
  CertificateDocumentRecord,
  CertificateDocumentProvider,
  CertificateStatus,
  CertificationSettings,
  ExamAttemptRecord,
  ExamSectionResult,
  PersonCertificateRecord,
  PublicCertificateRecord,
  UserCertificationSnapshot,
} from './types';

const CERTIFICATION_DOCUMENT_PROVIDER_ENV_NAME = [
  'CERTIFICATION',
  'DOCUMENT',
  'PROVIDER',
].join('_');
const CERTIFICATION_ENABLE_DOCUMENTERO_ENV_NAME = [
  'CERTIFICATION',
  'ENABLE',
  'DOCUMENTERO',
].join('_');
const CERTIFICATION_DEFAULT_VALIDITY_MONTHS_ENV_NAME = [
  'CERTIFICATION',
  'DEFAULT',
  'VALIDITY',
  'MONTHS',
].join('_');
const CERTIFICATION_FAKE_DOCUMENTS_ENV_NAME = [
  'CERTIFICATION',
  'FAKE',
  'DOCUMENTS',
].join('_');

type GeneratedDocument = {
  url: string;
  provider: CertificateDocumentProvider;
};

type CertificationActor = {
  uid: string;
  email: string;
  displayName?: string | null;
};

type ExamSubmissionResult = {
  attempt: ExamAttemptRecord;
  certificate: PersonCertificateRecord | null;
  document: CertificateDocumentRecord | null;
};

type ManualCertificateInput = {
  email: string;
  holderName: string;
  company?: string | null;
  validityMonths?: number | null;
  userId?: string | null;
};

type CertificateUpdateInput = {
  certificateId: string;
  status?: CertificateStatus;
  validUntil?: string | null;
  note?: string;
};

type MemoryStore = {
  attempts: Map<string, ExamAttemptRecord>;
  certificates: Map<string, PersonCertificateRecord>;
  publicCertificates: Map<string, PublicCertificateRecord>;
  certificateDocuments: Map<string, CertificateDocumentRecord[]>;
  settings: CertificationSettings;
};

type LegacyCertificateRecord = {
  code?: string;
  holder?: {
    name?: string;
    company?: string;
    email?: string;
  };
  dates?: {
    issued?: string;
    validUntil?: string;
  };
  issueDate?: string;
  expiryDate?: string;
  modules?: string[];
  status?: string;
};

type LegacyCertificateDocumentRecord = {
  certificateId?: string;
  url?: string;
  generatedAt?: string;
};

type StoredExamAnswerSection = {
  answers?: number[];
};

type StoredExamAttemptRecord = Omit<ExamAttemptRecord, 'sectionAnswers'> & {
  sectionAnswers: StoredExamAnswerSection[] | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __kiregisterCertificationMemory__: MemoryStore | undefined;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function readServerEnv(name: string): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  return env[name];
}

function getDefaultDocumentProvider(): CertificateDocumentProvider {
  return readServerEnv(CERTIFICATION_DOCUMENT_PROVIDER_ENV_NAME) === 'documentero'
    ? 'documentero'
    : 'native';
}

function isExternalCertificatePdfsEnabled(): boolean {
  return readServerEnv(CERTIFICATION_ENABLE_DOCUMENTERO_ENV_NAME) === '1';
}

function getDefaultValidityMonths(): number {
  return Number.parseInt(
    readServerEnv(CERTIFICATION_DEFAULT_VALIDITY_MONTHS_ENV_NAME) || '12',
    10,
  );
}

function isFakeDocumentModeEnabled(): boolean {
  return readServerEnv(CERTIFICATION_FAKE_DOCUMENTS_ENV_NAME) === '1';
}

function addMonthsToIso(issuedAtIso: string, months: number): string {
  const value = new Date(issuedAtIso);
  value.setMonth(value.getMonth() + months);
  return value.toISOString();
}

function parseLegacyDate(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const germanMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (germanMatch) {
    const [, day, month, year] = germanMatch;
    const parsed = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function sortNewestFirst<T extends { startedAt?: string; issuedAt?: string; generatedAt?: string }>(
  values: T[],
): T[] {
  return [...values].sort((left, right) => {
    const leftValue = left.startedAt ?? left.issuedAt ?? left.generatedAt ?? '';
    const rightValue = right.startedAt ?? right.issuedAt ?? right.generatedAt ?? '';
    return rightValue.localeCompare(leftValue);
  });
}

function buildDefaultSettings(): CertificationSettings {
  const defaultValidityMonths = getDefaultValidityMonths();

  return {
    settingsId: 'default',
    defaultValidityMonths:
      Number.isFinite(defaultValidityMonths) && defaultValidityMonths > 0
        ? defaultValidityMonths
        : 12,
    documentProvider: getDefaultDocumentProvider(),
    documentTemplateId: resolveDocumenteroCertificationTemplateId() ?? '',
    badgeAssetUrl: CERTIFICATE_BADGE_ASSET_URL,
  };
}

function getMemoryStore(): MemoryStore {
  if (!global.__kiregisterCertificationMemory__) {
    global.__kiregisterCertificationMemory__ = {
      attempts: new Map<string, ExamAttemptRecord>(),
      certificates: new Map<string, PersonCertificateRecord>(),
      publicCertificates: new Map<string, PublicCertificateRecord>(),
      certificateDocuments: new Map<string, CertificateDocumentRecord[]>(),
      settings: buildDefaultSettings(),
    };
  }

  return global.__kiregisterCertificationMemory__;
}

function buildAuditEvent(
  actorEmail: string,
  type: CertificateAuditEvent['type'],
  note: string,
): CertificateAuditEvent {
  return {
    id: randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    actorEmail,
    note,
  };
}

function resolveCertificateStatus(
  certificate: Pick<PersonCertificateRecord, 'status' | 'validUntil'>,
): CertificateStatus {
  if (certificate.status === 'revoked') {
    return 'revoked';
  }

  if (certificate.validUntil) {
    const validUntilDate = new Date(certificate.validUntil);
    if (!Number.isNaN(validUntilDate.getTime()) && validUntilDate.getTime() < Date.now()) {
      return 'expired';
    }
  }

  return certificate.status;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildFakePdfDataUri(certificate: PersonCertificateRecord, verifyUrl: string): string {
  const stream = [
    'BT',
    '/F1 20 Tf',
    '72 720 Td',
    '(AI Register Certificate) Tj',
    '0 -32 Td',
    '/F1 12 Tf',
    `(${escapePdfText(certificate.holderName)}) Tj`,
    '0 -18 Td',
    `(Code: ${escapePdfText(certificate.certificateCode)}) Tj`,
    '0 -18 Td',
    `(Verification: ${escapePdfText(verifyUrl)}) Tj`,
    '0 -18 Td',
    `(Generated: ${escapePdfText(new Date().toISOString())}) Tj`,
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${Buffer.from(pdf, 'utf8').toString('base64')}`;
}

function formatCertificateDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function buildNativePdfDataUri(
  certificate: PersonCertificateRecord,
  verifyUrl: string,
): Promise<string> {
  const jspdfModule = await import('jspdf');
  const JsPdfConstructor = jspdfModule.jsPDF ?? (jspdfModule.default as typeof jspdfModule.jsPDF);
  const pdf = new JsPdfConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 18;
  const right = pageWidth - 18;
  let y = 24;
  const effectiveStatus = resolveCertificateStatus(certificate);
  const subtitleLines = pdf.splitTextToSize(
    'Publicly verifiable competency certificate for successful internal review in the AI Register.',
    right - left,
  );
  const introLines = pdf.splitTextToSize(
    'This document confirms the demonstrated competence in the structured handling of requirements, documentation and governance related to the EU AI Act.',
    right - left,
  );
  const moduleLines = pdf.splitTextToSize(certificate.modules.join(' · '), right - left - 16);
  const verifyLines = pdf.splitTextToSize(verifyUrl, right - left - 16);

  pdf.setFillColor(17, 24, 39);
  pdf.rect(left, y, 22, 22, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('KR', left + 11, y + 14, { align: 'center' });

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10);
  pdf.text('AI REGISTER', left + 28, y + 8);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('CERTIFICATE / PUBLIC RECORD', left + 28, y + 15);

  y += 34;
  pdf.setDrawColor(17, 24, 39);
  pdf.setLineWidth(0.8);
  pdf.line(left, y, right, y);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(27);
  pdf.text('Competency Certificate', left, y);

  y += 9;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(subtitleLines, left, y);

  y += subtitleLines.length * 5 + 14;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10);
  pdf.text('ISSUED TO', left, y);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text(certificate.holderName, left, y);

  if (certificate.company) {
    y += 9;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.text(certificate.company, left, y);
  }

  y += 18;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(introLines, left, y);

  y += introLines.length * 5 + 10;
  const fieldTop = y;
  const fieldHeight = 42;
  const columnGap = 8;
  const columnWidth = (right - left - columnGap) / 2;

  pdf.rect(left, fieldTop, columnWidth, fieldHeight);
  pdf.rect(left + columnWidth + columnGap, fieldTop, columnWidth, fieldHeight);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text('CERTIFICATE CODE', left + 6, fieldTop + 9);
  pdf.text('ISSUED', left + 6, fieldTop + 25);
  pdf.text('STATUS', left + columnWidth + columnGap + 6, fieldTop + 9);
  pdf.text('VALID UNTIL', left + columnWidth + columnGap + 6, fieldTop + 25);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(certificate.certificateCode, left + 6, fieldTop + 16);
  pdf.text(
    effectiveStatus === 'active'
      ? 'Active'
      : effectiveStatus === 'expired'
        ? 'Expired'
        : 'Revoked',
    left + columnWidth + columnGap + 6,
    fieldTop + 16,
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(formatCertificateDate(certificate.issuedAt), left + 6, fieldTop + 32);
  pdf.text(
    formatCertificateDate(certificate.validUntil),
    left + columnWidth + columnGap + 6,
    fieldTop + 32,
  );

  y = fieldTop + fieldHeight + 14;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text('SCOPE', left, y);

  y += 7;
  pdf.rect(left, y, right - left, 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(moduleLines, left + 6, y + 9);

  y += 40;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text('PUBLIC VERIFICATION', left, y);

  y += 7;
  pdf.rect(left, y, right - left, 28);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(verifyLines, left + 6, y + 9);

  pdf.setDrawColor(17, 24, 39);
  pdf.line(left, pageHeight - 30, right, pageHeight - 30);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.text('AI Register · Public Verification Record', left, pageHeight - 22);
  pdf.text(formatCertificateDate(new Date().toISOString()), right, pageHeight - 22, {
    align: 'right',
  });

  return pdf.output('datauristring');
}

function buildPublicRecord(
  certificate: PersonCertificateRecord,
): PublicCertificateRecord {
  const effectiveStatus = resolveCertificateStatus(certificate);

  return {
    certificateCode: certificate.certificateCode,
    certificateId: certificate.certificateId,
    holderName: certificate.holderName,
    company: certificate.company,
    issuedDate: certificate.issuedAt,
    validUntil: certificate.validUntil,
    status: effectiveStatus,
    modules: certificate.modules,
    verifyUrl: certificate.publicUrl,
    latestDocumentUrl: certificate.latestDocumentUrl,
  };
}

function mapLegacyStatus(status: string | undefined, validUntil: string | null): CertificateStatus {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'inactive') {
    return 'revoked';
  }

  if (normalized === 'expired') {
    return 'expired';
  }

  if (validUntil) {
    const parsed = new Date(validUntil);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now()) {
      return 'expired';
    }
  }

  return 'active';
}

function mapLegacyCertificateToPublicRecord(input: {
  certificateId: string;
  data: LegacyCertificateRecord;
  latestDocumentUrl: string | null;
}): PublicCertificateRecord | null {
  const certificateCode = input.data.code?.trim();
  const holderName = input.data.holder?.name?.trim();
  if (!certificateCode || !holderName) {
    return null;
  }

  const issuedDate =
    parseLegacyDate(input.data.issueDate) ??
    parseLegacyDate(input.data.dates?.issued) ??
    new Date().toISOString();
  const validUntil =
    parseLegacyDate(input.data.expiryDate) ??
    parseLegacyDate(input.data.dates?.validUntil);
  const status = mapLegacyStatus(input.data.status, validUntil);

  return {
    certificateCode,
    certificateId: `legacy:${input.certificateId}`,
    holderName,
    company: input.data.holder?.company?.trim() || null,
    issuedDate,
    validUntil,
    status,
    modules: Array.isArray(input.data.modules) ? input.data.modules : [],
    verifyUrl: buildCertificateVerifyUrl(certificateCode),
    latestDocumentUrl: input.latestDocumentUrl,
  };
}

function buildLegacyUserSnapshot(
  attempts: ExamAttemptRecord[],
  certificate: PersonCertificateRecord | null,
): UserCertificationSnapshot {
  const latestCompletedAttempt = sortNewestFirst(
    attempts.filter((attempt) => attempt.completedAt),
  )[0];

  return {
    hasPurchased: false,
    purchase: null,
    examPassed:
      latestCompletedAttempt?.status === 'passed'
        ? true
        : latestCompletedAttempt?.status === 'failed'
          ? false
          : null,
    examDate: latestCompletedAttempt?.completedAt ?? null,
    examAttempts: attempts.length,
    hasCertificate: Boolean(certificate),
    certificate: certificate
      ? {
          code: certificate.certificateCode,
          issuedDate: certificate.issuedAt,
          validUntil: certificate.validUntil ?? '',
          holderName: certificate.holderName,
          status: resolveCertificateStatus(certificate),
          latestDocumentUrl: certificate.latestDocumentUrl,
          verifyUrl: certificate.publicUrl,
          company: certificate.company,
          modules: certificate.modules,
        }
      : null,
  };
}

function serializeExamAttempt(
  attempt: ExamAttemptRecord,
): StoredExamAttemptRecord {
  return {
    ...attempt,
    sectionAnswers: attempt.sectionAnswers
      ? attempt.sectionAnswers.map((answers) => ({ answers }))
      : null,
  };
}

function deserializeExamAttempt(
  input: StoredExamAttemptRecord | ExamAttemptRecord,
): ExamAttemptRecord {
  const rawSectionAnswers = input.sectionAnswers;

  return {
    ...input,
    sectionAnswers: Array.isArray(rawSectionAnswers)
      ? rawSectionAnswers.map((entry) => {
          if (Array.isArray(entry)) {
            return entry.filter((value): value is number => Number.isFinite(value));
          }

          if (entry && Array.isArray(entry.answers)) {
            return entry.answers.filter((value): value is number => Number.isFinite(value));
          }

          return [];
        })
      : null,
  };
}

async function listAttemptsForEmail(email: string): Promise<ExamAttemptRecord[]> {
  const normalizedEmail = normalizeEmail(email);

  if (!hasFirebaseAdminCredentials()) {
    return sortNewestFirst(
      Array.from(getMemoryStore().attempts.values()).filter(
        (attempt) => attempt.email === normalizedEmail,
      ),
    );
  }

  const snapshot = await getAdminDb()
    .collection('person_exam_attempts')
    .where('email', '==', normalizedEmail)
    .get();

  return sortNewestFirst(
    snapshot.docs.map((doc) =>
      deserializeExamAttempt(doc.data() as StoredExamAttemptRecord),
    ),
  );
}

async function listCertificates(): Promise<PersonCertificateRecord[]> {
  if (!hasFirebaseAdminCredentials()) {
    return sortNewestFirst(Array.from(getMemoryStore().certificates.values()));
  }

  const snapshot = await getAdminDb().collection('person_certificates').get();
  return sortNewestFirst(
    snapshot.docs.map((doc) => doc.data() as PersonCertificateRecord),
  );
}

async function findCertificateById(
  certificateId: string,
): Promise<PersonCertificateRecord | null> {
  if (!hasFirebaseAdminCredentials()) {
    return getMemoryStore().certificates.get(certificateId) ?? null;
  }

  const snapshot = await getAdminDb()
    .collection('person_certificates')
    .doc(certificateId)
    .get();
  return snapshot.exists
    ? ((snapshot.data() as PersonCertificateRecord) ?? null)
    : null;
}

async function findLatestCertificateByEmail(
  email: string,
): Promise<PersonCertificateRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  const certificates = await listCertificates();
  return (
    certificates.find((certificate) => certificate.email === normalizedEmail) ??
    null
  );
}

async function listCertificateDocuments(
  certificateId: string,
): Promise<CertificateDocumentRecord[]> {
  if (!hasFirebaseAdminCredentials()) {
    return sortNewestFirst(
      getMemoryStore().certificateDocuments.get(certificateId) ?? [],
    );
  }

  const snapshot = await getAdminDb()
    .collection('certificate_documents')
    .where('certificateId', '==', certificateId)
    .get();

  return sortNewestFirst(
    snapshot.docs.map((doc) => doc.data() as CertificateDocumentRecord),
  );
}

async function saveAttempt(attempt: ExamAttemptRecord): Promise<void> {
  if (!hasFirebaseAdminCredentials()) {
    getMemoryStore().attempts.set(attempt.attemptId, attempt);
    return;
  }

  await getAdminDb()
    .collection('person_exam_attempts')
    .doc(attempt.attemptId)
    .set(serializeExamAttempt(attempt), { merge: true });
}

async function saveCertificate(
  certificate: PersonCertificateRecord,
): Promise<void> {
  const effectiveStatus = resolveCertificateStatus(certificate);

  if (!hasFirebaseAdminCredentials()) {
    const store = getMemoryStore();
    store.certificates.set(certificate.certificateId, certificate);
    store.publicCertificates.set(
      certificate.certificateCode,
      buildPublicRecord(certificate),
    );
    return;
  }

  const db = getAdminDb();
  await db
    .collection('person_certificates')
    .doc(certificate.certificateId)
    .set(certificate, { merge: true });

  await db
    .collection('public_certificates')
    .doc(certificate.certificateCode)
    .set(buildPublicRecord(certificate), { merge: true });

  await db
    .collection('user_certificates')
    .doc(certificate.email)
    .set(
      {
        email: certificate.email,
        certificateCode: certificate.certificateCode,
        certificateId: certificate.certificateId,
        holderName: certificate.holderName,
        company: certificate.company,
        issuedDate: certificate.issuedAt,
        validUntil: certificate.validUntil,
        pdfUrl: certificate.latestDocumentUrl,
        status: effectiveStatus,
        recordedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

async function saveCertificateDocument(
  document: CertificateDocumentRecord,
): Promise<void> {
  if (!hasFirebaseAdminCredentials()) {
    const store = getMemoryStore();
    const existing = store.certificateDocuments.get(document.certificateId) ?? [];
    store.certificateDocuments.set(document.certificateId, [
      document,
      ...existing,
    ]);
    return;
  }

  await getAdminDb()
    .collection('certificate_documents')
    .doc(document.documentId)
    .set(document, { merge: true });
}

async function saveLegacyExamSummary(
  email: string,
  attempt: ExamAttemptRecord,
): Promise<void> {
  if (!hasFirebaseAdminCredentials()) {
    return;
  }

  await getAdminDb()
    .collection('user_exams')
    .doc(normalizeEmail(email))
    .set(
      {
        email: normalizeEmail(email),
        examPassed: attempt.status === 'passed',
        sectionScores: attempt.sectionResults?.map((section) => section.score) ?? [],
        totalScore: attempt.totalScore ?? 0,
        examDate: attempt.completedAt,
        attempts: attempt.attemptNumber,
      },
      { merge: true },
    );
}

async function getSettings(): Promise<CertificationSettings> {
  if (!hasFirebaseAdminCredentials()) {
    return getMemoryStore().settings;
  }

  const snapshot = await getAdminDb()
    .collection('certification_settings')
    .doc('default')
    .get();

  if (!snapshot.exists) {
    const defaults = buildDefaultSettings();
    await getAdminDb()
      .collection('certification_settings')
      .doc('default')
      .set(defaults, { merge: true });
    return defaults;
  }

  return {
    ...buildDefaultSettings(),
    ...(snapshot.data() as Partial<CertificationSettings>),
  };
}

export async function updateCertificationSettings(
  input: Partial<
    Pick<
      CertificationSettings,
      'defaultValidityMonths' | 'documentProvider' | 'documentTemplateId' | 'badgeAssetUrl'
    >
  >,
): Promise<CertificationSettings> {
  const nextSettings: CertificationSettings = {
    ...(await getSettings()),
    ...(typeof input.defaultValidityMonths === 'number' &&
    Number.isFinite(input.defaultValidityMonths) &&
    input.defaultValidityMonths > 0
      ? { defaultValidityMonths: Math.round(input.defaultValidityMonths) }
      : {}),
    ...(input.documentProvider === 'documentero' || input.documentProvider === 'native'
      ? { documentProvider: input.documentProvider }
      : {}),
    ...(typeof input.documentTemplateId === 'string'
      ? { documentTemplateId: input.documentTemplateId.trim() }
      : {}),
    ...(typeof input.badgeAssetUrl === 'string'
      ? { badgeAssetUrl: input.badgeAssetUrl.trim() }
      : {}),
  };

  if (!hasFirebaseAdminCredentials()) {
    getMemoryStore().settings = nextSettings;
    return nextSettings;
  }

  await getAdminDb()
    .collection('certification_settings')
    .doc('default')
    .set(nextSettings, { merge: true });

  return nextSettings;
}

function computeSectionResults(
  answers: number[][],
): { sectionResults: ExamSectionResult[]; totalScore: number } {
  const sectionResults = LEGACY_EXAM_DEFINITION.sections.map((section, index) => {
    const sectionAnswers = answers[index] ?? [];
    let correctAnswers = 0;

    section.questions.forEach((question, questionIndex) => {
      if (sectionAnswers[questionIndex] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });

    const totalQuestions = section.questions.length;
    const score =
      totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 10000) / 100;

    return {
      sectionId: section.id,
      sectionTitle: section.title,
      score,
      passed: score >= LEGACY_EXAM_DEFINITION.passThreshold,
      correctAnswers,
      totalQuestions,
    };
  });

  const totalScore =
    sectionResults.reduce((sum, section) => sum + section.score, 0) /
    sectionResults.length;

  return {
    sectionResults,
    totalScore: Math.round(totalScore * 100) / 100,
  };
}

async function generateUniqueCertificateCode(): Promise<string> {
  const year = new Date().getFullYear();

  for (let index = 0; index < 10; index += 1) {
    const candidate = `KI-REG-${year}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

    const existing = await getPublicCertificate(candidate);
    if (!existing) {
      return candidate;
    }
  }

  return `KI-REG-${year}-${Date.now().toString().slice(-6)}`;
}

async function getPublicCertificate(
  certificateCode: string,
): Promise<PublicCertificateRecord | null> {
  if (!hasFirebaseAdminCredentials()) {
    return getMemoryStore().publicCertificates.get(certificateCode) ?? null;
  }

  const snapshot = await getAdminDb()
    .collection('public_certificates')
    .doc(certificateCode)
    .get();

  return snapshot.exists
    ? ((snapshot.data() as PublicCertificateRecord) ?? null)
    : null;
}

async function getLegacyCertificateDocumentUrl(
  certificateId: string,
): Promise<string | null> {
  if (!hasFirebaseAdminCredentials()) {
    return null;
  }

  const snapshot = await getAdminDb()
    .collection('certificate_documents')
    .where('certificateId', '==', certificateId)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const documents = snapshot.docs
    .map((doc) => doc.data() as LegacyCertificateDocumentRecord)
    .filter((entry) => typeof entry.url === 'string' && entry.url.trim().length > 0)
    .sort((left, right) =>
      (right.generatedAt ?? '').localeCompare(left.generatedAt ?? ''),
    );

  return documents[0]?.url?.trim() || null;
}

async function getLegacyPublicCertificate(
  certificateCode: string,
): Promise<PublicCertificateRecord | null> {
  if (!hasFirebaseAdminCredentials()) {
    return null;
  }

  const snapshot = await getAdminDb()
    .collection('zertifikatspruefung')
    .where('code', '==', certificateCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const legacyDoc = snapshot.docs[0];
  const latestDocumentUrl = await getLegacyCertificateDocumentUrl(legacyDoc.id);
  return mapLegacyCertificateToPublicRecord({
    certificateId: legacyDoc.id,
    data: legacyDoc.data() as LegacyCertificateRecord,
    latestDocumentUrl,
  });
}

function createCertificateRecord(
  actor: CertificationActor,
  email: string,
  holderName: string,
  company: string | null,
  validityMonths: number,
): PersonCertificateRecord {
  const issuedAt = new Date().toISOString();
  const certificateId = randomUUID();
  const certificateCode = `pending-${certificateId}`;

  return {
    certificateId,
    certificateCode,
    userId: actor.uid,
    email: normalizeEmail(email),
    holderName,
    company,
    issuedAt,
    validUntil: addMonthsToIso(issuedAt, validityMonths),
    status: 'active',
    examVersion: LEGACY_EXAM_DEFINITION.version,
    modules: LEGACY_EXAM_DEFINITION.sections.map((section) => section.title),
    latestDocumentUrl: null,
    latestDocumentGeneratedAt: null,
    publicUrl: buildCertificateVerifyUrl(certificateCode),
    auditTrail: [],
  };
}

async function generateDocumentUrl(
  certificate: PersonCertificateRecord,
  settings: CertificationSettings,
): Promise<GeneratedDocument> {
  const verifyUrl = buildCertificateVerifyUrl(certificate.certificateCode);

  if (isFakeDocumentModeEnabled()) {
    return {
      url: buildFakePdfDataUri(certificate, verifyUrl),
      provider: 'native',
    };
  }

  const documenteroApiKey = resolveDocumenteroApiKey();

  if (
    isExternalCertificatePdfsEnabled() &&
    settings.documentProvider === 'documentero' &&
    documenteroApiKey &&
    settings.documentTemplateId
  ) {
    const filename = `${
      certificate.holderName.replace(/[^a-zA-Z0-9]+/g, '_') || 'certificate'
    }_${certificate.certificateCode}.pdf`;

    const response = await fetch(DOCUMENTERO_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `apiKey ${documenteroApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: settings.documentTemplateId,
        format: 'pdf',
        filename,
        data: {
          qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}`,
          Zert_Nr: certificate.certificateCode,
          Vorname_Nachname: certificate.holderName,
          datum: new Date(certificate.issuedAt).toLocaleDateString('en-GB'),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Documentero request failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      status?: number;
      data?: string;
      message?: string;
    };

    if (payload.status !== 200 || !payload.data) {
      throw new Error(payload.message || 'Documentero did not return a PDF URL.');
    }

    return {
      url: payload.data,
      provider: 'documentero',
    };
  }

  return {
    url: await buildNativePdfDataUri(certificate, verifyUrl),
    provider: 'native',
  };
}

export async function getCertificationOverview(): Promise<AdminCertificationOverview> {
  return {
    settings: await getSettings(),
    attempts: await listAttemptsForAdmin(),
    certificates: await listCertificates(),
  };
}

export async function listAttemptsForAdmin(): Promise<ExamAttemptRecord[]> {
  if (!hasFirebaseAdminCredentials()) {
    return sortNewestFirst(Array.from(getMemoryStore().attempts.values()));
  }

  const snapshot = await getAdminDb().collection('person_exam_attempts').get();
  return sortNewestFirst(
    snapshot.docs.map((doc) =>
      deserializeExamAttempt(doc.data() as StoredExamAttemptRecord),
    ),
  );
}

export async function getUserCertificationSnapshot(
  email: string,
): Promise<UserCertificationSnapshot> {
  const attempts = await listAttemptsForEmail(email);
  const certificate = await findLatestCertificateByEmail(email);
  return buildLegacyUserSnapshot(attempts, certificate);
}

export async function startExamAttempt(
  actor: CertificationActor,
): Promise<ExamAttemptRecord> {
  const attempts = await listAttemptsForEmail(actor.email);

  const attempt: ExamAttemptRecord = {
    attemptId: randomUUID(),
    examDefinitionId: LEGACY_EXAM_DEFINITION.id,
    examVersion: LEGACY_EXAM_DEFINITION.version,
    userId: actor.uid,
    email: normalizeEmail(actor.email),
    startedAt: new Date().toISOString(),
    completedAt: null,
    attemptNumber: attempts.length + 1,
    status: 'started',
    sectionAnswers: null,
    sectionResults: null,
    totalScore: null,
    passThreshold: LEGACY_EXAM_DEFINITION.passThreshold,
  };

  await saveAttempt(attempt);
  return attempt;
}

export async function submitExamAttempt(
  actor: CertificationActor,
  input: { attemptId: string; sectionAnswers: number[][]; company?: string | null },
): Promise<ExamSubmissionResult> {
  const attempts = await listAttemptsForEmail(actor.email);
  const attempt = attempts.find((entry) => entry.attemptId === input.attemptId);

  if (!attempt) {
    throw new Error('Exam attempt not found.');
  }

  if (attempt.userId !== actor.uid || attempt.email !== normalizeEmail(actor.email)) {
    throw new Error('Exam attempt does not belong to the authenticated user.');
  }

  const { sectionResults, totalScore } = computeSectionResults(input.sectionAnswers);
  const passed = sectionResults.every((section) => section.passed);

  const completedAttempt: ExamAttemptRecord = {
    ...attempt,
    completedAt: new Date().toISOString(),
    status: passed ? 'passed' : 'failed',
    sectionAnswers: input.sectionAnswers,
    sectionResults,
    totalScore,
  };

  await saveAttempt(completedAttempt);
  await saveLegacyExamSummary(actor.email, completedAttempt);

  if (!passed) {
    return {
      attempt: completedAttempt,
      certificate: null,
      document: null,
    };
  }

  const settings = await getSettings();
  const existingCertificate = await findLatestCertificateByEmail(actor.email);
  let certificate = existingCertificate;
  let certificateDocument: CertificateDocumentRecord | null = null;

  if (!certificate || certificate.status !== 'active') {
    const validityMonths =
      settings.defaultValidityMonths > 0 ? settings.defaultValidityMonths : 12;
    const nextCertificate = createCertificateRecord(
      actor,
      actor.email,
      actor.displayName?.trim() || actor.email,
      input.company ?? null,
      validityMonths,
    );
    const certificateCode = await generateUniqueCertificateCode();
    certificate = {
      ...nextCertificate,
      certificateCode,
      publicUrl: buildCertificateVerifyUrl(certificateCode),
      auditTrail: [
        buildAuditEvent(actor.email, 'issued', 'Certificate issued after passing the review.'),
      ],
    };
  }

  try {
    const document = await generateDocumentUrl(certificate, settings);
    certificateDocument = {
      documentId: randomUUID(),
      certificateId: certificate.certificateId,
      generatedAt: new Date().toISOString(),
      url: document.url,
      provider: document.provider,
      generatedBy: actor.email,
    };
    await saveCertificateDocument(certificateDocument);
    certificate = {
      ...certificate,
      latestDocumentUrl: certificateDocument.url,
      latestDocumentGeneratedAt: certificateDocument.generatedAt,
    };
  } catch (error) {
    console.error('Certificate document generation failed:', error);
  }

  await saveCertificate(certificate);

  return {
    attempt: completedAttempt,
    certificate,
    document: certificateDocument,
  };
}

export async function regenerateCertificateDocument(
  actor: CertificationActor,
  certificateId: string,
): Promise<PersonCertificateRecord> {
  const certificate = await findCertificateById(certificateId);
  if (!certificate) {
    throw new Error('Certificate not found.');
  }

  const settings = await getSettings();
  const generatedDocument = await generateDocumentUrl(certificate, settings);

  const document: CertificateDocumentRecord = {
    documentId: randomUUID(),
    certificateId: certificate.certificateId,
    generatedAt: new Date().toISOString(),
    url: generatedDocument.url,
    provider: generatedDocument.provider,
    generatedBy: actor.email,
  };

  await saveCertificateDocument(document);

  const updatedCertificate: PersonCertificateRecord = {
    ...certificate,
    latestDocumentUrl: document.url,
    latestDocumentGeneratedAt: document.generatedAt,
    auditTrail: [
      buildAuditEvent(actor.email, 'regenerated', 'Certificate PDF regenerated.'),
      ...certificate.auditTrail,
    ],
  };

  await saveCertificate(updatedCertificate);
  return updatedCertificate;
}

export async function updateCertificateByAdmin(
  actor: CertificationActor,
  input: CertificateUpdateInput,
): Promise<PersonCertificateRecord> {
  const certificate = await findCertificateById(input.certificateId);
  if (!certificate) {
    throw new Error('Certificate not found.');
  }

  const nextAudit: CertificateAuditEvent[] = [...certificate.auditTrail];

  if (input.status && input.status !== certificate.status) {
    nextAudit.unshift(
      buildAuditEvent(
        actor.email,
        'status_changed',
        input.note || `Status changed to ${input.status}.`,
      ),
    );
  }

  if (
    typeof input.validUntil !== 'undefined' &&
    input.validUntil !== certificate.validUntil
  ) {
    nextAudit.unshift(
      buildAuditEvent(
        actor.email,
        'validity_changed',
        input.note || 'Gültigkeitsdatum angepasst.',
      ),
    );
  }

  const updated: PersonCertificateRecord = {
    ...certificate,
    status: input.status ?? certificate.status,
    validUntil:
      typeof input.validUntil === 'undefined'
        ? certificate.validUntil
        : input.validUntil,
    auditTrail: nextAudit,
  };

  await saveCertificate(updated);
  return updated;
}

export async function issueManualCertificate(
  actor: CertificationActor,
  input: ManualCertificateInput,
): Promise<PersonCertificateRecord> {
  const settings = await getSettings();
  const validityMonths =
    input.validityMonths && input.validityMonths > 0
      ? input.validityMonths
      : settings.defaultValidityMonths;

  const baseCertificate = createCertificateRecord(
    {
      uid: input.userId?.trim() || actor.uid,
      email: normalizeEmail(input.email),
      displayName: input.holderName,
    },
    input.email,
    input.holderName,
    input.company?.trim() || null,
    validityMonths,
  );

  const certificateCode = await generateUniqueCertificateCode();
  const certificate: PersonCertificateRecord = {
    ...baseCertificate,
    certificateCode,
    publicUrl: buildCertificateVerifyUrl(certificateCode),
    auditTrail: [
      buildAuditEvent(
        actor.email,
        'manual_issue',
        'Zertifikat manuell im Admin Center ausgestellt.',
      ),
    ],
  };

  await saveCertificate(certificate);
  return regenerateCertificateDocument(actor, certificate.certificateId);
}

export async function getPublicCertificateRecord(
  certificateCode: string,
): Promise<PublicCertificateRecord | null> {
  const normalizedCode = certificateCode.trim();
  if (!normalizedCode) {
    return null;
  }

  const currentRecord = await getPublicCertificate(normalizedCode);
  if (currentRecord) {
    return currentRecord;
  }

  return getLegacyPublicCertificate(normalizedCode);
}

export async function getCertificateBadgeMarkup(
  certificateCode: string,
  alignment: 'left' | 'center' | 'right' = 'center',
): Promise<string | null> {
  const publicRecord = await getPublicCertificateRecord(certificateCode);
  if (!publicRecord || publicRecord.status !== 'active') {
    return null;
  }

  const settings = await getSettings();

  return buildCertificateBadgeMarkup(
    {
      certificateCode: publicRecord.certificateCode,
      holderName: publicRecord.holderName,
    },
    alignment,
    settings.badgeAssetUrl,
  );
}

export async function getCertificateWithDocuments(
  certificateId: string,
): Promise<AdminCertificateDetail> {
  const certificate = await findCertificateById(certificateId);
  const documents = certificate
    ? await listCertificateDocuments(certificateId)
    : [];

  return { certificate, documents };
}

export async function getBadgePreviewData(
  certificateCode: string,
): Promise<{
  html: string | null;
  origin: string;
}> {
  const html = await getCertificateBadgeMarkup(certificateCode);
  return {
    html,
    origin: getPublicAppOrigin(),
  };
}
