import type { UseCaseCard, OrgSettings } from '@/lib/register-first/types';

export type ExposureLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Optional org context for exposure scoring.
 * OrgSettings.scope contains PRODUCT_AI which adds +10 exposure.
 */
export interface ExposureOrgContext {
    scope?: OrgSettings['scope'];
}

/**
 * Exposure Score – measures how much risk a use case exposes the organization to.
 * NOT governance quality. Purely: external impact, data sensitivity, decision power.
 *
 * Raw score range: 0–100, then mapped to levels.
 *
 * Scoring logic (from Sprint Plan S4-DUALSCORE):
 *   EXTERNAL_PUBLIC in usageContexts: +30
 *   CUSTOMER_FACING in usageContexts: +15
 *   dataCategory === SENSITIVE: +25 (PERSONAL: +15)
 *   decisionImpact === YES: +20 (UNSURE: +10)
 *   affectedParties enthält EXTERNAL_PEOPLE: +15 (GROUPS_OR_TEAMS: +5)
 *   PRODUCT_AI in org scope: +10
 */
export function calculateExposureRaw(
    useCase: UseCaseCard,
    orgContext?: ExposureOrgContext,
): number {
    let score = 0;

    // External/public facing usage
    if (useCase.usageContexts?.includes('EXTERNAL_PUBLIC')) score += 30;
    if (useCase.usageContexts?.includes('CUSTOMER_FACING')) score += 15;

    // Data sensitivity
    if (useCase.dataCategory === 'SENSITIVE') score += 25;
    else if (useCase.dataCategory === 'PERSONAL') score += 15;

    // Decision impact on people
    if (useCase.decisionImpact === 'YES') score += 20;
    else if (useCase.decisionImpact === 'UNSURE') score += 10;

    // Affected parties include external people
    if (useCase.affectedParties?.includes('EXTERNAL_PEOPLE')) score += 15;
    else if (useCase.affectedParties?.includes('GROUPS_OR_TEAMS')) score += 5;

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
