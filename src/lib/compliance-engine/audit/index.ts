/**
 * Barrel export for compliance-engine/audit module.
 *
 * Sprint: GN-C Governance-Report + Audit-Dossier
 */

// ── Audit Export (existing) ─────────────────────────────────────────────────
export {
    generateAuditExport,
    auditToCSV,
    type AuditExport,
    type AuditRecord,
} from './audit-export';

// ── Governance Stichtagsreport (Pro) ────────────────────────────────────────
export {
    generateGovernanceReport,
    governanceReportToCSV,
    type GovernanceReportData,
    type GovernanceReportSummary,
    type GovernanceReportUseCaseDetail,
} from './governance-report';

// ── ISO 42001 Audit-Dossier (Enterprise) ────────────────────────────────────
export {
    buildAuditDossier,
    dossierToMarkdown,
    isDossierGeneratable,
    getDossierBlockers,
    type AuditDossierData,
    type DossierOrganisation,
    type DossierExecutiveSummary,
    type DossierUseCaseChapter,
    type ISOAlignment,
    type ISOAlignmentStep,
} from './dossier-builder';
