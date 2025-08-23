
import type { ComplianceItem } from "@/lib/types";

export function getInitialComplianceData(): ComplianceItem[] {
    return [
    {
      id: "data-governance",
      title: "Daten-Governance und -Management",
      description: "Sicherstellung der Verwendung hochwertiger Daten für Training, Validierung und Tests von KI-Systemen.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
    {
      id: "risk-management",
      title: "Risikomanagementsystem",
      description: "Einrichtung eines kontinuierlichen Risikomanagementsystems während des gesamten Lebenszyklus des KI-Systems.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
    {
      id: "technical-documentation",
      title: "Technische Dokumentation",
      description: "Pflege einer aktuellen technischen Dokumentation für KI-Systeme.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
    {
      id: "transparency",
      title: "Transparenz und Informationsbereitstellung",
      description: "Sicherstellung, dass KI-Systeme transparent gestaltet sind, damit Benutzer sie verstehen und mit ihnen interagieren können.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
    {
      id: "human-oversight",
      title: "Menschliche Aufsicht",
      description: "Umsetzung von Maßnahmen für eine angemessene menschliche Aufsicht über KI-Systeme.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
    {
      id: "accuracy-robustness",
      title: "Genauigkeit, Robustheit und Cybersicherheit",
      description: "Sicherstellung, dass KI-Systeme genau, widerstandsfähig gegen Fehler und sicher gegen Cyber-Bedrohungen sind.",
      status: "Compliant",
      details: "Noch keine Bewertung vorhanden. Führen Sie die Bewertung durch.",
    },
  ];
}

export function deriveComplianceState(answers: Record<string, string>): ComplianceItem[] {
    const initialData = getInitialComplianceData();
    const isForbidden = answers.q2 === 'yes_forbidden';
    if (isForbidden) {
        return initialData.map(item => ({
            ...item,
            status: 'Non-Compliant',
            details: 'Kritisch: Ihr System scheint verbotene Praktiken nach Art. 5 anzuwenden. Der Betrieb muss sofort eingestellt und rechtlicher Rat eingeholt werden.'
        }));
    }

    const isHighRisk = Object.values(answers).includes("yes_high_risk");

    return initialData.map(item => {
        // If it's a high-risk system, most requirements become critical
        if (isHighRisk) {
            switch(item.id) {
                case 'risk-management':
                case 'technical-documentation':
                case 'human-oversight':
                case 'accuracy-robustness':
                    return { ...item, status: 'Non-Compliant', details: 'Hochrisiko-System identifiziert. Sofortiger Handlungsbedarf in diesem Bereich.' };
                case 'data-governance':
                case 'transparency':
                     return { ...item, status: 'At Risk', details: 'Hochrisiko-System identifiziert. Überprüfung in diesem Bereich erforderlich.' };
                default:
                    return item;
            }
        }
        
        // Basic logic: if AI is not used, everything is compliant.
        if (answers.q1 === 'no') {
            return { ...item, status: 'Compliant', details: 'Ihr Unternehmen scheint laut Ihrer Angabe keine KI-Systeme einzusetzen.' };
        }
        
        // Default to 'At Risk' if AI is used but not determined to be high-risk yet.
        // This encourages the user to review all points.
        if(answers.q1 === 'yes' || answers.q1 === 'unsure') {
             return { ...item, status: 'At Risk', details: 'Die Nutzung von KI wurde bestätigt. Jeder Bereich muss auf Konformität geprüft werden.' };
        }

        return item;
    });
}

