import { AppHeader } from "@/components/app-header";
import { Dashboard } from "@/components/dashboard";
import type { ComplianceItem } from "@/lib/types";

const complianceData: ComplianceItem[] = [
  {
    id: "data-governance",
    title: "Daten-Governance und -Management",
    description: "Sicherstellung der Verwendung hochwertiger Daten für Training, Validierung und Tests von KI-Systemen.",
    status: "Compliant",
    details: "Robuste Data-Governance-Frameworks sind vorhanden. Daten werden versioniert und Qualitätsprüfungen sind automatisiert.",
  },
  {
    id: "risk-management",
    title: "Risikomanagementsystem",
    description: "Einrichtung eines kontinuierlichen Risikomanagementsystems während des gesamten Lebenszyklus des KI-Systems.",
    status: "Compliant",
    details: "Ein umfassendes Risikomanagementsystem wurde implementiert und wird regelmäßig aktualisiert.",
  },
  {
    id: "technical-documentation",
    title: "Technische Dokumentation",
    description: "Pflege einer aktuellen technischen Dokumentation für KI-Systeme.",
    status: "At Risk",
    details: "Dokumentation existiert, wird aber nicht bei jeder Modelländerung konsistent aktualisiert. Benötigt einen strengeren Aktualisierungsprozess.",
  },
  {
    id: "transparency",
    title: "Transparenz und Informationsbereitstellung",
    description: "Sicherstellung, dass KI-Systeme transparent gestaltet sind, damit Benutzer sie verstehen und mit ihnen interagieren können.",
    status: "Non-Compliant",
    details: "Das aktuelle System bietet den Nutzern keine klaren Informationen über seinen KI-gesteuerten Entscheidungsprozess. Sofortiger Handlungsbedarf.",
  },
  {
    id: "human-oversight",
    title: "Menschliche Aufsicht",
    description: "Umsetzung von Maßnahmen für eine angemessene menschliche Aufsicht über KI-Systeme.",
    status: "Compliant",
    details: "Benanntes Personal kann jederzeit eingreifen oder das System anhalten. Klare Aufsichtsprotokolle sind etabliert.",
  },
  {
    id: "accuracy-robustness",
    title: "Genauigkeit, Robustheit und Cybersicherheit",
    description: "Sicherstellung, dass KI-Systeme genau, widerstandsfähig gegen Fehler und sicher gegen Cyber-Bedrohungen sind.",
    status: "At Risk",
    details: "Genauigkeitsmetriken werden erfüllt, aber die Robustheitsprüfung gegen gegnerische Angriffe ist unzureichend. Überprüfung der Cybersicherheitsprotokolle erforderlich.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <AppHeader />
      <main className="flex-1">
        <Dashboard complianceItems={complianceData} />
      </main>
    </div>
  );
}
