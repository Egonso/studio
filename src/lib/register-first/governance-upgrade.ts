import { getFeatureUpgradeHref } from '@/lib/compliance-engine/capability/upgrade-paths';
import type { SubscriptionPlan } from '@/lib/register-first/types';

export interface GovernanceUpgradePrompt {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

interface GovernanceUpgradeContext {
  plan: SubscriptionPlan | null | undefined;
  totalUseCases: number;
  openReviews: number;
  externalInboxCount: number;
  publicCount: number;
  hasExtendedGovernanceConfig: boolean;
}

export function getGovernanceUpgradePrompt(
  context: GovernanceUpgradeContext,
): GovernanceUpgradePrompt | null {
  if ((context.plan ?? 'free') !== 'free') {
    return null;
  }

  if (context.externalInboxCount > 0 || context.openReviews >= 2) {
    return {
      title: 'Reviews werden jetzt strukturiert relevant',
      description:
        'Sobald externe Einreichungen oder mehrere offene Prüfungen zusammenkommen, hilft eine Action Queue mit Review-Workflow.',
      ctaLabel: 'Reviews entdecken',
      href: getFeatureUpgradeHref('reviewWorkflow'),
    };
  }

  if (context.publicCount > 0) {
    return {
      title: 'Öffentliche Nachweise brauchen Governance-Steuerung',
      description:
        'Sichtbare Nachweise und externe Trust-Signale lassen sich im Trust Portal kontrolliert bündeln.',
      ctaLabel: 'Trust Portal ansehen',
      href: getFeatureUpgradeHref('trustPortal'),
    };
  }

  if (context.totalUseCases >= 5) {
    return {
      title: 'Mehrere Use Cases profitieren von einer Policy-Basis',
      description:
        'Ab mehreren dokumentierten Systemen lohnt sich ein zentraler Policy Engine Einstieg statt einzelner Ad-hoc-Regeln.',
      ctaLabel: 'Policy Engine ansehen',
      href: getFeatureUpgradeHref('policyEngine'),
    };
  }

  if (context.totalUseCases >= 3 && !context.hasExtendedGovernanceConfig) {
    return {
      title: 'Governance-Einstellungen werden jetzt wirksam',
      description:
        'Sobald mehrere KI-Einsatzfälle laufen, helfen zentrale Rollen, Review-Zyklen und Incident-Regeln.',
      ctaLabel: 'Governance Settings ansehen',
      href: getFeatureUpgradeHref('extendedOrgSettings'),
    };
  }

  return null;
}
