/**
 * ISO 42001 Audit-Dossier Builder – Structured audit documentation generator.
 *
 * Generates a comprehensive dossier aligned with ISO/IEC 42001 structure
 * for Enterprise-plan users. The dossier documents the current state of
 * AI governance – it does NOT certify or guarantee compliance.
 *
 * Design:
 *   - NUR .ts, KEIN JSX, KEIN React, KEINE Komponenten
 *   - Pure functions (no Firestore, no side effects)
 *   - Defensive Formulierung: "Dokumentierter IST-Zustand" nicht "Compliance-Bestätigung"
 *   - Alle Texte auf Deutsch
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

// ── German Labels ───────────────────────────────────────────────────────────

const OVERSIGHT_MODEL_LABELS: Record<string, string> = {
    HITL: 'Human-in-the-Loop',
    HOTL: 'Human-on-the-Loop',
    HUMAN_REVIEW: 'Menschliche Überprüfung',
    NO_HUMAN: 'Keine menschliche Aufsicht',
    unknown: 'Nicht festgelegt',
};

function getDataCategoryLabel(category: string | undefined): string {
    return DATA_CATEGORY_LABELS[(category ?? 'INTERNAL_CONFIDENTIAL') as keyof typeof DATA_CATEGORY_LABELS] ?? category ?? '–';
}

function getOversightModelLabel(model: string | undefined | null): string {
    return OVERSIGHT_MODEL_LABELS[model ?? 'unknown'] ?? model ?? 'Nicht festgelegt';
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
                ? `${useCases.length} KI-Anwendungsfälle erfasst. Branche: ${orgSettings.industry || 'nicht angegeben'}. ` +
                  `Organisation: ${orgSettings.organisationName || 'nicht angegeben'}.`
                : 'Keine KI-Anwendungsfälle erfasst.',
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
                ? `${reviewedUseCases.length} von ${useCases.length} Anwendungsfällen geprüft. ` +
                  `Risikokategorien wurden anhand von Expositions-Score und Datenkategorien bewertet.`
                : 'Noch keine formale Risikobewertung durchgeführt.',
        },

        // Clause 8: Operation
        step4_operation: {
            status: useCasesWithISO.length > 0,
            evidence: useCasesWithISO.length > 0
                ? `${useCasesWithISO.length} Anwendungsfälle mit definiertem Review-Zyklus. ` +
                  `Aufsichtsmodelle und Dokumentationsebenen sind erfasst.`
                : 'Keine operativen ISO-Kontrollen konfiguriert.',
        },

        // Clause 9: Performance Evaluation
        step5_monitoring: {
            status: hasReviewStandard && reviewedUseCases.length > 0,
            evidence: hasReviewStandard
                ? `Review-Standard: ${orgSettings.reviewStandard}. ` +
                  `${reviewedUseCases.length} Anwendungsfälle mit durchgeführtem Review.`
                : 'Kein organisationsweiter Review-Standard festgelegt.',
        },

        // Clause 10: Improvement
        step6_improvement: {
            status: hasIncidentProcess,
            evidence: hasIncidentProcess
                ? `Incident-Management-Prozess dokumentiert: ${orgSettings.incidentProcess!.url}`
                : 'Kein dokumentierter Incident-Management-Prozess.',
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
        parts.push(`KI-Richtlinie vorhanden: ${orgSettings.aiPolicy!.url}`);
        if (orgSettings.aiPolicy!.owner) {
            parts.push(`Verantwortlich: ${orgSettings.aiPolicy!.owner}`);
        }
    } else {
        parts.push('Keine KI-Richtlinie hinterlegt');
    }
    if (hasRolesFramework) {
        parts.push('Verantwortlichkeitsrahmen definiert');
    } else {
        parts.push('Kein formaler Verantwortlichkeitsrahmen');
    }
    return parts.join('. ') + '.';
}

// ── Overall Maturity ────────────────────────────────────────────────────────

/**
 * Derive an overall maturity assessment from scores and alignment.
 * Returns a German label.
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

    if (avgQuality >= 80 && alignedSteps >= 5) return 'Fortgeschritten';
    if (avgQuality >= 60 && alignedSteps >= 3) return 'Aufbauend';
    if (avgQuality >= 40 && alignedSteps >= 2) return 'Grundlegend';
    if (avgQuality >= 20) return 'Initial';
    return 'Nicht bewertet';
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
 *   // dossier.executiveSummary.overallMaturity === 'Aufbauend'
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
        ? `Vorhanden (${orgSettings.aiPolicy.url})`
        : 'Nicht hinterlegt';

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
                || (uc.responsibility?.isCurrentlyResponsible ? 'Selbst verantwortlich' : '–'),
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
        blockers.push('Organisationsname fehlt in den Einstellungen');
    }
    if (!orgSettings.industry?.trim()) {
        blockers.push('Branche fehlt in den Einstellungen');
    }
    if (!orgSettings.aiPolicy?.url?.trim()) {
        blockers.push('KI-Richtlinie (AI Policy) muss hinterlegt sein');
    }
    if (useCases.length === 0) {
        blockers.push('Keine Use Cases vorhanden');
    } else if (!useCases.some(uc => uc.status !== 'UNREVIEWED')) {
        blockers.push('Mindestens ein geprüfter Use Case erforderlich');
    }

    return blockers;
}

// ── Markdown Serialization ──────────────────────────────────────────────────

/**
 * Format an ISO date string to German date format.
 */
