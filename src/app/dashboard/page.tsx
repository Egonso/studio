import { Dashboard } from "@/components/dashboard";
import type { ComplianceItem } from "@/lib/types";

const complianceData: ComplianceItem[] = [
  {
    id: "data-governance",
    title: "Data Governance and Management",
    description: "Ensuring high-quality data is used for training, validation, and testing of AI systems.",
    status: "Compliant",
    details: "Robust data governance frameworks are in place. Data is versioned, and quality checks are automated.",
  },
  {
    id: "risk-management",
    title: "Risk Management System",
    description: "Establishing a continuous risk management system throughout the AI system's lifecycle.",
    status: "Compliant",
    details: "A comprehensive risk management system has been implemented and is regularly updated.",
  },
  {
    id: "technical-documentation",
    title: "Technical Documentation",
    description: "Maintaining up-to-date technical documentation for AI systems.",
    status: "At Risk",
    details: "Documentation exists but is not consistently updated with every model change. Needs a more rigorous update process.",
  },
  {
    id: "transparency",
    title: "Transparency and Provision of Information",
    description: "Ensuring AI systems are designed to be transparent, allowing users to understand and interact with them.",
    status: "Non-Compliant",
    details: "The current system does not provide clear information to users about its AI-driven decision-making process. Immediate action required.",
  },
  {
    id: "human-oversight",
    title: "Human Oversight",
    description: "Implementing measures for appropriate human oversight of AI systems.",
    status: "Compliant",
    details: "Designated personnel can intervene or halt the system at any time. Clear protocols for oversight are established.",
  },
  {
    id: "accuracy-robustness",
    title: "Accuracy, Robustness, and Cybersecurity",
    description: "Ensuring AI systems are accurate, resilient to errors, and secure against cyber threats.",
    status: "At Risk",
    details: "Accuracy metrics are met, but robustness testing against adversarial attacks is insufficient. Cybersecurity protocols need review.",
  },
];

export default function DashboardPage() {
  return (
    <main>
      <Dashboard complianceItems={complianceData} />
    </main>
  );
}
