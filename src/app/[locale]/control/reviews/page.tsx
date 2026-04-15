'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { ActionQueue } from '@/components/control/action-queue';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { localizeHref } from '@/lib/i18n/localize-href';
import { buildControlActionQueue } from '@/lib/control/action-queue-engine';
import { calculateControlOverview } from '@/lib/control/maturity-calculator';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { registerService } from '@/lib/register-first/register-service';
import type { OrgSettings, UseCaseCard } from '@/lib/register-first/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ReviewSnapshot {
  useCases: UseCaseCard[];
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

function getReviewsPageCopy(locale: string) {
  if (locale === 'de') {
    return {
      title: 'Reviews / Action Queue',
      loadingFrameDescription:
        'Priorisierte Prüfungen, Fristen und Governance-Aufgaben.',
      loadingNextStep: 'Wir laden Review-Kontext und priorisierte Aufgaben.',
      loadingPanelTitle: 'Reviews werden geladen',
      loadingPanelDescription:
        'Action Queue, fällige Reviews und Governance-Fristen werden vorbereitet.',
      frameDescriptionWithOrg:
        'Priorisierte Review-Arbeit für {organisation}.',
      frameDescription:
        'Priorisierte Review-Arbeit, Action Queue und Governance-Fristen.',
      nextStepWithItems:
        'Arbeiten Sie zuerst überfällige oder hochriskante Review-Themen ab.',
      nextStepEmpty:
        'Die Action Queue ist leer. Prüfen Sie Policies, Trust Portal oder Academy als nächsten Governance-Schritt.',
      disabledTitle: 'Control ist noch nicht freigeschaltet',
      disabledDescription:
        'Die bezahlte Governance-Ebene ist in diesem Workspace noch nicht aktiviert.',
      openRegister: 'Register öffnen',
      gatedTitle: 'Reviews gehören zur Governance-Stufe',
      gatedDescription:
        'Formale Review-Workflows und die Action Queue bleiben für bezahlte Governance-Workspaces reserviert.',
      openOverview: 'Overview öffnen',
      upgradeOptions: 'Upgrade-Optionen',
      dataLoadingTitle: 'Review-Daten werden geladen',
      dataLoadingDescription:
        'Action Queue und Review-Kennzahlen werden aus dem Register abgeleitet.',
      dataErrorTitle: 'Reviews konnten nicht geladen werden',
      actionQueue: 'Action Queue',
      reviewsDue: 'Reviews fällig',
      reviewsOverdue: 'Reviews überfällig',
      systemsWithoutOwner: 'Systeme ohne Owner',
      loadDataError:
        'Review-Daten konnten nicht geladen werden. Bitte öffnen Sie zuerst ein Register und versuchen Sie es erneut.',
    } as const;
  }

  return {
    title: 'Reviews / Action Queue',
    loadingFrameDescription:
      'Prioritised reviews, deadlines and governance actions.',
    loadingNextStep: 'We are loading review context and prioritised actions.',
    loadingPanelTitle: 'Loading reviews',
    loadingPanelDescription:
      'Action queue, due reviews and governance deadlines are being prepared.',
    frameDescriptionWithOrg:
      'Prioritised review work for {organisation}.',
    frameDescription:
      'Prioritised review work, action queue and governance deadlines.',
    nextStepWithItems:
      'Work through overdue or high-risk review items first.',
    nextStepEmpty:
      'The action queue is empty. Review policies, trust portal or academy as the next governance step.',
    disabledTitle: 'Control is not enabled yet',
    disabledDescription:
      'The paid governance layer is not activated in this workspace yet.',
    openRegister: 'Open register',
    gatedTitle: 'Reviews belong to the governance tier',
    gatedDescription:
      'Formal review workflows and the action queue remain reserved for paid governance workspaces.',
    openOverview: 'Open overview',
    upgradeOptions: 'Upgrade options',
    dataLoadingTitle: 'Loading review data',
    dataLoadingDescription:
      'Action queue and review metrics are derived from the register.',
    dataErrorTitle: 'Reviews could not be loaded',
    actionQueue: 'Action Queue',
    reviewsDue: 'Reviews due',
    reviewsOverdue: 'Reviews overdue',
    systemsWithoutOwner: 'Systems without owner',
    loadDataError:
      'Review data could not be loaded. Please open a register first and try again.',
  } as const;
}

