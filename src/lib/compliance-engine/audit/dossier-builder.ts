/**
 * ISO 42001 Audit-Dossier Builder – Structured audit documentation generator.
 *
 * Generates a comprehensive dossier aligned with ISO/IEC 42001 structure
 * for Enterprise-plan users. The dossier documents the current state of
 * AI governance – it does NOT certify or guarantee compliance.
 *
 * Design:
 *   - .ts only, no JSX, no React, no components
 *   - Pure functions (no Firestore, no side effects)
 *   - Defensive wording: "Documented current state" not "Compliance confirmation"
 *   - All text in English
 *   - Markdown output for downstream PDF/HTML rendering
 *
 * Sprint: GN-C ISO 42001 Audit-Dossier
 */

import {
    DATA_CATEGORY_LABELS,
    resolvePrimaryDataCategory,
    type UseCaseCard,
    type OrgSettings,
} from '@/lib/register-first/types';
import { registerUseCaseStatusLabels } from '@/lib/register-first/status-flow';
import {
    getGovernanceQualityLabel,
    getExposureLabel,
    aggregateOrgScores,
} from '../scores';
import { calculateReviewDeadline } from '../reminders/review-deadline';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ISOAlignmentStep {
    /** Whether there is evidence for this ISO step */
    status: boolean;
    /** Human-readable evidence summary */
    evidence: string;
}

export interface ISOAlignment {
    step1_context: ISOAlignmentStep;
    step2_leadership: ISOAlignmentStep;
    step3_planning: ISOAlignmentStep;
    step4_operation: ISOAlignmentStep;
    step5_monitoring: ISOAlignmentStep;
    step6_improvement: ISOAlignmentStep;
}

export interface DossierOrganisation {
    name: string;
    industry: string;
    contact: string;
}

export interface DossierExecutiveSummary {
    totalUseCases: number;
    reviewedCount: number;
    highRiskCount: number;
    overallMaturity: string;
    policyStatus: string;
}

export interface DossierUseCaseChapter {
    name: string;
    purpose: string;
    riskCategory: string;
    riskCategoryLabel: string;
    oversightModel: string;
    dataCategory: string;
    dataCategoryLabel: string;
    qualityScore: number;
    qualityLabel: string;
    reviewHistory: Array<{
        date: string;
        reviewer: string;
        status: string;
        notes?: string;
    }>;
    currentStatus: string;
    currentStatusLabel: string;
    responsibleParty: string;
    toolName: string;
    nextReviewDate: string | null;
    deadlineStatus: string;
}

export interface AuditDossierData {
    /** ISO timestamp of generation */
    generatedAt: string;
    /** Organisation info */
    organisation: DossierOrganisation;
    /** High-level summary for management */
    executiveSummary: DossierExecutiveSummary;
    /** ISO 42001 alignment assessment */
    isoAlignment: ISOAlignment;
    /** Detailed chapter per use case */
    useCaseChapters: DossierUseCaseChapter[];
}

// ── Labels ──────────────────────────────────────────────────────────────────

const OVERSIGHT_MODEL_LABELS: Record<string, string> = {
    HITL: 'Human-in-the-Loop',
    HOTL: 'Human-on-the-Loop',
    HUMAN_REVIEW: 'Human review',
    NO_HUMAN: 'No human oversight',
    unknown: 'Not specified',
};

function getDataCategoryLabel(category: string | undefined): string {
    return DATA_CATEGORY_LABELS[(category ?? 'INTERNAL_CONFIDENTIAL') as keyof typeof DATA_CATEGORY_LABELS] ?? category ?? '–';
}

function getOversightModelLabel(model: string | undefined | null): string {
    return OVERSIGHT_MODEL_LABELS[model ?? 'unknown'] ?? model ?? 'Not specified';
}

// ── ISO 42001 Alignment Assessment ──────────────────────────────────────────

/**
 * Assess ISO 42001 alignment based on available evidence.
 * Each step maps to a clause group in ISO/IEC 42001.
 *
 * NOTE: This is a documented assessment, NOT a certification.
 */
