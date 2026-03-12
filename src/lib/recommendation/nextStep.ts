
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
            headline: "KI-System erfolgreich etabliert",
            acknowledgement: "Gratulation! Sie haben ein ISO 42001 konformes Management-System aufgesetzt.",
            primaryTitle: "Governance Control & Monitoring",
            primaryMeta: "Laufende Überwachung",
            primaryWhy: "Ihr System ist aktiv. Nutzen Sie jetzt Control, um neue Use Cases zu prüfen und das Compliance-Level zu halten.",
            primaryCtaLabel: "Zu Control",
            primaryHref: ROUTE_HREFS.control,
            secondary: [
                {
                    title: "Neuen Use Case dokumentieren",
                    subtitle: "Register und Erfassung aktualisieren.",
                    href: ROUTE_HREFS.register
                },
                {
                    title: "Strategie anpassen",
                    subtitle: "Governance-Steuerung.",
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
                ? `Empfohlene Vorgehensweise für ${progress.projectName} (EU AI Act)`
                : "Empfohlene Vorgehensweise (EU AI Act)",
            // Lead text handles "Basierend auf..." in component, logic returns structure
            primaryTitle: "Ersten KI-Einsatzfall dokumentieren",
            primaryMeta: "unter 5 Minuten · Grundlage für Nachweisfähigkeit und Haftungsbegrenzung",
            primaryWhy: "Kernvoraussetzung für Nachweisfähigkeit, Haftungsbegrenzung und spätere Audit-Sicherheit.",
            primaryCtaLabel: "Zum Register",
            primaryHref: ROUTE_HREFS.register,
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
            primaryHref: ROUTE_HREFS.controlPolicies,
            secondary: [
                {
                    title: "Governance Control",
                    subtitle: "Für Teams mit strukturierten Reviews und Organisationssteuerung.",
                    href: ROUTE_HREFS.control
                },
                {
                    title: "KI-Portfolio & Strategie",
                    subtitle: "Wenn mehrere Use Cases bestehen oder Prioritäten unklar sind.",
                    href: ROUTE_HREFS.control
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
            primaryTitle: "Governance Control ausbauen",
            primaryMeta: "ca. 20–30 Minuten · Rollen, Verantwortlichkeiten und Prozesse klären",
            primaryWhy: "Damit Ihre Policies nicht nur existieren, sondern getragen werden: Governance, Verantwortlichkeiten und regelmäßige Risikoanalyse erhöhen Auditfähigkeit und Prozesssicherheit.",
            primaryCtaLabel: "Zu Control",
            primaryHref: ROUTE_HREFS.control,
            secondary: [
                {
                    title: "Export-Center",
                    subtitle: "Alle Dokumente an einem Ort.",
                    href: ROUTE_HREFS.controlExports
                },
                {
                    title: "KI-Portfolio & Strategie",
                    subtitle: "Strategische Ausrichtung.",
                    href: ROUTE_HREFS.control
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
        primaryTitle: "Governance weiter ausbauen",
        primaryMeta: "ca. 20–30 Minuten · nächste Anforderungen bearbeiten",
        primaryWhy: "In dieser Phase bringt kontinuierliche Vervollständigung die größte Wirkung, weil sie Wiederholbarkeit und Auditfähigkeit erhöht.",
        primaryCtaLabel: "Weiter in Control",
        primaryHref: ROUTE_HREFS.control,
        secondary: [
            {
                title: "Export-Center",
                subtitle: "Fortschritt prüfen.",
                href: ROUTE_HREFS.controlExports
            }
        ]
    };
}