export default function ControlReviewsPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const copy = useMemo(() => getReviewsPageCopy(locale), [locale]);
  const router = useRouter();
  const {
    allowed: reviewAllowed,
    loading: capabilityLoading,
  } = useCapability('reviewWorkflow');

  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const loadReviewSnapshot = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const [useCases, registers] = await Promise.all([
        registerService.listUseCases(undefined, { includeDeleted: false }),
        registerService.listRegisters().catch(() => []),
      ]);

      const register = registers[0] ?? null;
      setSnapshot({
        useCases,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to load control reviews', error);
      setDataError(copy.loadDataError);
    } finally {
      setIsDataLoading(false);
    }
  }, [copy.loadDataError]);

  useEffect(() => {
    if (
      !loading &&
      !capabilityLoading &&
      user &&
      registerFirstFlags.controlShell &&
      reviewAllowed
    ) {
      void loadReviewSnapshot();
    }
  }, [capabilityLoading, loadReviewSnapshot, loading, reviewAllowed, user]);

  const overview = useMemo(() => {
    if (!snapshot) return null;
    return calculateControlOverview(
      snapshot.useCases,
      snapshot.orgSettings,
      snapshot.capturedAt,
      locale,
    );
  }, [locale, snapshot]);

  const actionQueue = useMemo(() => {
    if (!snapshot) return [];
    return buildControlActionQueue(snapshot.useCases, snapshot.capturedAt);
  }, [snapshot]);

  const registerHref = localizeHref(locale, ROUTE_HREFS.register);
  const controlHref = localizeHref(locale, ROUTE_HREFS.control);
  const governanceUpgradeHref = localizeHref(locale, ROUTE_HREFS.governanceUpgrade);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={copy.title}
        description={copy.loadingFrameDescription}
        nextStep={copy.loadingNextStep}
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title={copy.loadingPanelTitle}
          description={copy.loadingPanelDescription}
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title={copy.title}
      description={
        snapshot?.organisationName
          ? copy.frameDescriptionWithOrg.replace(
              '{organisation}',
              snapshot.organisationName,
            )
          : copy.frameDescription
      }
      nextStep={
        actionQueue.length > 0
          ? copy.nextStepWithItems
          : copy.nextStepEmpty
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title={copy.disabledTitle}
            description={copy.disabledDescription}
            actions={
              <Button asChild>
                <Link href={registerHref}>{copy.openRegister}</Link>
              </Button>
            }
          />
        ) : !reviewAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title={copy.gatedTitle}
            description={copy.gatedDescription}
            actions={
              <>
                <Button asChild>
                  <Link href={controlHref}>{copy.openOverview}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={governanceUpgradeHref}>{copy.upgradeOptions}</Link>
                </Button>
              </>
            }
          />
        ) : (
          <>
            {isDataLoading && !snapshot && (
              <PageStatePanel
                tone="loading"
                area="paid_governance_control"
                title={copy.dataLoadingTitle}
                description={copy.dataLoadingDescription}
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title={copy.dataErrorTitle}
                description={dataError}
              />
            )}

            {overview && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.actionQueue}</CardDescription>
                      <CardTitle className="text-3xl">
                        {actionQueue.length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.reviewsDue}</CardDescription>
                      <CardTitle className="text-3xl">
                        {overview.kpis.reviewsDue}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.reviewsOverdue}</CardDescription>
                      <CardTitle className="text-3xl">
                        {overview.kpis.reviewsOverdue}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.systemsWithoutOwner}</CardDescription>
                      <CardTitle className="text-3xl">
                        {overview.kpis.systemsWithoutOwner}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <ActionQueue recommendations={actionQueue} />
              </>
            )}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
