import type { UseCaseCard, OrgSettings } from '@/lib/register-first/types';
import { resolveDataCategories, resolveDecisionInfluence } from '@/lib/register-first/types';
import type { DataCategory } from '@/lib/register-first/types';

export type ExposureLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Optional org context for exposure scoring.
 * OrgSettings.scope contains PRODUCT_AI which adds +10 exposure.
 */
export interface ExposureOrgContext {
    scope?: OrgSettings['scope'];
}

/** Check if any category in the array matches */
function hasCategory(cats: DataCategory[], ...targets: DataCategory[]): boolean {
    return targets.some((t) => cats.includes(t));
}

/**
 * Exposure Score – measures how much risk a use case exposes the organization to.
 * NOT governance quality. Purely: external impact, data sensitivity, decision power.
 *
 * Raw score range: 0–100, then mapped to levels.
 *
 * Scoring logic (updated for DataCategory[] + DecisionInfluence):
 *   PUBLIC/EXTERNAL_PUBLIC in usageContexts: +30
 *   CUSTOMERS/CUSTOMER_FACING in usageContexts: +15
 *   SPECIAL_PERSONAL/HEALTH/BIOMETRIC/SENSITIVE in dataCategories: +25
 *   PERSONAL_DATA/PERSONAL in dataCategories: +15
 *   decisionInfluence AUTOMATED: +20 (PREPARATION: +10)
 *   APPLICANTS in usageContexts (Art. 6 HR Hochrisiko): +15
 *   PRODUCT_AI in org scope: +10
 */
export function calculateExposureRaw(
    useCase: UseCaseCard,
    orgContext?: ExposureOrgContext,
): number {
    let score = 0;

    // External/public facing usage (new + legacy values)
    if (useCase.usageContexts?.includes('EXTERNAL_PUBLIC') || useCase.usageContexts?.includes('PUBLIC')) score += 30;
    if (useCase.usageContexts?.includes('CUSTOMER_FACING') || useCase.usageContexts?.includes('CUSTOMERS')) score += 15;

    // Applicants → Art. 6 AI Act HR-Recruitment high-risk indicator
    if (useCase.usageContexts?.includes('APPLICANTS')) score += 15;

    // Data sensitivity (uses resolve helper for backward compat)
    const cats = resolveDataCategories(useCase);
    if (hasCategory(cats, 'SPECIAL_PERSONAL', 'SENSITIVE', 'HEALTH_DATA', 'BIOMETRIC_DATA', 'POLITICAL_RELIGIOUS', 'OTHER_SENSITIVE')) {
        score += 25;
    } else if (hasCategory(cats, 'PERSONAL_DATA', 'PERSONAL')) {
        score += 15;
    }

    // Decision influence (new) with fallback to legacy decisionImpact
    const influence = resolveDecisionInfluence(useCase);
    if (influence === 'AUTOMATED') score += 20;
    else if (influence === 'PREPARATION') score += 10;

    // Org scope: PRODUCT_AI increases exposure
    if (orgContext?.scope?.includes('PRODUCT_AI')) score += 10;

    return Math.min(score, 100);
}

/**
 * Map raw exposure score to level.
 */
export function calculateExposure(
    useCase: UseCaseCard,
    orgContext?: ExposureOrgContext,
): ExposureLevel {
    const raw = calculateExposureRaw(useCase, orgContext);
    if (raw >= 76) return 'critical';
    if (raw >= 51) return 'high';
    if (raw >= 26) return 'medium';
    return 'low';
}

/**
 * German label for exposure level.
 */
export function getExposureLabel(level: ExposureLevel): string {
    switch (level) {
        case 'critical': return 'Kritisch';
        case 'high': return 'Hoch';
        case 'medium': return 'Mittel';
        case 'low': return 'Gering';
    }
}

/**
 * Color for exposure level (for cards/badges).
 */
export function getExposureColor(level: ExposureLevel): string {
    switch (level) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        case 'low': return '#22c55e';
    }
}