function assessISOAlignment(
    useCases: UseCaseCard[],
    orgSettings: OrgSettings,
): ISOAlignment {
    const hasUseCases = useCases.length > 0;
    const hasPolicy = Boolean(orgSettings.aiPolicy?.url);
    const hasIncidentProcess = Boolean(orgSettings.incidentProcess?.url);
    const hasRolesFramework = Boolean(orgSettings.rolesFramework?.booleanDefined);
    const hasReviewStandard = orgSettings.reviewStandard != null && orgSettings.reviewStandard !== null;
    const reviewedUseCases = useCases.filter(uc => uc.status !== 'UNREVIEWED');
    const useCasesWithISO = useCases.filter(
        uc => uc.governanceAssessment?.flex?.iso?.reviewCycle != null
            && uc.governanceAssessment.flex.iso.reviewCycle !== 'unknown',
    );

    return {
        // Clause 4: Context of the Organization
        step1_context: {
            status: hasUseCases && Boolean(orgSettings.industry),
            evidence: hasUseCases
                ? `${useCases.length} AI use cases documented. Industry: ${orgSettings.industry || 'not specified'}. ` +
                  `Organisation: ${orgSettings.organisationName || 'not specified'}.`
                : 'No AI use cases documented.',
        },

        // Clause 5: Leadership
        step2_leadership: {
            status: hasPolicy && hasRolesFramework,
            evidence: buildLeadershipEvidence(hasPolicy, hasRolesFramework, orgSettings),
        },

        // Clause 6: Planning (Risk Assessment)
        step3_planning: {
            status: reviewedUseCases.length > 0,
            evidence: reviewedUseCases.length > 0
                ? `${reviewedUseCases.length} of ${useCases.length} use cases reviewed. ` +
                  `Risk categories were assessed based on exposure score and data categories.`
                : 'No formal risk assessment carried out yet.',
        },

        // Clause 8: Operation
        step4_operation: {
            status: useCasesWithISO.length > 0,
            evidence: useCasesWithISO.length > 0
                ? `${useCasesWithISO.length} use cases with defined review cycle. ` +
                  `Oversight models and documentation levels are documented.`
                : 'No operational ISO controls configured.',
        },

        // Clause 9: Performance Evaluation
        step5_monitoring: {
            status: hasReviewStandard && reviewedUseCases.length > 0,
            evidence: hasReviewStandard
                ? `Review standard: ${orgSettings.reviewStandard}. ` +
                  `${reviewedUseCases.length} use cases with completed review.`
                : 'No organisation-wide review standard defined.',
        },

        // Clause 10: Improvement
        step6_improvement: {
            status: hasIncidentProcess,
            evidence: hasIncidentProcess
                ? `Incident management process documented: ${orgSettings.incidentProcess!.url}`
                : 'No documented incident management process.',
        },
    };
}

function buildLeadershipEvidence(
    hasPolicy: boolean,
    hasRolesFramework: boolean,
    orgSettings: OrgSettings,
): string {
    const parts: string[] = [];
    if (hasPolicy) {
        parts.push(`AI policy available: ${orgSettings.aiPolicy!.url}`);
        if (orgSettings.aiPolicy!.owner) {
            parts.push(`Responsible: ${orgSettings.aiPolicy!.owner}`);
        }
    } else {
        parts.push('No AI policy on file');
    }
    if (hasRolesFramework) {
        parts.push('Roles and responsibilities framework defined');
    } else {
        parts.push('No formal roles and responsibilities framework');
    }
    return parts.join('. ') + '.';
}

// ── Overall Maturity ────────────────────────────────────────────────────────

/**
 * Derive an overall maturity assessment from scores and alignment.
 */
function deriveOverallMaturity(
    avgQuality: number,
    alignment: ISOAlignment,
): string {
    const alignedSteps = [
        alignment.step1_context,
        alignment.step2_leadership,
        alignment.step3_planning,
        alignment.step4_operation,
        alignment.step5_monitoring,
        alignment.step6_improvement,
    ].filter(s => s.status).length;

    if (avgQuality >= 80 && alignedSteps >= 5) return 'Advanced';
    if (avgQuality >= 60 && alignedSteps >= 3) return 'Developing';
    if (avgQuality >= 40 && alignedSteps >= 2) return 'Basic';
    if (avgQuality >= 20) return 'Initial';
    return 'Not assessed';
}

// ── Dossier Builder ─────────────────────────────────────────────────────────

