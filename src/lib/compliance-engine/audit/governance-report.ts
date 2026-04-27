/**
 * Governance-Stichtagsreport – Point-in-time governance status report.
 *
 * Generates a structured snapshot of all use cases' governance state
 * at the time of generation. Designed for Pro-plan users.
 *
 * Design:
 *   - NUR .ts, KEIN JSX, KEIN React, KEINE Komponenten
 *   - Pure functions (no Firestore, no side effects)
 *   - Keine Compliance-Zusicherungen – nur dokumentierter IST-Zustand
 *   - CSV: Semikolon-getrennt (Excel-DE-kompatibel), UTF-8 BOM
 *   - Deutsche Spaltenüberschriften und Labels
 *
 * Sprint: GN-C Governance-Stichtagsreport
 */

import {
    getDataCategoryLabel as getRegisterDataCategoryLabel,
    resolvePrimaryDataCategory,
    type UseCaseCard,
    type OrgSettings,
} from '@/lib/register-first/types';
import { getRegisterUseCaseStatusLabel } from '@/lib/register-first/status-flow';
import {
    calculateGovernanceQuality,
    getGovernanceQualityLabel,
    calculateExposure,
    getExposureLabel,
} from '../scores';
import {
    calculateReviewDeadline,
    type DeadlineStatus,
} from '../reminders/review-deadline';
import {
    formatGovernanceDate,
    resolveGovernanceCopyLocale,
} from '@/lib/i18n/governance-copy';

// ── Types ───────────────────────────────────────────────────────────────────

export interface GovernanceReportSummary {
    totalUseCases: number;
    reviewedCount: number;
    unreviewedCount: number;
    overdueCount: number;
    avgQuality: number;
    avgQualityLabel: string;
    maxExposure: string;
}

export interface GovernanceReportUseCaseDetail {
    name: string;
    status: string;
    statusLabel: string;
    riskCategory: string;
    lastReviewDate: string | null;
    nextDueDate: string | null;
    deadlineStatus: string;
    reviewCount: number;
    qualityScore: number;
    qualityLabel: string;
    responsibleParty: string;
    dataCategory: string;
    toolName: string;
}

export interface GovernanceReportData {
    /** ISO timestamp of generation */
    generatedAt: string;
    /** Organisation name from OrgSettings */
    organisationName: string;
    /** Industry from OrgSettings */
    industry: string;
    /** Summary statistics */
    summary: GovernanceReportSummary;
    /** Per-use-case detail rows */
    useCaseDetails: GovernanceReportUseCaseDetail[];
}

// ── German Labels ───────────────────────────────────────────────────────────

function getDataCategoryLabel(category: string | undefined, locale?: string): string {
    return getRegisterDataCategoryLabel(
        (category ?? 'INTERNAL_CONFIDENTIAL') as Parameters<typeof getRegisterDataCategoryLabel>[0],
        locale,
    ) ?? category ?? '–';
}

function getLocalizedExposureLabel(level: ReturnType<typeof calculateExposure>, locale?: string): string {
    const isGerman = resolveGovernanceCopyLocale(locale) === 'de';
    if (!isGerman) {
        switch (level) {
            case 'critical': return 'Critical';
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
        }
    }
    return getExposureLabel(level);
}

function getLocalizedGovernanceQualityLabel(score: number, locale?: string): string {
    const isGerman = resolveGovernanceCopyLocale(locale) === 'de';
    if (!isGerman) return getGovernanceQualityLabel(score);
    if (score >= 80) return 'Stark';
    if (score >= 60) return 'Solide';
    if (score >= 40) return 'Im Aufbau';
    if (score >= 20) return 'Unvollständig';
    return 'Nicht bewertet';
}

function getLocalizedDeadlineStatusLabel(status: DeadlineStatus, locale?: string): string {
    const isGerman = resolveGovernanceCopyLocale(locale) === 'de';
    if (!isGerman) {
        switch (status) {
            case 'overdue': return 'Overdue';
            case 'due_soon': return 'Due soon';
            case 'on_track': return 'On track';
            case 'no_deadline': return 'No deadline';
        }
    }
    switch (status) {
        case 'overdue': return 'Überfällig';
        case 'due_soon': return 'Bald fällig';
        case 'on_track': return 'Im Zeitplan';
        case 'no_deadline': return 'Keine Frist';
    }
}

