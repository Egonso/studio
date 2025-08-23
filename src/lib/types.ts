export type ComplianceStatus = 'Compliant' | 'At Risk' | 'Non-Compliant';

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  details: string;
}
