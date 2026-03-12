'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ControlExportCenter } from '@/components/control/control-export-center';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { trackControlOpened } from '@/lib/analytics/control-events';
import {
  buildOrgExportArtifacts,
  type OrgExportArtifact,
} from '@/lib/control/exports/org-export-center';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { policyService } from '@/lib/policy-engine';
import type { PolicyDocument } from '@/lib/policy-engine/types';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { registerService } from '@/lib/register-first/register-service';
import type { OrgSettings, UseCaseCard } from '@/lib/register-first/types';

interface ExportSnapshot {
  useCases: UseCaseCard[];
  registerId: string | null;
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

export default function ControlExportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    allowed: exportAllowed,
    loading: capabilityLoading,
  } = useCapability('auditExport');

  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!registerFirstFlags.controlAnalytics) return;
    if (loading || !user || !registerFirstFlags.controlShell) return;
    trackControlOpened({
      route: 'control_exports',
      entry: 'direct',
    });
  }, [loading, user]);

  const loadExportData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;
      const registerId = register?.registerId ?? null;

      const useCases = registerId
        ? await registerService
            .listUseCases(registerId, { includeDeleted: false })
            .catch(() => [])
        : [];

      const loadedPolicies = registerId
        ? await policyService.listPolicies(registerId).catch(() => [])
        : [];

      setSnapshot({
        useCases,
        registerId,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
      setPolicies(loadedPolicies);
    } catch (error) {
      console.error('Failed to load control export data', error);
      setDataError(
        'Export-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut.',
      );
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      !loading &&
      user &&
      registerFirstFlags.controlShell &&
      registerFirstFlags.controlOrgExportCenter
    ) {
      void loadExportData();
    }
  }, [loading, user, loadExportData]);

  const artifacts: OrgExportArtifact[] = useMemo(() => {
    if (!snapshot) return [];
    return buildOrgExportArtifacts({
      useCases: snapshot.useCases,
      orgSettings: snapshot.orgSettings,
      organisationName: snapshot.organisationName,
      policies,
      now: snapshot.capturedAt,
    });
  }, [snapshot, policies]);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Exports"
        description="Audit- und Exportzentrum für Nachweise, Dossiers und Organisationsausgaben."
        nextStep="Export-Artefakte werden vorbereitet."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Exports werden geladen"
          description="Export-Artefakte und Organisationsdaten werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Exports"
      description={
        snapshot?.organisationName
          ? `Audit- und Exportzentrum für ${snapshot.organisationName}.`
          : 'Audit- und Exportzentrum für Nachweise, Dossiers und Organisationsausgaben.'
      }
      nextStep={
        snapshot
          ? 'Stellen Sie die passenden Audit- und Nachweisartefakte für Ihre Governance zusammen.'
          : 'Laden Sie Register- und Policy-Daten, um Exporte zu erzeugen.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Exports sind noch nicht freigeschaltet"
            description="Das Organisations-Export-Center ist vorbereitet, aber in diesem Workspace noch nicht aktiviert."
            actions={
              <Button asChild>
                <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
              </Button>
            }
          />
        ) : !exportAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Exports gehören zur Governance-Stufe"
            description="Audit-Dossiers und Organisations-Exporte werden über das bezahlte Governance-Entitlement freigeschaltet."
            actions={
              <>
                <Button asChild>
                  <Link href={ROUTE_HREFS.control}>Overview öffnen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.controlPolicies}>
                    Policy Engine öffnen
                  </Link>
                </Button>
              </>
            }
          />
        ) : !registerFirstFlags.controlOrgExportCenter ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Export Center ist vorbereitet"
            description="Der Bereich ist angelegt und kann über das Feature-Flag controlOrgExportCenter aktiviert werden."
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.control}>Zu Control</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.register}>Zum Register</Link>
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
                title="Export-Daten werden geladen"
                description="Register-, Policy- und Organisationsdaten werden vorbereitet."
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title="Exports konnten nicht geladen werden"
                description={dataError}
              />
            )}

            {snapshot ? (
              <ControlExportCenter
                artifacts={artifacts}
                generatedAt={snapshot.capturedAt}
              />
            ) : null}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