// ── Generator ───────────────────────────────────────────────────────────────

/**
 * Generate a point-in-time governance report.
 *
 * Combines:
 *   - Score functions (calculateGovernanceQuality, calculateExposure)
 *   - Deadline engine (calculateReviewDeadline)
 *   - Status labels from status-flow
 *
 * @param useCases    All UseCaseCards to include
 * @param orgSettings Organisation settings for context
 * @param now         Optional clock override for testing
 * @returns GovernanceReportData ready for CSV export or display
 *
 * @example
 *   const report = generateGovernanceReport(useCases, orgSettings);
 *   // report.summary.totalUseCases === useCases.length
 *   // report.useCaseDetails[0].qualityScore === 75
 *   // report.useCaseDetails[0].deadlineStatus === 'Im Zeitplan'
 */
export function generateGovernanceReport(
    useCases: UseCaseCard[],
    orgSettings: OrgSettings,
    now: Date = new Date(),
    locale?: string,
): GovernanceReportData {
    const orgContext = orgSettings.scope
        ? { scope: orgSettings.scope }
        : undefined;

    let totalQuality = 0;
    let maxExposureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const exposurePriority = { low: 0, medium: 1, high: 2, critical: 3 };

    let reviewedCount = 0;
    let unreviewedCount = 0;
    let overdueCount = 0;

    const useCaseDetails: GovernanceReportUseCaseDetail[] = [];

    for (const uc of useCases) {
        // Scores
        const quality = calculateGovernanceQuality(uc);
        const exposure = calculateExposure(uc, orgContext);
        totalQuality += quality;

        if (exposurePriority[exposure] > exposurePriority[maxExposureLevel]) {
            maxExposureLevel = exposure;
        }

        // Status counts
        if (uc.status === 'UNREVIEWED') {
            unreviewedCount++;
        } else {
            reviewedCount++;
        }

        // Deadline
        const deadline = calculateReviewDeadline(uc, now);
        if (deadline.status === 'overdue') {
            overdueCount++;
        }

        // Last review date
        const lastReview = uc.governanceAssessment?.flex?.iso?.lastReviewedAt
            ?? (uc.reviews.length > 0
                ? [...uc.reviews].sort(
                    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
                )[0].reviewedAt
                : null);

        // Responsible party
        const responsible = uc.responsibility?.responsibleParty
            || (uc.responsibility?.isCurrentlyResponsible
                ? (resolveGovernanceCopyLocale(locale) === 'de' ? 'Selbst verantwortlich' : 'Self responsible')
                : '–');

        useCaseDetails.push({
            name: uc.purpose,
            status: uc.status,
            statusLabel: getRegisterUseCaseStatusLabel(uc.status, locale) ?? uc.status,
            riskCategory: getLocalizedExposureLabel(exposure, locale),
            lastReviewDate: lastReview ? formatReportDate(lastReview, locale) : null,
            nextDueDate: deadline.nextReviewAt ? formatReportDate(deadline.nextReviewAt, locale) : null,
            deadlineStatus: getLocalizedDeadlineStatusLabel(deadline.status, locale),
            reviewCount: uc.reviews.length,
            qualityScore: quality,
            qualityLabel: getLocalizedGovernanceQualityLabel(quality, locale),
            responsibleParty: responsible,
            dataCategory: getDataCategoryLabel(resolvePrimaryDataCategory(uc), locale),
            toolName: uc.toolFreeText || uc.toolId || '–',
        });
    }

    const avgQuality = useCases.length > 0
        ? Math.round(totalQuality / useCases.length)
        : 0;

    return {
        generatedAt: now.toISOString(),
        organisationName: orgSettings.organisationName || '–',
        industry: orgSettings.industry || '–',
        summary: {
            totalUseCases: useCases.length,
            reviewedCount,
            unreviewedCount,
            overdueCount,
            avgQuality,
            avgQualityLabel: getLocalizedGovernanceQualityLabel(avgQuality, locale),
            maxExposure: getLocalizedExposureLabel(maxExposureLevel, locale),
        },
        useCaseDetails,
    };
}

// ── CSV Serialization ───────────────────────────────────────────────────────

/** UTF-8 BOM for Excel compatibility */
const UTF8_BOM = '\uFEFF';

