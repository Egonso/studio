
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
            headline: "KI-System erfolgreich etabliert",
            acknowledgement: "Gratulation! Sie haben ein ISO 42001 konformes Management-System aufgesetzt.",
            primaryTitle: "Audit-Dossier & Monitoring",
            primaryMeta: "Laufende Überwachung",
            primaryWhy: "Ihr System ist aktiv. Nutzen Sie jetzt das Dashboard, um neue Tools zu prüfen und das Compliance-Level zu halten.",
            primaryCtaLabel: "Zum Dashboard",
            primaryHref: "/ai-management", // Redirects to dashboard view since completed
            secondary: [
                {
                    title: "Neues KI-Projekt prüfen",
                    subtitle: "High-Risk Klassifizierung.",
                    href: "/assessment"
                },
                {
                    title: "Strategie anpassen",
                    subtitle: "Portfolio-Management.",
                    href: "/portfolio"
                }
            ]
        };
    }

    // STATE 0: Base Wizard Incomplete (Default)
    if (!progress.aiActBaseWizardCompleted) {
        return {
            key: 'AI_ACT_BASE',
            headline: progress.projectName
                ? `Empfohlene Vorgehensweise für ${progress.projectName} (EU AI Act)`
                : "Empfohlene Vorgehensweise (EU AI Act)",
            // Lead text handles "Basierend auf..." in component, logic returns structure
            primaryTitle: "AI-Act-Basisdokumentation überprüfen",
            primaryMeta: "unter 5 Minuten · Grundlage für Nachweisfähigkeit und Haftungsbegrenzung",
            primaryWhy: "Kernvoraussetzung für Nachweisfähigkeit, Haftungsbegrenzung und spätere Audit-Sicherheit.",
            primaryCtaLabel: "Basisdokumentation starten",
            primaryHref: "/assessment",
            secondary: []
        };
    }

    // STATE 1: Base Wizard Completed, Policies Not Generated
    if (progress.aiActBaseWizardCompleted && !progress.policiesGenerated) {
        return {
            key: 'COMPLIANCE_IN_A_DAY',
            headline: "Guter Fortschritt – nächste sinnvolle Verdichtung",
            acknowledgement: "Sie haben die AI-Act-Basisdokumentation überprüft. Damit ist erstmals klar dokumentiert, wo und wie KI in Ihrem Unternehmen eingesetzt wird.",
            primaryTitle: "Smart Policy Engine: Richtlinien & Policies erstellen",
            primaryMeta: "ca. 10–20 Minuten · Vorlagen vorhanden · sofort verwendbar",
            primaryWhy: "In dieser Phase ist es wichtiger, dass Ihre KI-Nutzung schriftlich greifbar ist, als bereits formale Managementstrukturen aufzubauen. Richtlinien und Policies sind die Dokumente, die intern, extern und bei Prüfungen tatsächlich vorgelegt werden.",
            primaryCtaLabel: "Smart Policy Engine starten",
            primaryHref: "/cbs",
            secondary: [
                {
                    title: "KI-Management & Governance (ISO 42001)",
                    subtitle: "Für Unternehmen, die KI langfristig systematisch steuern wollen (wenn Richtlinien bereits existieren).",
                    href: "/ai-management"
                },
                {
                    title: "KI-Portfolio & Strategie",
                    subtitle: "Wenn mehrere Use Cases bestehen oder Prioritäten unklar sind.",
                    href: "/portfolio" // Assuming existing path
                }
            ]
        };
    }

    // STATE 2: Policies Generated, ISO Not Started
    if (progress.policiesGenerated && !progress.isoWizardStarted) {
        return {
            key: 'ISO_WIZARD',
            headline: "Dokumentation vorhanden – Governance sinnvoll ergänzen",
            acknowledgement: "Ihre Richtlinien sind nun dokumentiert. Der nächste sinnvolle Schritt ist, diese organisatorisch abzusichern.",
            primaryTitle: "KI-Management-System aufsetzen (ISO 42001)",
            primaryMeta: "ca. 20–30 Minuten · Rollen, Verantwortlichkeiten und Prozesse klären",
            primaryWhy: "Damit Ihre Policies nicht nur existieren, sondern getragen werden: Governance, Verantwortlichkeiten und regelmäßige Risikoanalyse erhöhen Auditfähigkeit und Prozesssicherheit.",
            primaryCtaLabel: "ISO-Wizard starten",
            primaryHref: "/ai-management",
            secondary: [
                {
                    title: "Audit-Dossier",
                    subtitle: "Alle Dokumente an einem Ort.",
                    href: "/audit-report" // Assuming existing path
                },
                {
                    title: "KI-Portfolio & Strategie",
                    subtitle: "Strategische Ausrichtung.",
                    href: "/portfolio"
                }
            ]
        };
    }

    // STATE 3: ISO Wizard Started (Continue)
    // if (progress.isoWizardStarted) ... implied by previous checks failing
    return {
        key: 'ISO_WIZARD',
        headline: "KI-Management weiter vervollständigen",
        acknowledgement: "Sie haben bereits mit dem KI-Management begonnen.",
        primaryTitle: "ISO-Governance weiter ausbauen",
        primaryMeta: "ca. 20–30 Minuten · nächste Anforderungen bearbeiten",
        primaryWhy: "In dieser Phase bringt kontinuierliche Vervollständigung die größte Wirkung, weil sie Wiederholbarkeit und Auditfähigkeit erhöht.",
        primaryCtaLabel: "Weiter im ISO-Wizard",
        primaryHref: "/ai-management",
        secondary: [
            {
                title: "Audit-Dossier",
                subtitle: "Fortschritt prüfen.",
                href: "/audit-report"
            }
        ]
    };
}
