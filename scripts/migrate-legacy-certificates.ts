import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { buildPublicAppUrl } from '../src/lib/app-url';
import { hasFirebaseAdminCredentials } from '../src/lib/firebase-admin';
import type {
  CertificateAuditEvent,
  CertificateDocumentRecord,
  CertificateStatus,
  PersonCertificateRecord,
  PublicCertificateRecord,
} from '../src/lib/certification/types';

type MigrationOptions = {
  apply: boolean;
  includeTestData: boolean;
  overwriteExisting: boolean;
  sourceProjectId: string;
  targetProjectId: string;
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

type UserCertificateRecord = {
  email?: string;
  certificateCode?: string;
  certificateId?: string | null;
  holderName?: string | null;
  company?: string | null;
  issuedDate?: string | null;
  validUntil?: string | null;
  pdfUrl?: string | null;
  status?: CertificateStatus;
  recordedAt?: string;
};

type ResolvedLegacyCertificate = {
  sourceId: string;
  certificateCode: string;
  holderName: string;
  company: string | null;
  email: string | null;
  issuedAt: string;
  validUntil: string | null;
  status: CertificateStatus;
  modules: string[];
  latestDocumentUrl: string | null;
  latestDocumentGeneratedAt: string | null;
  testSignals: string[];
};

type MigrationPlan = {
  person: PersonCertificateRecord;
  publicRecord: PublicCertificateRecord;
  userRecord: UserCertificateRecord | null;
  documentRecord: CertificateDocumentRecord | null;
};

const DEFAULT_MODULES = ['EU AI Act Basics'];
const MIGRATION_ACTOR_EMAIL = 'migration@kiregister.com';
const DEFAULT_SOURCE_PROJECT_ID = 'ki-eu-akt-zertifizierung';
const DEFAULT_TARGET_PROJECT_ID = 'ai-act-compass-m6o05';
const TEST_MARKERS = [
  'test',
  'demo',
  'example',
  'dummy',
  'preview',
  'mustermann',
  'mailinator',
  'sample',
  'staging',
  'sandbox',
  'qa',
  'kiregister.dev',
  '@example.',
  '@test.',
  '@demo.',
];

function readArgValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  const value = argv[index + 1]?.trim();
  return value ? value : null;
}