/**
 * Build a complete ISO 42001 Audit Dossier.
 *
 * @param useCases    All UseCaseCards to include
 * @param orgSettings Organisation settings for org-level evidence
 * @param now         Optional clock override for testing
 * @returns AuditDossierData ready for Markdown/PDF export
 *
 * @example
 *   const dossier = buildAuditDossier(useCases, orgSettings);
 *   // dossier.executiveSummary.overallMaturity === 'Developing'
 *   // dossier.isoAlignment.step2_leadership.status === true
 *   // dossier.useCaseChapters.length === useCases.length
 */
export function buildAuditDossier(
    useCases: UseCaseCard[],
    orgSettings: OrgSettings,
    now: Date = new Date(),
): AuditDossierData {
    const scores = aggregateOrgScores(useCases, { orgSettings });
    const isoAlignment = assessISOAlignment(useCases, orgSettings);

    const reviewedCount = useCases.filter(uc => uc.status !== 'UNREVIEWED').length;
    const highRiskCount = scores.perUseCase.filter(
        p => p.exposure === 'high' || p.exposure === 'critical',
    ).length;

    const overallMaturity = deriveOverallMaturity(scores.avgQuality, isoAlignment);

    const policyStatus = orgSettings.aiPolicy?.url
        ? `Available (${orgSettings.aiPolicy.url})`
        : 'Not on file';

    // Build per-use-case chapters
    const useCaseChapters: DossierUseCaseChapter[] = useCases.map((uc) => {
        const perUc = scores.perUseCase.find(p => p.useCaseId === uc.useCaseId);
        const deadline = calculateReviewDeadline(uc, now);

        const reviewHistory = uc.reviews.map(r => ({
            date: r.reviewedAt,
            reviewer: r.reviewedBy,
            status: r.nextStatus,
            notes: r.notes,
        }));

        const oversightModel = uc.governanceAssessment?.flex?.iso?.oversightModel ?? 'unknown';

        return {
            name: uc.purpose,
            purpose: uc.purpose,
            riskCategory: perUc?.exposure ?? 'low',
            riskCategoryLabel: getExposureLabel(perUc?.exposure ?? 'low'),
            oversightModel,
            dataCategory: resolvePrimaryDataCategory(uc) ?? 'INTERNAL_CONFIDENTIAL',
            dataCategoryLabel: getDataCategoryLabel(resolvePrimaryDataCategory(uc)),
            qualityScore: perUc?.quality ?? 0,
            qualityLabel: getGovernanceQualityLabel(perUc?.quality ?? 0),
            reviewHistory,
            currentStatus: uc.status,
            currentStatusLabel: registerUseCaseStatusLabels[uc.status] ?? uc.status,
            responsibleParty: uc.responsibility?.responsibleParty
                || (uc.responsibility?.isCurrentlyResponsible ? 'Self-responsible' : '–'),
            toolName: uc.toolFreeText || uc.toolId || '–',
            nextReviewDate: deadline.nextReviewAt,
            deadlineStatus: deadline.status,
        };
    });

    return {
        generatedAt: now.toISOString(),
        organisation: {
            name: orgSettings.organisationName || '–',
            industry: orgSettings.industry || '–',
            contact: orgSettings.contactPerson
                ? `${orgSettings.contactPerson.name} (${orgSettings.contactPerson.email})`
                : '–',
        },
        executiveSummary: {
            totalUseCases: useCases.length,
            reviewedCount,
            highRiskCount,
            overallMaturity,
            policyStatus,
        },
        isoAlignment,
        useCaseChapters,
    };
}

// ── Pre-Check ───────────────────────────────────────────────────────────────

/**
 * Check if a dossier can be generated from the given data.
 * Requirements:
 *   - orgSettings has organisationName and industry
 *   - At least 1 reviewed use case (status !== UNREVIEWED)
 *   - AI policy is defined (aiPolicy.url exists)
 *
 * @example
 *   isDossierGeneratable(useCases, orgSettings);
 *   // → true if all requirements met
 *
 *   isDossierGeneratable([], orgSettings);
 *   // → false (no use cases)
 *
 *   isDossierGeneratable(useCases, { ...orgSettings, aiPolicy: null });
 *   // → false (no AI policy)
 */
