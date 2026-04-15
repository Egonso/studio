'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createAiToolsRegistryService,
  getDataCategoryLabel,
  resolveUseCaseWorkflowDisplay,
  type UseCaseCard,
} from '@/lib/register-first';
import { RegisterStatusBadge } from './status-badge';

const aiRegistry = createAiToolsRegistryService();

interface UseCasePassCardProps {
  card: UseCaseCard;
  resolvedToolName?: string | null;
}

const dataCategoryColors: Record<string, string> = {
  NONE: '',
  INTERNAL: '',
  PERSONAL: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80',
  SENSITIVE: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80',
};

function getUseCasePassCopy(locale: string) {
  if (locale === 'de') {
    return {
      emptySystem: 'Kein System',
      capturedBySelf: 'Erfasser (selbst)',
      notProvided: 'Nicht angegeben',
      publicVisible: 'Öffentlich',
      workflowSystems: 'Ablauf & Systeme',
      system: 'System',
      connectionMode: 'Ablaufart',
      summary: 'Kurzbeschreibung',
      context: 'Wirkungsbereich',
      ownerRole: 'Owner-Rolle',
      decisionImpact: 'Entscheidungsrelevanz',
      publicHash: 'Öffentlicher Hash',
      created: 'Erstellt',
      decisionYes: 'Ja',
      decisionNo: 'Nein',
      decisionUnknown: 'Unsicher',
    } as const;
  }

  return {
    emptySystem: 'No system',
    capturedBySelf: 'Captured by self',
    notProvided: 'Not provided',
    publicVisible: 'Public',
    workflowSystems: 'Flow & systems',
    system: 'System',
    connectionMode: 'Connection mode',
    summary: 'Summary',
    context: 'Context',
    ownerRole: 'Owner role',
    decisionImpact: 'Decision impact',
    publicHash: 'Public hash',
    created: 'Created',
    decisionYes: 'Yes',
    decisionNo: 'No',
    decisionUnknown: 'Unclear',
  } as const;
}

function formatDate(value: string, locale: string): string {
  return new Date(value).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB');
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

export function UseCasePassCard({
  card,
  resolvedToolName,
}: UseCasePassCardProps) {
  const locale = useLocale();
  const copy = useMemo(() => getUseCasePassCopy(locale), [locale]);
  const isV11 = card.cardVersion === '1.1';
  const workflow = resolveUseCaseWorkflowDisplay(card, {
    resolveToolName: (toolId) =>
      (toolId === card.toolId ? resolvedToolName : null) ??
      aiRegistry.getById(toolId)?.productName ??
      null,
    emptyLabel: copy.emptySystem,
  });
  const systemsDisplay = workflow.systems
    .map((system) => `${system.position}. ${system.displayName}`)
    .join(' -> ');

  const responsibleDisplay = card.responsibility.isCurrentlyResponsible
    ? copy.capturedBySelf
    : card.responsibility.responsibleParty ?? copy.notProvided;

  const contextDisplay = card.usageContexts.join(', ');

  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base leading-tight">{card.purpose}</CardTitle>
            {isV11 && card.globalUseCaseId ? (
              <CardDescription className="font-mono text-xs">
                {card.globalUseCaseId}
              </CardDescription>
            ) : null}
          </div>
          <RegisterStatusBadge status={card.status} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            v{card.cardVersion}
          </Badge>
          {isV11 && card.dataCategory ? (
            <Badge
              variant="outline"
              className={dataCategoryColors[card.dataCategory] ?? ''}
            >
              {getDataCategoryLabel(card.dataCategory, locale) ?? card.dataCategory}
            </Badge>
          ) : null}
          {isV11 && card.isPublicVisible ? (
            <Badge variant="secondary" className="text-xs">
              {copy.publicVisible}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="divide-y text-sm">
        {isV11 && workflow.systems.length > 0 ? (
          <InfoRow
            label={workflow.hasMultipleSystems ? copy.workflowSystems : copy.system}
            value={systemsDisplay}
          />
        ) : null}
        {isV11 && workflow.connectionModeLabel ? (
          <InfoRow label={copy.connectionMode} value={workflow.connectionModeLabel} />
        ) : null}
        {isV11 && workflow.summary ? (
          <InfoRow label={copy.summary} value={workflow.summary} />
        ) : null}
        <InfoRow label={copy.context} value={contextDisplay} />
        <InfoRow label={copy.ownerRole} value={responsibleDisplay} />
        {card.decisionImpact ? (
          <InfoRow
            label={copy.decisionImpact}
            value={
              card.decisionImpact === 'YES'
                ? copy.decisionYes
                : card.decisionImpact === 'NO'
                  ? copy.decisionNo
                  : copy.decisionUnknown
            }
          />
        ) : null}
        {isV11 && card.publicHashId ? (
          <InfoRow label={copy.publicHash} value={card.publicHashId} />
        ) : null}
        <InfoRow label={copy.created} value={formatDate(card.createdAt, locale)} />
      </CardContent>
    </Card>
  );
}
