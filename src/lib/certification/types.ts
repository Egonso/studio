export type ExamAttemptStatus =
  | 'started'
  | 'submitted'
  | 'passed'
  | 'failed';

export type CertificateStatus = 'active' | 'expired' | 'revoked';
export type CertificateDocumentProvider = 'native' | 'documentero';

export type BadgeAlignment = 'left' | 'center' | 'right';

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ExamSection {
  id: string;
  title: string;
  questions: ExamQuestion[];
  videos?: string[];
}

export interface ExamDefinition {
  id: string;
  version: string;
  title: string;
  passThreshold: number;
  questionTimeLimitSeconds: number;
  sections: ExamSection[];
}

export interface ExamSectionResult {
  sectionId: string;
  sectionTitle: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
}

export interface ExamAttemptRecord {
  attemptId: string;
  examDefinitionId: string;
  examVersion: string;
  userId: string;
  email: string;
  startedAt: string;
  completedAt: string | null;
  attemptNumber: number;
  status: ExamAttemptStatus;
  sectionAnswers: number[][] | null;
  sectionResults: ExamSectionResult[] | null;
  totalScore: number | null;
  passThreshold: number;
}

export interface CertificateAuditEvent {
  id: string;
  type:
    | 'issued'
    | 'regenerated'
    | 'status_changed'
    | 'validity_changed'
    | 'manual_issue';
  createdAt: string;
  actorEmail: string;
  note: string;
}

export interface CertificateDocumentSourceSnapshot {
  certificateCode: string;
  holderName: string;
  company: string | null;
  issuedAt: string;
  validUntil: string | null;
  status: CertificateStatus;
  examVersion: string;
  modules: string[];
  publicUrl: string;
}

export interface CertificateDocumentRenderSnapshot {
  provider: CertificateDocumentProvider;
  templateId: string | null;
  badgeAssetUrl?: string | null;
}

export interface CertificateDocumentSnapshot {
  version: 1;
  source: CertificateDocumentSourceSnapshot;
  render: CertificateDocumentRenderSnapshot;
}

export interface CertificateDocumentRecord {
  documentId: string;
  certificateId: string;
  generatedAt: string;
  url: string;
  provider: CertificateDocumentProvider;
  generatedBy: string;
  snapshot?: CertificateDocumentSnapshot | null;
}

export interface PersonCertificateRecord {
  certificateId: string;
  certificateCode: string;
  userId: string;
  email: string;
  holderName: string;
  company: string | null;
  issuedAt: string;
  validUntil: string | null;
  status: CertificateStatus;
  examVersion: string;
  modules: string[];
  latestDocumentUrl: string | null;
  latestDocumentGeneratedAt: string | null;
  publicUrl: string;
  auditTrail: CertificateAuditEvent[];
}

export interface PublicCertificateRecord {
  certificateCode: string;
  certificateId: string;
  holderName: string;
  company: string | null;
  issuedDate: string;
  validUntil: string | null;
  status: CertificateStatus;
  modules: string[];
  verifyUrl: string;
  latestDocumentUrl: string | null;
}

export interface CertificationSettings {
  settingsId: string;
  defaultValidityMonths: number;
  documentProvider: CertificateDocumentProvider;
  documentTemplateId: string;
  badgeAssetUrl: string;
}

export interface UserCertificationSnapshot {
  hasPurchased: boolean;
  purchase: {
    date: string | null;
    amount: number | null;
    productId: string | null;
  } | null;
  examPassed: boolean | null;
  examDate: string | null;
  examAttempts: number;
  hasCertificate: boolean;
  certificate: {
    code: string;
    issuedDate: string;
    validUntil: string;
    holderName: string;
    status: CertificateStatus;
    latestDocumentUrl: string | null;
    verifyUrl: string;
    company: string | null;
    modules: string[];
  } | null;
}

export interface AdminCertificationOverview {
  settings: CertificationSettings;
  attempts: ExamAttemptRecord[];
  certificates: PersonCertificateRecord[];
}

export interface AdminCertificateDetail {
  certificate: PersonCertificateRecord | null;
  documents: CertificateDocumentRecord[];
}