export function isDossierGeneratable(
    useCases: UseCaseCard[],
    orgSettings: OrgSettings,
): boolean {
    // Org completeness
    if (!orgSettings.organisationName?.trim()) return false;
    if (!orgSettings.industry?.trim()) return false;

    // AI policy required
    if (!orgSettings.aiPolicy?.url?.trim()) return false;

    // At least 1 reviewed use case
    const hasReviewedUseCase = useCases.some(uc => uc.status !== 'UNREVIEWED');
    if (!hasReviewedUseCase) return false;

    return true;
}

/**
 * Get a list of reasons why the dossier cannot be generated.
 * Returns empty array if everything is ready.
 *
 * @example
 *   getDossierBlockers([], orgSettings);
 *   // → ['Keine Use Cases vorhanden', 'Mindestens ein geprüfter Use Case erforderlich']
 */
export function getDossierBlockers(
    useCases: UseCaseCard[],
    orgSettings: OrgSettings,
): string[] {
    const blockers: string[] = [];

    if (!orgSettings.organisationName?.trim()) {
        blockers.push('Organisation name is missing in settings');
    }
    if (!orgSettings.industry?.trim()) {
        blockers.push('Industry is missing in settings');
    }
    if (!orgSettings.aiPolicy?.url?.trim()) {
        blockers.push('AI policy must be on file');
    }
    if (useCases.length === 0) {
        blockers.push('No use cases available');
    } else if (!useCases.some(uc => uc.status !== 'UNREVIEWED')) {
        blockers.push('At least one reviewed use case is required');
    }

    return blockers;
}

// ── Markdown Serialization ──────────────────────────────────────────────────

/**
 * Format an ISO date string to en-GB date format (DD Mon YYYY).
 */
function formatDateEN(isoDate: string): string {
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '–';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return '–';
    }
}

/**
 * Convert an AuditDossierData to a structured Markdown document.
 *
 * Structure:
 *   1. Title Page
 *   2. Table of Contents
 *   3. Executive Summary
 *   4. ISO 42001 Alignment
 *   5. Chapter per Use Case
 *   6. Disclaimer
 *
 * @param dossier  AuditDossierData from buildAuditDossier()
 * @returns Structured Markdown string
 */
