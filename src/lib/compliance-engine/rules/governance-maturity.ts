import { EngineContext, ActionItem } from '../types';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';

/**
 * Calculates the Governance Maturity Index (0-100)
 * 100 = Fully mature, all policies and governance structures in place.
 * 0 = Immature, no processes, no policies.
 */
export function evaluateGovernanceMaturity(context: EngineContext): {
  index: number;
  actions: ActionItem[];
} {
  let maturityScore = 100; // Start at perfect, deduct points for missing
  const actions: ActionItem[] = [];

  // 1. Global AI Policy (PE-5: 3-tier scoring based on policyStatus)
  if (
    context.orgStatus.policyStatus === 'draft' ||
    context.orgStatus.policyStatus === 'review'
  ) {
    maturityScore -= 20;
    actions.push({
      id: 'policy_draft_org',
      type: 'policy_missing',
      title: 'AI policy is still in draft',
      description:
        'Your policy has not yet been approved. Employees therefore do not yet have a binding set of instructions.',
      impactIncreaseEstimate: 20,
      severity: 'medium',
      href: ROUTE_HREFS.controlPolicies,
    });
  } else if (
    context.orgStatus.policyStatus !== 'approved' &&
    !context.orgStatus.hasPolicy
  ) {
    // Missing entirely
    maturityScore -= 40;
    actions.push({
      id: 'policy_missing_org',
      type: 'policy_missing',
      title: 'Missing AI policy',
      description:
        'Without a central policy your employees lack clear guidance on the use of AI.',
      impactIncreaseEstimate: 40,
      severity: 'high',
      href: ROUTE_HREFS.controlPolicies,
    });
  }

  // 2. Incident Process
  if (!context.orgStatus.hasIncidentProcess) {
    maturityScore -= 30;
    actions.push({
      id: 'incident_process_missing_org',
      type: 'incident_process_missing',
      title: 'No AI incident process defined',
      description:
        'You must define who in the organisation decides in case of an AI malfunction (fundamental rights violation).',
      impactIncreaseEstimate: 30,
      severity: 'medium',
      href: ROUTE_HREFS.governanceSettings,
    });
  }

  // 3. RACI (Roles) not defined
  if (!context.orgStatus.hasRaciDefined) {
    maturityScore -= 30;
    actions.push({
      id: 'raci_missing_org',
      type: 'raci_missing',
      title: 'AI roles & responsibilities missing',
      description:
        'Assign clear roles (e.g. AI Officer, Legal) for the approval and oversight of AI systems.',
      impactIncreaseEstimate: 30,
      severity: 'medium',
      href: ROUTE_HREFS.governanceSettings,
    });
  }

  // 4. Zero Use Cases (Unmature Registry)
  if (context.useCases.length === 0) {
    maturityScore -= 20; // Additional penalty if registry is entirely empty
    actions.push({
      id: 'use_cases_empty',
      type: 'first_use_case_missing',
      title: 'Register is empty',
      description:
        'A governance strategy without recorded systems (shadow IT) is ineffective. Capture your first AI tool.',
      impactIncreaseEstimate: 20,
      severity: 'high',
      href: '/my-register',
    });
  }

  // Clamp score
  return {
    index: Math.max(0, maturityScore),
    actions,
  };
}
