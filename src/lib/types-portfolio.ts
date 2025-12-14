
export interface AIProject {
  id: string;
  title: string;
  businessOwner: string;
  department: string;
  status: 'idea' | 'poc' | 'pilot' | 'rollout' | 'live';
  description: string;
  aiActRiskClass?: string;
  isoStatus?: string;
  createdAt: any; // Firestore timestamp
}

export interface AIProjectAssessment {
  projectId: string;
  businessValue: number; // 1-5
  implementationEffort: number; // 1-5
  governanceRisk: number; // 1-5
  updatedAt: any;
}

export interface AIProjectDecisionLog {
  id: string;
  projectId: string;
  type: 'start' | 'continue' | 'stop' | 'build' | 'buy' | 'fine-tune';
  justification: string;
  aiActReference?: string[];
  isoReference?: string[];
  supervisor: string;
  approvedBy: string;
  date: any;
}

export interface PortfolioMetrics {
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByRisk: Record<string, number>;
}