const REPORT_CSV_HEADERS_DE = [
    'Use-Case Name',
    'Status',
    'Risikokategorie',
    'Letztes Review',
    'Nächste Frist',
    'Frist-Status',
    'Anzahl Reviews',
    'Governance-Qualität',
    'Qualitäts-Label',
    'Verantwortlich',
    'Datenkategorie',
    'Tool',
];

const REPORT_CSV_HEADERS_EN = [
    'Use case name',
    'Status',
    'Risk category',
    'Last review',
    'Next deadline',
    'Deadline status',
    'Review count',
    'Governance quality',
    'Quality label',
    'Responsible',
    'Data category',
    'Tool',
];

/**
 * Escape a value for semicolon-delimited CSV.
 * Handles semicolons, quotes, and newlines.
 */
function escapeCSVSemicolon(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Format an ISO date string to German date format (DD.MM.YYYY).
 *
 * @example
 *   formatDateDE('2026-02-23T10:00:00Z'); // → '23.02.2026'
 *   formatDateDE('invalid');               // → '–'
 */
function formatReportDate(isoDate: string, locale?: string): string {
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '–';
        return formatGovernanceDate(d, locale);
    } catch {
        return '–';
    }
}

/**
 * Convert a GovernanceReportData to a semicolon-delimited CSV string.
 *
 * Features:
 *   - UTF-8 BOM for Excel-DE compatibility
 *   - Semikolon-getrennt (German Excel default delimiter)
 *   - Comment header with org info and summary stats
 *   - Deutsche Spaltenüberschriften
 *
 * @param report  GovernanceReportData from generateGovernanceReport()
 * @returns CSV string ready for file download
 *
 * @example
 *   const csv = governanceReportToCSV(report);
 *   // csv starts with UTF-8 BOM
 *   // csv uses semicolon as delimiter
 *   // csv has German headers
 */
export function governanceReportToCSV(
    report: GovernanceReportData,
    locale?: string,
): string {
    const isGerman = resolveGovernanceCopyLocale(locale) === 'de';
    const headers = isGerman ? REPORT_CSV_HEADERS_DE : REPORT_CSV_HEADERS_EN;
    const lines: string[] = [
        isGerman
            ? `# Governance-Stichtagsreport - ${report.organisationName}`
            : `# Governance Point-in-Time Report - ${report.organisationName}`,
        `# ${isGerman ? 'Erstellt am' : 'Generated at'}: ${formatReportDate(report.generatedAt, locale)}`,
        `# ${isGerman ? 'Branche' : 'Industry'}: ${report.industry}`,
        `# ${isGerman ? 'Gesamtanzahl Use Cases' : 'Total use cases'}: ${report.summary.totalUseCases}`,
        isGerman
            ? `# Davon geprüft: ${report.summary.reviewedCount} | Ungeprüft: ${report.summary.unreviewedCount} | Überfällig: ${report.summary.overdueCount}`
            : `# Reviewed: ${report.summary.reviewedCount} | Unreviewed: ${report.summary.unreviewedCount} | Overdue: ${report.summary.overdueCount}`,
        `# ${isGerman ? 'Durchschnittliche Governance-Qualität' : 'Average governance quality'}: ${report.summary.avgQuality}% (${report.summary.avgQualityLabel})`,
        `# ${isGerman ? 'Maximale Risikokategorie' : 'Maximum risk category'}: ${report.summary.maxExposure}`,
        isGerman
            ? `# HINWEIS: Dieser Report dokumentiert den IST-Zustand zum Stichtag. Er stellt keine Compliance-Bestätigung dar.`
            : `# NOTE: This report documents the point-in-time state. It is not a compliance confirmation.`,
        '',
        headers.map(escapeCSVSemicolon).join(';'),
    ];

    for (const detail of report.useCaseDetails) {
        lines.push([
            detail.name,
            detail.statusLabel,
            detail.riskCategory,
            detail.lastReviewDate ?? '–',
            detail.nextDueDate ?? '–',
            detail.deadlineStatus,
            String(detail.reviewCount),
            String(detail.qualityScore),
            detail.qualityLabel,
            detail.responsibleParty,
            detail.dataCategory,
            detail.toolName,
        ].map(escapeCSVSemicolon).join(';'));
    }

    return UTF8_BOM + lines.join('\n');
}
