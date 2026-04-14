
import { ROUTE_HREFS } from "@/lib/navigation/route-manifest";

export interface ProjectProgress {
    aiActBaseWizardCompleted: boolean;
    policiesGenerated: boolean;
    isoWizardStarted: boolean; // Retained for backward compatibility/logic flow
    isoWizardCompleted?: boolean;
    projectName?: string; // For headline personalization
}

export interface Recommendation {
    key: 'AI_ACT_BASE' | 'COMPLIANCE_IN_A_DAY' | 'ISO_WIZARD' | 'MAINTENANCE';
    headline: string;
    acknowledgement?: string; // Optional
    primaryTitle: string;
    primaryMeta: string;
    primaryWhy: string;
    primaryCtaLabel: string;
    primaryHref: string;
    secondary?: Array<{ title: string; subtitle: string; href: string }>;
}

export function getNextRecommendation(progress: ProjectProgress): Recommendation {
    // STATE 4: ISO Wizard Completed (Maintenance Mode)
    if (progress.isoWizardCompleted) {
        return {
            key: 'MAINTENANCE',
            headline: "AI system successfully established",
            acknowledgement: "Congratulations! You have set up an ISO 42001 compliant management system.",
            primaryTitle: "Governance Control & Monitoring",
            primaryMeta: "Ongoing monitoring",
            primaryWhy: "Your system is active. Use Control now to review new use cases and maintain the compliance level.",
            primaryCtaLabel: "Go to Control",
            primaryHref: ROUTE_HREFS.control,
            secondary: [
                {
                    title: "Document new use case",
                    subtitle: "Update register and capture.",
                    href: ROUTE_HREFS.register
                },
                {
                    title: "Adjust strategy",
                    subtitle: "Governance control.",
                    href: ROUTE_HREFS.control
                }
            ]
        };
    }

    // STATE 0: Base Wizard Incomplete (Default)
    if (!progress.aiActBaseWizardCompleted) {
        return {
            key: 'AI_ACT_BASE',
            headline: progress.projectName
                ? `Recommended approach for ${progress.projectName} (EU AI Act)`
                : "Recommended approach (EU AI Act)",
            // Lead text handles "Based on..." in component, logic returns structure
            primaryTitle: "Document your first AI use case",
            primaryMeta: "under 5 minutes · foundation for evidence capability and liability limitation",
            primaryWhy: "Core prerequisite for evidence capability, liability limitation and future audit readiness.",
            primaryCtaLabel: "Go to Register",
            primaryHref: ROUTE_HREFS.register,
            secondary: []
        };
    }

    // STATE 1: Base Wizard Completed, Policies Not Generated
    if (progress.aiActBaseWizardCompleted && !progress.policiesGenerated) {
        return {
            key: 'COMPLIANCE_IN_A_DAY',
            headline: "Good progress \u2013 next meaningful consolidation",
            acknowledgement: "You have reviewed the AI Act base documentation. For the first time, there is clear documentation of where and how AI is used in your organisation.",
            primaryTitle: "Smart Policy Engine: Create guidelines & policies",
            primaryMeta: "approx. 10\u201320 minutes \u00b7 templates available \u00b7 immediately usable",
            primaryWhy: "At this stage it is more important that your AI usage is documented in writing than to build formal management structures. Guidelines and policies are the documents that are actually presented internally, externally and during audits.",
            primaryCtaLabel: "Start Smart Policy Engine",
            primaryHref: ROUTE_HREFS.controlPolicies,
            secondary: [
                {
                    title: "Governance Control",
                    subtitle: "For teams with structured reviews and organisational control.",
                    href: ROUTE_HREFS.control
                },
                {
                    title: "AI Portfolio & Strategy",
                    subtitle: "When multiple use cases exist or priorities are unclear.",
                    href: ROUTE_HREFS.control
                }
            ]
        };
    }

    // STATE 2: Policies Generated, ISO Not Started
    if (progress.policiesGenerated && !progress.isoWizardStarted) {
        return {
            key: 'ISO_WIZARD',
            headline: "Documentation in place \u2013 complement with governance",
            acknowledgement: "Your guidelines are now documented. The next logical step is to secure them organisationally.",
            primaryTitle: "Expand Governance Control",
            primaryMeta: "approx. 20\u201330 minutes \u00b7 clarify roles, responsibilities and processes",
            primaryWhy: "So that your policies are not just documented but supported: governance, responsibilities and regular risk analysis increase audit readiness and process reliability.",
            primaryCtaLabel: "Go to Control",
            primaryHref: ROUTE_HREFS.control,
            secondary: [
                {
                    title: "Export Centre",
                    subtitle: "All documents in one place.",
                    href: ROUTE_HREFS.controlExports
                },
                {
                    title: "AI Portfolio & Strategy",
                    subtitle: "Strategic alignment.",
                    href: ROUTE_HREFS.control
                }
            ]
        };
    }

    // STATE 3: ISO Wizard Started (Continue)
    // if (progress.isoWizardStarted) ... implied by previous checks failing
    return {
        key: 'ISO_WIZARD',
        headline: "Continue completing AI management",
        acknowledgement: "You have already started with AI management.",
        primaryTitle: "Continue expanding governance",
        primaryMeta: "approx. 20\u201330 minutes \u00b7 work through next requirements",
        primaryWhy: "At this stage, continuous completion has the greatest impact because it increases repeatability and audit readiness.",
        primaryCtaLabel: "Continue in Control",
        primaryHref: ROUTE_HREFS.control,
        secondary: [
            {
                title: "Export Centre",
                subtitle: "Review progress.",
                href: ROUTE_HREFS.controlExports
            }
        ]
    };
}
