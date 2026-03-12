'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ActionQueue } from '@/components/control/action-queue';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
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

export default function ControlReviewsPage() {
  const { user, loading } = useAuth();
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
      setDataError(
        'Review-Daten konnten nicht geladen werden. Bitte öffnen Sie zuerst ein Register und versuchen Sie es erneut.',
      );
    } finally {
      setIsDataLoading(false);
    }
  }, []);

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
    );
  }, [snapshot]);

  const actionQueue = useMemo(() => {
    if (!snapshot) return [];
    return buildControlActionQueue(snapshot.useCases, snapshot.capturedAt);
  }, [snapshot]);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Reviews / Action Queue"
        description="Priorisierte Prüfungen, Fristen und Governance-Aufgaben."
        nextStep="Wir laden Review-Kontext und priorisierte Aufgaben."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Reviews werden geladen"
          description="Action Queue, fällige Reviews und Governance-Fristen werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Reviews / Action Queue"
      description={
        snapshot?.organisationName
          ? `Priorisierte Review-Arbeit für ${snapshot.organisationName}.`
          : 'Priorisierte Review-Arbeit, Action Queue und Governance-Fristen.'
      }
      nextStep={
        actionQueue.length > 0
          ? 'Arbeiten Sie zuerst überfällige oder hochriskante Review-Themen ab.'
          : 'Die Action Queue ist leer. Prüfen Sie Policies, Trust Portal oder Academy als nächsten Governance-Schritt.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Control ist noch nicht freigeschaltet"
            description="Die bezahlte Governance-Ebene ist in diesem Workspace noch nicht aktiviert."
            actions={
              <Button asChild>
                <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
              </Button>
            }
          />
        ) : !reviewAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Reviews gehören zur Governance-Stufe"
            description="Formale Review-Workflows und die Action Queue bleiben für bezahlte Governance-Workspaces reserviert."
            actions={
              <>
                <Button asChild>
                  <Link href={ROUTE_HREFS.control}>Overview öffnen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.governanceSettings}>
                    Governance Settings
                  </Link>
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
                title="Review-Daten werden geladen"
                description="Action Queue und Review-Kennzahlen werden aus dem Register abgeleitet."
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title="Reviews konnten nicht geladen werden"
                description={dataError}
              />
            )}

            {overview && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Action Queue</CardDescription>
                      <CardTitle className="text-3xl">
                        {actionQueue.length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Reviews fällig</CardDescription>
                      <CardTitle className="text-3xl">
                        {overview.kpis.reviewsDue}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Reviews überfällig</CardDescription>
                      <CardTitle className="text-3xl">
                        {overview.kpis.reviewsOverdue}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Systeme ohne Owner</CardDescription>
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