function formatDateDE(isoDate: string): string {
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '–';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return '–';
    }
}

/**
 * Convert an AuditDossierData to a structured Markdown document.
 *
 * Structure:
 *   1. Deckblatt (Title Page)
 *   2. Inhaltsverzeichnis
 *   3. Zusammenfassung (Executive Summary)
 *   4. ISO 42001 Alignment
 *   5. Kapitel pro Use Case
 *   6. Haftungshinweis (Disclaimer)
 *
 * @param dossier  AuditDossierData from buildAuditDossier()
 * @returns Structured Markdown string
 */
export function dossierToMarkdown(dossier: AuditDossierData): string {
    const lines: string[] = [];

    // ── 1. Deckblatt ─────────────────────────────────────────────────────
    lines.push('# KI-Governance Audit-Dossier');
    lines.push('');
    lines.push(`**Organisation:** ${dossier.organisation.name}`);
    lines.push(`**Branche:** ${dossier.organisation.industry}`);
    lines.push(`**Ansprechpartner:** ${dossier.organisation.contact}`);
    lines.push(`**Erstellt am:** ${formatDateDE(dossier.generatedAt)}`);
    lines.push('');
    lines.push('> **Hinweis:** Dieses Dokument dokumentiert den IST-Zustand der KI-Governance.');
    lines.push('> Es stellt keine Compliance-Bestätigung, Zertifizierung oder rechtliche Bewertung dar.');
    lines.push('> Die Verantwortung für regulatorische Konformität verbleibt bei der Organisation.');
    lines.push('');
    lines.push('---');
    lines.push('');

    // ── 2. Inhaltsverzeichnis ────────────────────────────────────────────
    lines.push('## Inhaltsverzeichnis');
    lines.push('');
    lines.push('1. Zusammenfassung');
    lines.push('2. ISO 42001 Alignment');
    for (let i = 0; i < dossier.useCaseChapters.length; i++) {
        lines.push(`${i + 3}. ${dossier.useCaseChapters[i].name}`);
    }
    lines.push(`${dossier.useCaseChapters.length + 3}. Haftungshinweis`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // ── 3. Zusammenfassung ───────────────────────────────────────────────
    lines.push('## 1. Zusammenfassung');
    lines.push('');
    lines.push('| Kennzahl | Wert |');
    lines.push('|---|---|');
    lines.push(`| Erfasste Use Cases | ${dossier.executiveSummary.totalUseCases} |`);
    lines.push(`| Davon geprüft | ${dossier.executiveSummary.reviewedCount} |`);
    lines.push(`| Hoch-/Kritisch-Risiko | ${dossier.executiveSummary.highRiskCount} |`);
    lines.push(`| Gesamtreife | ${dossier.executiveSummary.overallMaturity} |`);
    lines.push(`| KI-Richtlinie | ${dossier.executiveSummary.policyStatus} |`);
    lines.push('');

    // ── 4. ISO 42001 Alignment ───────────────────────────────────────────
    lines.push('## 2. ISO 42001 Alignment');
    lines.push('');
    lines.push('Die folgende Übersicht zeigt den dokumentierten Stand der Umsetzung je ISO/IEC 42001 Abschnitt.');
    lines.push('');

    const alignmentSteps: [string, string, ISOAlignmentStep][] = [
        ['Abschnitt 4', 'Kontext der Organisation', dossier.isoAlignment.step1_context],
        ['Abschnitt 5', 'Führung', dossier.isoAlignment.step2_leadership],
        ['Abschnitt 6', 'Planung', dossier.isoAlignment.step3_planning],
        ['Abschnitt 8', 'Betrieb', dossier.isoAlignment.step4_operation],
        ['Abschnitt 9', 'Leistungsbewertung', dossier.isoAlignment.step5_monitoring],
        ['Abschnitt 10', 'Verbesserung', dossier.isoAlignment.step6_improvement],
    ];

    lines.push('| ISO-Abschnitt | Bereich | Status | Nachweis |');
    lines.push('|---|---|---|---|');
    for (const [clause, area, step] of alignmentSteps) {
        const statusIcon = step.status ? 'Dokumentiert' : 'Ausstehend';
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

        lines.push('| Eigenschaft | Wert |');
        lines.push('|---|---|');
        lines.push(`| Tool | ${chapter.toolName} |`);
        lines.push(`| Zweck | ${chapter.purpose} |`);
        lines.push(`| Risikokategorie | ${chapter.riskCategoryLabel} |`);
        lines.push(`| Aufsichtsmodell | ${getOversightModelLabel(chapter.oversightModel)} |`);
        lines.push(`| Datenkategorie | ${chapter.dataCategoryLabel} |`);
        lines.push(`| Governance-Qualität | ${chapter.qualityScore}% (${chapter.qualityLabel}) |`);
        lines.push(`| Status | ${chapter.currentStatusLabel} |`);
        lines.push(`| Verantwortlich | ${chapter.responsibleParty} |`);
        lines.push(`| Nächstes Review | ${chapter.nextReviewDate ? formatDateDE(chapter.nextReviewDate) : 'Nicht festgelegt'} |`);
        lines.push('');

        // Review-Historie
        if (chapter.reviewHistory.length > 0) {
            lines.push('### Review-Historie');
            lines.push('');
            lines.push('| Datum | Prüfer | Status | Anmerkungen |');
            lines.push('|---|---|---|---|');
            for (const review of chapter.reviewHistory) {
                const statusLabel = registerUseCaseStatusLabels[review.status as keyof typeof registerUseCaseStatusLabels] ?? review.status;
                const notes = (review.notes ?? '–').replace(/\|/g, '\\|');
                lines.push(`| ${formatDateDE(review.date)} | ${review.reviewer} | ${statusLabel} | ${notes} |`);
            }
            lines.push('');
        } else {
            lines.push('*Noch kein Review durchgeführt.*');
            lines.push('');
        }
    }

    // ── 6. Haftungshinweis ───────────────────────────────────────────────
    const disclaimerNum = dossier.useCaseChapters.length + 3;
    lines.push(`## ${disclaimerNum}. Haftungshinweis`);
    lines.push('');
    lines.push('Dieses Dossier wurde automatisch auf Basis der im Register erfassten Daten erstellt.');
    lines.push('Es dokumentiert ausschließlich den IST-Zustand zum angegebenen Stichtag.');
    lines.push('');
    lines.push('**Dieses Dokument ist ausdrücklich keine:**');
    lines.push('- Bestätigung der Konformität mit dem EU AI Act oder anderen Regularien');
    lines.push('- ISO/IEC 42001 Zertifizierung oder Audit-Ergebnis');
    lines.push('- Rechtliche Bewertung oder Rechtsberatung');
    lines.push('- Garantie für die Vollständigkeit oder Richtigkeit der erfassten Daten');
    lines.push('');
    lines.push('Die Organisation ist allein verantwortlich für die Sicherstellung der regulatorischen Konformität.');
    lines.push('Für eine formale Zertifizierung nach ISO/IEC 42001 ist ein akkreditierter Auditor erforderlich.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*Generiert am ${formatDateDE(dossier.generatedAt)} | kiregister.com Governance Platform*`);

    return lines.join('\n');
}
