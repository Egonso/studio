
import { TrustPortalConfig } from "./types";

/**
 * Calculates a 'Trust Readiness Score' (0-100) based on the configuration and project data.
 * This score represents how transparent and complete the public disclosure is.
 * 
 * @param config The current Trust Portal configuration
 * @param hasAiSystems Whether any AI systems are listed/visible (from Portfolio)
 * @param hasPolicies Whether governance policies are generated/visible
 * @returns number between 0 and 100
 */
export function calculateTrustScore(
    config: TrustPortalConfig,
    hasAiSystems: boolean,
    hasPolicies: boolean
): number {
    let score = 20; // Base score for having the portal enabled

    // Content Quality (max 30)
    if (config.governanceStatement && config.governanceStatement.length > 50) score += 10;
    if (config.introduction && config.introduction.length > 20) score += 5;
    if (config.responsibilityText && config.responsibilityText.length > 20) score += 10;
    if (config.contactEmail) score += 5;

    // Transparency Factors (max 50)
    if (config.showRiskCategory) score += 10;
    if (config.showHumanOversight) score += 10;

    // Data Integration (max 30)
    if (hasAiSystems) score += 15; // Showing actual systems is great transparency
    if (config.showPolicies && hasPolicies) score += 15; // Showing policies builds trust

    return Math.min(100, score);
}
