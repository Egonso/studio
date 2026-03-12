'use server';

import type {
  AnalyzeDocumentInput,
  AnalyzeDocumentOutput,
  ChatbotActionInput,
  DetectAntiPatternsInput,
  DetectAntiPatternsOutput,
  GetComplianceChecklistInput,
  GetComplianceChecklistOutput,
  GetDesignAdviceInput,
  GetDesignAdviceOutput,
  GetImplementationGuideInput,
  GetImplementationGuideOutput,
  GetValueTensionAdviceInput,
  GetValueTensionAdviceOutput,
  ValueInfluenceAnalysisInput,
  ValueInfluenceAnalysisOutput,
} from '@/ai/shared-types';
import { captureException } from '@/lib/observability/error-tracking';

async function withActionLogging<T>(
  actionName: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    captureException(error, {
      boundary: 'server-action',
      component: actionName,
    });
    throw error;
  }
}

export async function getComplianceChecklistAction(
  input: GetComplianceChecklistInput,
): Promise<GetComplianceChecklistOutput> {
  return withActionLogging('getComplianceChecklistAction', async () => {
    const { getComplianceChecklist } =
      await import('@/ai/flows/get-compliance-checklist');
    return getComplianceChecklist({
      ...input,
      pillar: input.pillar ?? 'ai-act',
    });
  });
}

export async function analyzeDocumentAction(
  input: AnalyzeDocumentInput,
): Promise<AnalyzeDocumentOutput> {
  return withActionLogging('analyzeDocumentAction', async () => {
    const { analyzeDocument } = await import('@/ai/flows/document-analyzer');
    return analyzeDocument(input);
  });
}

export async function getImplementationGuideAction(
  input: GetImplementationGuideInput,
): Promise<GetImplementationGuideOutput> {
  return withActionLogging('getImplementationGuideAction', async () => {
    const { getImplementationGuide } =
      await import('@/ai/flows/get-implementation-guide');
    return getImplementationGuide(input);
  });
}

export async function getDesignAdviceAction(
  input: GetDesignAdviceInput,
): Promise<GetDesignAdviceOutput> {
  return withActionLogging('getDesignAdviceAction', async () => {
    const { getDesignAdvice } = await import('@/ai/flows/design-advisor');
    return getDesignAdvice(input);
  });
}

export async function detectAntiPatternsAction(
  input: DetectAntiPatternsInput,
): Promise<DetectAntiPatternsOutput> {
  return withActionLogging('detectAntiPatternsAction', async () => {
    const { detectAntiPatterns } =
      await import('@/ai/flows/anti-pattern-detector');
    return detectAntiPatterns(input);
  });
}

export async function getValueTensionAdviceAction(
  input: GetValueTensionAdviceInput,
): Promise<GetValueTensionAdviceOutput> {
  return withActionLogging('getValueTensionAdviceAction', async () => {
    const { getValueTensionAdvice } =
      await import('@/ai/flows/value-tension-advisor');
    return getValueTensionAdvice(input);
  });
}

export async function analyzeValueInfluenceAction(
  input: ValueInfluenceAnalysisInput,
): Promise<ValueInfluenceAnalysisOutput> {
  return withActionLogging('analyzeValueInfluenceAction', async () => {
    const { analyzeValueInfluence } =
      await import('@/ai/flows/value-influence-analyzer');
    return analyzeValueInfluence(input);
  });
}

/**
 * Server Action to call the chatbot flow.
 * Wraps the flow execution to ensure clean serialization for the client.
 */
export async function callChatbotAction(input: ChatbotActionInput) {
  try {
    const { siteChatbotFlow } = await import('@/ai/flows/site-chatbot');
    const result = await siteChatbotFlow(input);
    const text = typeof result === 'string' ? result : String(result ?? '');
    return { success: true, data: text };
  } catch (error) {
    captureException(error, {
      boundary: 'server-action',
      component: 'callChatbotAction',
    });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred in chatbot action',
    };
  }
}