export function dossierToMarkdown(dossier: AuditDossierData): string {
    const lines: string[] = [];

    // ── 1. Title Page ─────────────────────────────────────────────────────
    lines.push('# AI Governance Audit Dossier');
    lines.push('');
    lines.push(`**Organisation:** ${dossier.organisation.name}`);
    lines.push(`**Industry:** ${dossier.organisation.industry}`);
    lines.push(`**Contact:** ${dossier.organisation.contact}`);
    lines.push(`**Generated on:** ${formatDateEN(dossier.generatedAt)}`);
    lines.push('');
    lines.push('> **Note:** This document records the current state of AI governance.');
    lines.push('> It does not constitute a compliance confirmation, certification or legal assessment.');
    lines.push('> Responsibility for regulatory conformity remains with the organisation.');
    lines.push('');
    lines.push('---');
    lines.push('');

    // ── 2. Table of Contents ────────────────────────────────────────────
    lines.push('## Table of Contents');
    lines.push('');
    lines.push('1. Executive Summary');
    lines.push('2. ISO 42001 Alignment');
    for (let i = 0; i < dossier.useCaseChapters.length; i++) {
        lines.push(`${i + 3}. ${dossier.useCaseChapters[i].name}`);
    }
    lines.push(`${dossier.useCaseChapters.length + 3}. Disclaimer`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // ── 3. Executive Summary ───────────────────────────────────────────────
    lines.push('## 1. Executive Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|---|---|');
    lines.push(`| Documented use cases | ${dossier.executiveSummary.totalUseCases} |`);
    lines.push(`| Of which reviewed | ${dossier.executiveSummary.reviewedCount} |`);
    lines.push(`| High / critical risk | ${dossier.executiveSummary.highRiskCount} |`);
    lines.push(`| Overall maturity | ${dossier.executiveSummary.overallMaturity} |`);
    lines.push(`| AI policy | ${dossier.executiveSummary.policyStatus} |`);
    lines.push('');

    // ── 4. ISO 42001 Alignment ───────────────────────────────────────────
    lines.push('## 2. ISO 42001 Alignment');
    lines.push('');
    lines.push('The following overview shows the documented implementation status per ISO/IEC 42001 clause.');
    lines.push('');

    const alignmentSteps: [string, string, ISOAlignmentStep][] = [
        ['Clause 4', 'Context of the Organisation', dossier.isoAlignment.step1_context],
        ['Clause 5', 'Leadership', dossier.isoAlignment.step2_leadership],
        ['Clause 6', 'Planning', dossier.isoAlignment.step3_planning],
        ['Clause 8', 'Operation', dossier.isoAlignment.step4_operation],
        ['Clause 9', 'Performance Evaluation', dossier.isoAlignment.step5_monitoring],
        ['Clause 10', 'Improvement', dossier.isoAlignment.step6_improvement],
    ];

    lines.push('| ISO Clause | Area | Status | Evidence |');
    lines.push('|---|---|---|---|');
    for (const [clause, area, step] of alignmentSteps) {
        const statusIcon = step.status ? 'Documented' : 'Pending';
        // Escape pipe characters in evidence for Markdown table
        const evidence = step.evidence.replace(/\|/g, '\\|');
        lines.push(`| ${clause} | ${area} | ${statusIcon} | ${evidence} |`);
    }
    lines.push('');

    // ── 5. Use-Case-Kapitel ──────────────────────────────────────────────
    for (let i = 0; i < dossier.useCaseChapters.length; i++) {
        const chapter = dossier.useCaseChapters[i];
        const chapterNum = i + 3;

        lines.push(`## ${chapterNum}. ${chapter.name}`);
        lines.push('');

        lines.push('| Property | Value |');
        lines.push('|---|---|');
        lines.push(`| Tool | ${chapter.toolName} |`);
        lines.push(`| Purpose | ${chapter.purpose} |`);
        lines.push(`| Risk category | ${chapter.riskCategoryLabel} |`);
        lines.push(`| Oversight model | ${getOversightModelLabel(chapter.oversightModel)} |`);
        lines.push(`| Data category | ${chapter.dataCategoryLabel} |`);
        lines.push(`| Governance quality | ${chapter.qualityScore}% (${chapter.qualityLabel}) |`);
        lines.push(`| Status | ${chapter.currentStatusLabel} |`);
        lines.push(`| Responsible | ${chapter.responsibleParty} |`);
        lines.push(`| Next review | ${chapter.nextReviewDate ? formatDateEN(chapter.nextReviewDate) : 'Not specified'} |`);
        lines.push('');

        // Review-Historie
        if (chapter.reviewHistory.length > 0) {
            lines.push('### Review History');
            lines.push('');
            lines.push('| Date | Reviewer | Status | Notes |');
            lines.push('|---|---|---|---|');
            for (const review of chapter.reviewHistory) {
                const statusLabel = registerUseCaseStatusLabels[review.status as keyof typeof registerUseCaseStatusLabels] ?? review.status;
                const notes = (review.notes ?? '–').replace(/\|/g, '\\|');
                lines.push(`| ${formatDateEN(review.date)} | ${review.reviewer} | ${statusLabel} | ${notes} |`);
            }
            lines.push('');
        } else {
            lines.push('*No review carried out yet.*');
            lines.push('');
        }
    }

    // ── 6. Haftungshinweis ───────────────────────────────────────────────
    const disclaimerNum = dossier.useCaseChapters.length + 3;
    lines.push(`## ${disclaimerNum}. Disclaimer`);
    lines.push('');
    lines.push('This dossier was generated automatically based on the data recorded in the register.');
    lines.push('It documents exclusively the current state as of the indicated date.');
    lines.push('');
    lines.push('**This document is expressly not:**');
    lines.push('- A confirmation of conformity with the EU AI Act or other regulations');
    lines.push('- An ISO/IEC 42001 certification or audit result');
    lines.push('- A legal assessment or legal advice');
    lines.push('- A guarantee of the completeness or accuracy of the recorded data');
    lines.push('');
    lines.push('The organisation is solely responsible for ensuring regulatory conformity.');
    lines.push('A formal certification under ISO/IEC 42001 requires an accredited auditor.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*Generated on ${formatDateEN(dossier.generatedAt)} | airegist.com Governance Platform*`);

    return lines.join('\n');
}
