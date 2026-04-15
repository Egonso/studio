'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { localizeHref } from '@/lib/i18n/localize-href';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import type { ControlActionRecommendation } from '@/lib/control/action-queue-engine';

interface ActionQueueProps {
  recommendations: ControlActionRecommendation[];
}

function getActionQueueCopy(locale: string) {
  if (locale === 'de') {
    return {
      title: 'Action Queue',
      description: 'Priorisierte Maßnahmen auf Basis der Registerdaten.',
      empty: 'Aktuell liegen keine priorisierten Maßnahmen vor.',
      useCase: 'Einsatzfall',
      priority: 'Priorität {priority}',
      riskImpact: 'Risiko/Impact',
      recommendedAction: 'Empfohlene Aktion',
      openUseCase: 'Einsatzfall öffnen',
    } as const;
  }

  return {
    title: 'Action Queue',
    description: 'Prioritised actions based on register data.',
    empty: 'There are currently no prioritised actions.',
    useCase: 'Use case',
    priority: 'Priority {priority}',
    riskImpact: 'Risk/impact',
    recommendedAction: 'Recommended action',
    openUseCase: 'Open use case',
  } as const;
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: ControlActionRecommendation;
}) {
  const locale = useLocale();
  const copy = useMemo(() => getActionQueueCopy(locale), [locale]);
  const workspaceScope = useWorkspaceScope();

  const deepLinkHref =
    recommendation.deepLink && recommendation.deepLinkLabel
      ? localizeHref(
          locale,
          appendWorkspaceScope(recommendation.deepLink, workspaceScope),
        )
      : null;
  const viewLinkHref = localizeHref(
    locale,
    appendWorkspaceScope(recommendation.viewLink, workspaceScope),
  );

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">{recommendation.problem}</p>
          <p className="text-xs text-muted-foreground">
            {copy.useCase}: {recommendation.useCaseLabel}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {copy.priority.replace('{priority}', String(recommendation.priority))}
        </p>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium">{copy.riskImpact}:</span>{' '}
          <span className="text-muted-foreground">{recommendation.impact}</span>
        </p>
        <p>
          <span className="font-medium">{copy.recommendedAction}:</span>{' '}
          <span className="text-muted-foreground">
            {recommendation.recommendedAction}
          </span>
        </p>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          {deepLinkHref && recommendation.deepLinkLabel ? (
            <Button asChild size="sm">
              <Link href={deepLinkHref}>
                {recommendation.deepLinkLabel}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={viewLinkHref}>
              {copy.openUseCase}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ActionQueue({ recommendations }: ActionQueueProps) {
  const locale = useLocale();
  const copy = useMemo(() => getActionQueueCopy(locale), [locale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {copy.empty}
          </div>
        ) : (
          recommendations.map((recommendation) => (
            <RecommendationItem
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
