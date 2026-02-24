import type { UseCaseCard, Register } from '@/lib/register-first/types';
import type { DiagnosticReport } from '../types';
import { calculateDiagnosticReport } from '../index/calculator';
import { aggregateOrgScores, type OrgScoreAggregation } from '../scores';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuditRecord {
    useCaseId: string;
    purpose: string;
    toolName: string;
    status: string;
    usageContexts: string[];
    dataCategory: string;
    decisionImpact: string;
    aiActCategory: string;
    governanceQuality: number;
    governanceQualityLabel: string;
    exposureLevel: string;
    exposureRaw: number;
    assessedAt: string | null;
    lastReviewedAt: string | null;
    responsibleParty: string;
    capturedAt: string;
    updatedAt: string;
    isPublicVisible: boolean;
    fieldProvenance?: Record<string, { source: string; overrideReason?: string }>;
}

export interface AuditExport {
    metadata: {
        exportedAt: string;
        exportedBy: string;
        registerVersion: string;
        organisationName: string;
        organisationUnit: string;
        industry: string;
        plan: string;
    };
    summary: {
        totalUseCases: number;
        diagnostic: DiagnosticReport;
        scores: OrgScoreAggregation;
    };
    records: AuditRecord[];
}

// ── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a complete audit export for a register.
 * Pure function: Register + UseCases → AuditExport
 */
export function generateAuditExport(
    register: Register,
    useCases: UseCaseCard[],
    exportedBy: string
): AuditExport {
    // Build engine context from register
    const orgStatus = {
        hasPolicy: Boolean(register.orgSettings?.aiPolicy?.url),
        hasIncidentProcess: Boolean(register.orgSettings?.incidentProcess?.url),
        hasRaciDefined: Boolean(register.orgSettings?.rolesFramework?.booleanDefined),
        trustPortalActive: Boolean(register.publicOrganisationDisclosure),
    };

    const diagnostic = calculateDiagnosticReport({ useCases, orgStatus });
    const scores = aggregateOrgScores(useCases);

    const records: AuditRecord[] = useCases.map((uc) => {
        const perUc = scores.perUseCase.find(p => p.useCaseId === uc.useCaseId);

        return {
            useCaseId: uc.useCaseId,
            purpose: uc.purpose,
            toolName: uc.toolFreeText || uc.toolId || '–',
            status: uc.status,
            usageContexts: uc.usageContexts || [],
            dataCategory: uc.dataCategory || '–',
            decisionImpact: uc.decisionImpact || '–',
            aiActCategory: uc.governanceAssessment?.core?.aiActCategory || 'Nicht bewertet',
            governanceQuality: perUc?.quality ?? 0,
            governanceQualityLabel: perUc?.qualityLabel ?? '–',
            exposureLevel: perUc?.exposure ?? 'low',
            exposureRaw: perUc?.exposureRaw ?? 0,
            assessedAt: uc.governanceAssessment?.core?.assessedAt ?? null,
            lastReviewedAt: uc.governanceAssessment?.flex?.iso?.lastReviewedAt ?? null,
            responsibleParty: uc.responsibility?.responsibleParty || (uc.responsibility?.isCurrentlyResponsible ? 'Selbst' : '–'),
            capturedAt: uc.createdAt,
            updatedAt: uc.updatedAt,
            isPublicVisible: uc.isPublicVisible || false,
            fieldProvenance: uc.fieldProvenance as AuditRecord['fieldProvenance'],
        };
    });

    return {
        metadata: {
            exportedAt: new Date().toISOString(),
            exportedBy,
            registerVersion: '1.0',
            organisationName: register.organisationName || '–',
            organisationUnit: register.organisationUnit || '–',
            industry: register.orgSettings?.industry || '–',
            plan: register.plan || 'free',
        },
        summary: {
            totalUseCases: useCases.length,
            diagnostic,
            scores,
        },
        records,
    };
}

// ── CSV Serialization ────────────────────────────────────────────────────────

const CSV_HEADERS = [
    'Use Case ID', 'Zweck', 'Tool', 'Status', 'Nutzungskontexte',
    'Datenkategorie', 'Entscheidungseinfluss', 'AI-Act Kategorie',
    'Gov. Quality', 'Gov. Label', 'Exposure', 'Exposure (raw)',
    'Bewertet am', 'Letztes Review', 'Verantwortlich',
    'Erfasst am', 'Aktualisiert am', 'Öffentlich',
];

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Convert audit records to CSV string.
 */
export function auditToCSV(audit: AuditExport): string {
    const lines: string[] = [
        `# Audit Export – ${audit.metadata.organisationName} – ${audit.metadata.exportedAt}`,
        `# Plan: ${audit.metadata.plan} | Exportiert von: ${audit.metadata.exportedBy}`,
        `# Governance Quality Ø: ${audit.summary.scores.avgQuality}% (${audit.summary.scores.avgQualityLabel})`,
        `# Max Exposure: ${audit.summary.scores.maxExposureLabel}`,
        '',
        CSV_HEADERS.map(escapeCSV).join(','),
    ];

    for (const r of audit.records) {
        lines.push([
            r.useCaseId,
            r.purpose,
            r.toolName,
            r.status,
            r.usageContexts.join('; '),
            r.dataCategory,
            r.decisionImpact,
            r.aiActCategory,
            String(r.governanceQuality),
            r.governanceQualityLabel,
            r.exposureLevel,
            String(r.exposureRaw),
            r.assessedAt || '–',
            r.lastReviewedAt || '–',
            r.responsibleParty,
            r.capturedAt,
            r.updatedAt,
            r.isPublicVisible ? 'Ja' : 'Nein',
        ].map(escapeCSV).join(','));
    }

    return lines.join('\n');
}
