import type { UseCaseCard, OrgSettings } from '@/lib/register-first/types';
import { calculateGovernanceQuality, getGovernanceQualityLabel } from './governance-quality';
import { calculateExposureRaw, calculateExposure, getExposureLabel, type ExposureLevel, type ExposureOrgContext } from './exposure-score';

export interface OrgScoreAggregation {
    /** Average governance quality across all use cases (0–100) */
    avgQuality: number;
    avgQualityLabel: string;
    /** Maximum exposure level across all use cases */
    maxExposure: ExposureLevel;
    maxExposureLabel: string;
    /** Count of use cases by exposure level */
    exposureDistribution: Record<ExposureLevel, number>;
    /** Per-use-case scores for detail views */
    perUseCase: {
        useCaseId: string;
        purpose: string;
        quality: number;
        qualityLabel: string;
        exposure: ExposureLevel;
        exposureRaw: number;
    }[];
    /** Total use cases analyzed */
    totalUseCases: number;
}

/**
 * Options for org-level score aggregation.
 */
export interface AggregateOrgScoresOptions {
    /** OrgSettings for scope-aware exposure scoring (optional) */
    orgSettings?: OrgSettings | null;
}

/**
 * Aggregate governance and exposure scores across all use cases for an organization.
 *
 * @param useCases  Array of UseCaseCards to score
 * @param options   Optional org context (e.g. orgSettings.scope for PRODUCT_AI exposure boost)
 */
export function aggregateOrgScores(
    useCases: UseCaseCard[],
    options?: AggregateOrgScoresOptions,
): OrgScoreAggregation {
    if (useCases.length === 0) {
        return {
            avgQuality: 0,
            avgQualityLabel: 'Keine Daten',
            maxExposure: 'low',
            maxExposureLabel: 'Gering',
            exposureDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            perUseCase: [],
            totalUseCases: 0,
        };
    }

    // Build org context for exposure scoring
    const orgContext: ExposureOrgContext | undefined = options?.orgSettings
        ? { scope: options.orgSettings.scope }
        : undefined;

    const exposurePriority: Record<ExposureLevel, number> = {
        low: 0, medium: 1, high: 2, critical: 3,
    };

    let totalQuality = 0;
    let maxExposure: ExposureLevel = 'low';
    const distribution: Record<ExposureLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const perUseCase: OrgScoreAggregation['perUseCase'] = [];

    for (const uc of useCases) {
        const quality = calculateGovernanceQuality(uc);
        const exposure = calculateExposure(uc, orgContext);
        const exposureRaw = calculateExposureRaw(uc, orgContext);

        totalQuality += quality;
        distribution[exposure]++;

        if (exposurePriority[exposure] > exposurePriority[maxExposure]) {
            maxExposure = exposure;
        }

        perUseCase.push({
            useCaseId: uc.useCaseId,
            purpose: uc.purpose,
            quality,
            qualityLabel: getGovernanceQualityLabel(quality),
            exposure,
            exposureRaw,
        });
    }

    const avgQuality = Math.round(totalQuality / useCases.length);

    return {
        avgQuality,
        avgQualityLabel: getGovernanceQualityLabel(avgQuality),
        maxExposure,
        maxExposureLabel: getExposureLabel(maxExposure),
        exposureDistribution: distribution,
        perUseCase,
        totalUseCases: useCases.length,
    };
}

export { calculateGovernanceQuality, calculateGovernanceQualityDetailed, getGovernanceQualityLabel } from './governance-quality';
export type { GovernanceQualityResult, QualityBreakdownEntry } from './governance-quality';
export { calculateExposure, calculateExposureRaw, getExposureLabel, getExposureColor, type ExposureLevel, type ExposureOrgContext } from './exposure-score';
