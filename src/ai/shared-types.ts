import type { DesignPhase, Principle } from '@/lib/design-thinking-data';

export type ChecklistPillar = 'ai-act' | 'iso-42001' | 'portfolio';

export interface ComplianceChecklistItem {
  id: string;
  description: string;
}

export interface GetComplianceChecklistInput {
  topic: string;
  currentStatus: string;
  details: string;
  pillar?: ChecklistPillar;
}

export interface GetComplianceChecklistOutput {
  checklist: ComplianceChecklistItem[];
}

export interface AnalyzeDocumentInput {
  documentText: string;
  complianceTopic: string;
  taskDescription: string;
}

export interface AnalyzeDocumentOutput {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  isFulfilled: boolean;
}

export interface ImplementationGuideSection {
  title: string;
  steps: string[];
}

export interface GetImplementationGuideInput {
  taskDescription: string;
  pillar?: ChecklistPillar;
  companyDescription?: string;
  riskProfile?: string;
  existingAuditData?: string;
}

export interface GetImplementationGuideOutput {
  guide: ImplementationGuideSection[];
}

export interface GetDesignAdviceInput {
  projectContext: string;
  phase: DesignPhase;
  principle: Principle;
}

export interface DesignAdviceSection {
  title: string;
  content: string[];
}

export interface GetDesignAdviceOutput {
  sections: DesignAdviceSection[];
}

export interface DetectAntiPatternsInput {
  description: string;
}

export interface DetectAntiPatternsOutput {
  detectedPatterns: Array<{
    patternName: string;
    explanation: string;
    suggestion: string;
  }>;
}

export interface GetValueTensionAdviceInput {
  projectContext: string;
  principleA: Principle;
  principleB: Principle;
}

export interface GetValueTensionAdviceOutput {
  synergyProposal: string;
  impulseQuestions: string[];
}

export interface ValueInfluenceStakeholder {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'societal';
  concerns: string;
}

export interface ValueInfluenceAnalysisInput {
  projectContext: string;
  stakeholders: ValueInfluenceStakeholder[];
}

export interface ValueInfluenceAnalysisOutput {
  results: Array<{
    stakeholderId: string;
    stakeholderName: string;
    analysis: Array<{
      principleId: string;
      priority: 'High' | 'Medium' | 'Low' | 'None';
      rationale: string;
    }>;
  }>;
}

export interface ChatbotActionMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface ChatbotActionInput {
  messages: ChatbotActionMessage[];
  currentPath?: string;
}