function parseArgs(argv: string[]): MigrationOptions {
  return {
    apply: argv.includes('--apply'),
    includeTestData: argv.includes('--include-test-data'),
    overwriteExisting: argv.includes('--overwrite-existing'),
    sourceProjectId:
      readArgValue(argv, '--source-project') ??
      process.env.LEGACY_FIREBASE_PROJECT_ID?.trim() ??
      DEFAULT_SOURCE_PROJECT_ID,
    targetProjectId:
      readArgValue(argv, '--target-project') ??
      process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ??
      process.env.FIREBASE_PROJECT_ID?.trim() ??
      process.env.GCLOUD_PROJECT?.trim() ??
      process.env.GCP_PROJECT?.trim() ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ??
      DEFAULT_TARGET_PROJECT_ID,
  };
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

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizeString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isRealEmail(email: string | null): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function sanitizeCodeForEmail(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function mapLegacyStatus(
  status: string | undefined,
  validUntil: string | null,
): CertificateStatus {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'inactive' || normalized === 'revoked') {
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

function statusRank(status: CertificateStatus): number {
  switch (status) {
    case 'active':
      return 3;
    case 'expired':
      return 2;
    case 'revoked':
      return 1;
    default:
      return 0;
  }
}

function collectTestSignals(input: {
  code: string;
  holderName: string;
  company: string | null;
  email: string | null;
}): string[] {
  const haystack = [
    input.code,
    input.holderName,
    input.company,
    input.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return TEST_MARKERS.filter((marker) => haystack.includes(marker));
}

function compareCandidates(
  left: ResolvedLegacyCertificate,
  right: ResolvedLegacyCertificate,
): number {
  const rankDifference = statusRank(right.status) - statusRank(left.status);
  if (rankDifference !== 0) {
    return rankDifference;
  }

  const leftIssued = new Date(left.issuedAt).getTime();
  const rightIssued = new Date(right.issuedAt).getTime();
  if (rightIssued !== leftIssued) {
    return rightIssued - leftIssued;
  }

  const leftHasDocument = left.latestDocumentUrl ? 1 : 0;
  const rightHasDocument = right.latestDocumentUrl ? 1 : 0;
  if (rightHasDocument !== leftHasDocument) {
    return rightHasDocument - leftHasDocument;
  }

  const leftHasEmail = isRealEmail(left.email) ? 1 : 0;
  const rightHasEmail = isRealEmail(right.email) ? 1 : 0;
  if (rightHasEmail !== leftHasEmail) {
    return rightHasEmail - leftHasEmail;
  }

  return left.sourceId.localeCompare(right.sourceId);
}

function buildVerifyUrl(certificateCode: string): string {
  return buildPublicAppUrl(`/verify/${encodeURIComponent(certificateCode)}`);
}

function buildMigrationAuditTrail(
  issuedAt: string,
  sourceId: string,
): CertificateAuditEvent[] {
  return [
    {
      id: `legacy-issued-${sourceId}`,
      type: 'issued',
      createdAt: issuedAt,
      actorEmail: MIGRATION_ACTOR_EMAIL,
      note: `Migrated from legacy zertifikatspruefung/${sourceId}.`,
    },
  ];
}

function buildMigrationPlan(
  certificate: ResolvedLegacyCertificate,
): MigrationPlan {
  const certificateId = `legacy_${certificate.sourceId}`;
  const syntheticEmail = `legacy+${sanitizeCodeForEmail(
    certificate.certificateCode,
  )}@migrated.invalid`;
  const email = isRealEmail(certificate.email) ? certificate.email : syntheticEmail;
  const publicUrl = buildVerifyUrl(certificate.certificateCode);

  const person: PersonCertificateRecord = {
    certificateId,
    certificateCode: certificate.certificateCode,
    userId: `legacy:${certificate.sourceId}`,
    email,
    holderName: certificate.holderName,
    company: certificate.company,
    issuedAt: certificate.issuedAt,
    validUntil: certificate.validUntil,
    status: certificate.status,
    examVersion: 'legacy-eukigesetz',
    modules: certificate.modules,
    latestDocumentUrl: certificate.latestDocumentUrl,
    latestDocumentGeneratedAt: certificate.latestDocumentGeneratedAt,
    publicUrl,
    auditTrail: buildMigrationAuditTrail(certificate.issuedAt, certificate.sourceId),
  };

  const publicRecord: PublicCertificateRecord = {
    certificateCode: certificate.certificateCode,
    certificateId,
    holderName: certificate.holderName,
    company: certificate.company,
    issuedDate: certificate.issuedAt,
    validUntil: certificate.validUntil,
    status: certificate.status,
    modules: certificate.modules,
    verifyUrl: publicUrl,
    latestDocumentUrl: certificate.latestDocumentUrl,
  };

  const userRecord: UserCertificateRecord | null = isRealEmail(certificate.email)
    ? {
        email: certificate.email,
        certificateCode: certificate.certificateCode,
        certificateId,
        holderName: certificate.holderName,
        company: certificate.company,
        issuedDate: certificate.issuedAt,
        validUntil: certificate.validUntil,
        pdfUrl: certificate.latestDocumentUrl,
        status: certificate.status,
        recordedAt: new Date().toISOString(),
      }
    : null;

  const documentRecord: CertificateDocumentRecord | null =
    certificate.latestDocumentUrl
      ? {
          documentId: `legacy_doc_${certificate.sourceId}`,
          certificateId,
          generatedAt:
            certificate.latestDocumentGeneratedAt ?? certificate.issuedAt,
          url: certificate.latestDocumentUrl,
          provider: 'documentero',
          generatedBy: MIGRATION_ACTOR_EMAIL,
        }
      : null;

  return {
    person,
    publicRecord,
    userRecord,
    documentRecord,
  };
}

function resolveLegacyCertificate(input: {
  sourceId: string;
  data: LegacyCertificateRecord;
  latestDocumentUrl: string | null;
  latestDocumentGeneratedAt: string | null;
}): ResolvedLegacyCertificate | null {
  const certificateCode = normalizeString(input.data.code);
  const holderName = normalizeString(input.data.holder?.name);
  if (!certificateCode || !holderName) {
    return null;
  }

  const issuedAt =
    parseLegacyDate(input.data.issueDate) ??
    parseLegacyDate(input.data.dates?.issued) ??
    new Date().toISOString();
  const validUntil =
    parseLegacyDate(input.data.expiryDate) ??
    parseLegacyDate(input.data.dates?.validUntil);
  const email = normalizeEmail(input.data.holder?.email);
  const company = normalizeString(input.data.holder?.company);
  const status = mapLegacyStatus(input.data.status, validUntil);
  const modules =
    Array.isArray(input.data.modules) && input.data.modules.length > 0
      ? input.data.modules
          .map((entry) => normalizeString(entry))
          .filter((entry): entry is string => Boolean(entry))
      : DEFAULT_MODULES;

  return {
    sourceId: input.sourceId,
    certificateCode,
    holderName,
    company,
    email,
    issuedAt,
    validUntil,
    status,
    modules: modules.length > 0 ? modules : DEFAULT_MODULES,
    latestDocumentUrl: input.latestDocumentUrl,
    latestDocumentGeneratedAt: input.latestDocumentGeneratedAt,
    testSignals: collectTestSignals({
      code: certificateCode,
      holderName,
      company,
      email,
    }),
  };
}

function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function getProjectDb(projectId: string): Firestore {
  const appName = `legacy-migration-${projectId}`;
  const existing = getApps().find((app) => app.name === appName);
  const app =
    existing ??
    initializeApp(
      {
        credential: applicationDefault(),
        projectId,
      },
      appName,
    );

  return getFirestore(existing ? getApp(appName) : app);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!hasFirebaseAdminCredentials()) {
    throw new Error(
      'Firebase Admin credentials are required. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS before running this migration.',
    );
  }

  const sourceDb = getProjectDb(options.sourceProjectId);
  const targetDb = getProjectDb(options.targetProjectId);

  console.log(
    `Starting legacy certificate migration in ${options.apply ? 'apply' : 'dry-run'} mode.`,
  );
  console.log(
    `Projects: source=${options.sourceProjectId} target=${options.targetProjectId}`,
  );
  console.log(
    `Flags: includeTestData=${options.includeTestData} overwriteExisting=${options.overwriteExisting}`,
  );

  const [
    legacyCertificatesSnapshot,
    legacyDocumentsSnapshot,
    existingPublicSnapshot,
    existingUserSnapshot,
  ] = await Promise.all([
    sourceDb.collection('zertifikatspruefung').get(),
    sourceDb.collection('certificate_documents').get(),
    targetDb.collection('public_certificates').get(),
    targetDb.collection('user_certificates').get(),
  ]);

  const latestLegacyDocumentBySourceId = new Map<
    string,
    LegacyCertificateDocumentRecord
  >();

  for (const doc of legacyDocumentsSnapshot.docs) {
    const entry = doc.data() as LegacyCertificateDocumentRecord;
    const sourceId = normalizeString(entry.certificateId);
    const url = normalizeString(entry.url);
    if (!sourceId || !url) {
      continue;
    }

    const current = latestLegacyDocumentBySourceId.get(sourceId);
    const currentGeneratedAt = current?.generatedAt ?? '';
    const nextGeneratedAt = entry.generatedAt ?? '';
    if (!current || nextGeneratedAt.localeCompare(currentGeneratedAt) > 0) {
      latestLegacyDocumentBySourceId.set(sourceId, entry);
    }
  }

  const existingPublicCodes = new Set(
    existingPublicSnapshot.docs.map((doc) => doc.id.trim()).filter(Boolean),
  );
  const existingUserByEmail = new Map(
    existingUserSnapshot.docs.map((doc) => [
      doc.id.trim().toLowerCase(),
      doc.data() as UserCertificateRecord,
    ]),
  );

  let invalidCount = 0;
  let skippedTestCount = 0;
  let duplicateCount = 0;

  const candidates: ResolvedLegacyCertificate[] = [];

  for (const doc of legacyCertificatesSnapshot.docs) {
    const latestDocument = latestLegacyDocumentBySourceId.get(doc.id);
    const resolved = resolveLegacyCertificate({
      sourceId: doc.id,
      data: doc.data() as LegacyCertificateRecord,
      latestDocumentUrl: normalizeString(latestDocument?.url),
      latestDocumentGeneratedAt:
        parseLegacyDate(latestDocument?.generatedAt) ?? null,
    });

    if (!resolved) {
      invalidCount += 1;
      continue;
    }

    if (!options.includeTestData && resolved.testSignals.length > 0) {
      skippedTestCount += 1;
      continue;
    }

    candidates.push(resolved);
  }

  const candidatesByCode = new Map<string, ResolvedLegacyCertificate[]>();
  for (const candidate of candidates) {
    const group = candidatesByCode.get(candidate.certificateCode) ?? [];
    group.push(candidate);
    candidatesByCode.set(candidate.certificateCode, group);
  }

  const selectedCandidates = Array.from(candidatesByCode.values()).map((group) => {
    if (group.length > 1) {
      duplicateCount += group.length - 1;
    }

    return [...group].sort(compareCandidates)[0];
  });

  selectedCandidates.sort(compareCandidates);

  const preferredUserRecords = new Map<string, MigrationPlan>();
  for (const candidate of selectedCandidates) {
    if (!isRealEmail(candidate.email)) {
      continue;
    }

    const plan = buildMigrationPlan(candidate);
    const existing = preferredUserRecords.get(candidate.email);
    if (!existing) {
      preferredUserRecords.set(candidate.email, plan);
      continue;
    }

    const comparison = compareCandidates(candidate, {
      sourceId: existing.person.certificateId.replace(/^legacy_/, ''),
      certificateCode: existing.person.certificateCode,
      holderName: existing.person.holderName,
      company: existing.person.company,
      email: existing.person.email,
      issuedAt: existing.person.issuedAt,
      validUntil: existing.person.validUntil,
      status: existing.person.status,
      modules: existing.person.modules,
      latestDocumentUrl: existing.person.latestDocumentUrl,
      latestDocumentGeneratedAt: existing.person.latestDocumentGeneratedAt,
      testSignals: [],
    });

    if (comparison < 0) {
      preferredUserRecords.set(candidate.email, plan);
    }
  }

  const plans = selectedCandidates.map(buildMigrationPlan);
  const existingUserSkipCount = plans.filter((plan) => {
    if (!plan.userRecord?.email) {
      return false;
    }

    const preferredPlan = preferredUserRecords.get(plan.userRecord.email);
    if (!preferredPlan || preferredPlan.person.certificateCode !== plan.person.certificateCode) {
      return true;
    }

    const existing = existingUserByEmail.get(plan.userRecord.email);
    if (!existing || options.overwriteExisting) {
      return false;
    }

    return (
      normalizeString(existing.certificateCode) !== null &&
      normalizeString(existing.certificateCode) !== plan.person.certificateCode
    );
  }).length;

  const skippedExistingPublic = plans.filter(
    (plan) =>
      existingPublicCodes.has(plan.publicRecord.certificateCode) &&
      !options.overwriteExisting,
  ).length;

  console.log(`Legacy source rows: ${legacyCertificatesSnapshot.size}`);
  console.log(`Resolved candidate rows: ${candidates.length}`);
  console.log(`Skipped invalid rows: ${invalidCount}`);
  console.log(`Skipped test/demo rows: ${skippedTestCount}`);
  console.log(`Duplicate rows collapsed: ${duplicateCount}`);
  console.log(`Unique certificate codes selected: ${plans.length}`);
  console.log(`Would skip existing public records: ${skippedExistingPublic}`);
  console.log(`Would skip conflicting user records: ${existingUserSkipCount}`);

  if (!options.apply) {
    console.log('');
    console.log('Dry run complete. No writes were performed.');
    console.log('Run with --apply to execute the migration.');
    console.log(
      `Example codes: ${plans
        .slice(0, 10)
        .map((plan) => plan.person.certificateCode)
        .join(', ')}`,
    );
    return;
  }

  const operationGroups: Array<() => FirebaseFirestore.WriteBatch> = [];

  const writes: Array<{
    type: 'person' | 'public' | 'user' | 'document';
    path: string;
    data:
      | PersonCertificateRecord
      | PublicCertificateRecord
      | UserCertificateRecord
      | CertificateDocumentRecord;
  }> = [];

  for (const plan of plans) {
    writes.push({
      type: 'person',
      path: `person_certificates/${plan.person.certificateId}`,
      data: plan.person,
    });

    if (!existingPublicCodes.has(plan.publicRecord.certificateCode) || options.overwriteExisting) {
      writes.push({
        type: 'public',
        path: `public_certificates/${plan.publicRecord.certificateCode}`,
        data: plan.publicRecord,
      });
    }

    if (plan.documentRecord) {
      writes.push({
        type: 'document',
        path: `certificate_documents/${plan.documentRecord.documentId}`,
        data: plan.documentRecord,
      });
    }

    if (plan.userRecord?.email) {
      const preferredPlan = preferredUserRecords.get(plan.userRecord.email);
      const existingUser = existingUserByEmail.get(plan.userRecord.email);
      const isPreferredUserPlan =
        preferredPlan?.person.certificateCode === plan.person.certificateCode;
      const hasConflictingExistingUser =
        !options.overwriteExisting &&
        existingUser &&
        normalizeString(existingUser.certificateCode) !== null &&
        normalizeString(existingUser.certificateCode) !== plan.person.certificateCode;

      if (isPreferredUserPlan && !hasConflictingExistingUser) {
        writes.push({
          type: 'user',
          path: `user_certificates/${plan.userRecord.email}`,
          data: plan.userRecord,
        });
      }
    }
  }

  for (const writeGroup of chunkArray(writes, 400)) {
    operationGroups.push(() => {
      const batch = targetDb.batch();
      for (const write of writeGroup) {
        const [collectionName, documentId] = write.path.split('/');
        batch.set(targetDb.collection(collectionName).doc(documentId), write.data, {
          merge: true,
        });
      }
      return batch;
    });
  }

  for (const createBatch of operationGroups) {
    await createBatch().commit();
  }

  const writeCounts = writes.reduce<Record<string, number>>((totals, write) => {
    totals[write.type] = (totals[write.type] ?? 0) + 1;
    return totals;
  }, {});

  console.log('');
  console.log('Migration complete.');
  console.log(`Person certificates written: ${writeCounts.person ?? 0}`);
  console.log(`Public certificates written: ${writeCounts.public ?? 0}`);
  console.log(`User certificate pointers written: ${writeCounts.user ?? 0}`);
  console.log(`Certificate documents written: ${writeCounts.document ?? 0}`);
}

main().catch((error) => {
  console.error('Legacy certificate migration failed.');
  console.error(error);
  process.exitCode = 1;
});
