'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ControlPolicyEngine } from '@/components/control/control-policy-engine';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { trackControlOpened } from '@/lib/analytics/control-events';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import {
  buildControlPolicyCoverage,
  buildDeterministicPolicyPreview,
} from '@/lib/control/policy/coverage';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { policyService } from '@/lib/policy-engine';
import type { PolicyDocument, PolicyLevel } from '@/lib/policy-engine/types';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { registerService } from '@/lib/register-first/register-service';
import type {
  OrgSettings,
  Register,
  UseCaseCard,
} from '@/lib/register-first/types';

interface PolicySnapshot {
  register: Register;
  useCases: UseCaseCard[];
  policies: PolicyDocument[];
  orgSettings: OrgSettings;
  capturedAt: Date;
}

function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

function fallbackOrgSettings(register: Register): OrgSettings {
  return (
    register.orgSettings ?? {
      organisationName: register.organisationName || 'Nicht hinterlegt',
      industry: 'Nicht hinterlegt',
      contactPerson: {
        name: 'Nicht hinterlegt',
        email: 'not-configured@example.invalid',
      },
    }
  );
}

export default function ControlPoliciesPage() {
  const t = useTranslations();
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    allowed: policyAllowed,
    loading: capabilityLoading,
  } = useCapability('policyEngine');

  const [snapshot, setSnapshot] = useState<PolicySnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PolicyLevel>(2);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      registerFirstFlags.controlShell &&
      registerFirstFlags.controlAnalytics
    ) {
      trackControlOpened({ route: 'control_policies', entry: 'direct' });
    }
  }, [loading, user]);

  const loadPolicyData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;

      if (!register) {
        setSnapshot(null);
        return;
      }

      const [useCases, policies] = await Promise.all([
        registerService
          .listUseCases(register.registerId, { includeDeleted: false })
          .catch(() => []),
        policyService.listPolicies(register.registerId).catch(() => []),
      ]);

      setSnapshot({
        register,
        useCases,
        policies,
        orgSettings: fallbackOrgSettings(register),
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to load control policy data', error);
      setDataError(
        'Policy-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut.',
      );
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      !loading &&
      user &&
      policyAllowed &&
      registerFirstFlags.controlShell &&
      registerFirstFlags.controlPolicyEngine
    ) {
      void loadPolicyData();
    }
  }, [loading, user, loadPolicyData, policyAllowed]);

  const coverage = useMemo(() => {
    if (!snapshot) return null;
    return buildControlPolicyCoverage(snapshot.useCases, snapshot.policies);
  }, [snapshot]);

  const preview = useMemo(() => {
    if (!snapshot) return null;
    return buildDeterministicPolicyPreview(
      snapshot.register,
      snapshot.useCases,
      snapshot.orgSettings,
      selectedLevel,
      snapshot.capturedAt,
    );
  }, [snapshot, selectedLevel]);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={t('policy.title')}
        description="Policy Engine für Richtlinien, Versionen und Governance-Baselines."
        nextStep="Die Policy-Abdeckung wird vorbereitet."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Policies werden geladen"
          description="Richtlinien, Use Cases und Organisationsdaten werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title={t('policy.title')}
      description={
        snapshot?.register.organisationName
          ? `Richtlinien und Governance-Baselines für ${snapshot.register.organisationName}.`
          : 'Richtlinien und Governance-Baselines auf Organisationsebene.'
      }
      nextStep={
        preview
          ? `Prüfen Sie zuerst die Policy-Abdeckung für Level ${selectedLevel}.`
          : 'Öffnen Sie Policies, Exports oder kehren Sie ins Register zurück.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Policies sind noch nicht freigeschaltet"
            description="Die Policy Engine ist für diesen Workspace noch nicht aktiviert."
            actions={
              <Button asChild>
                <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
              </Button>
            }
          />
        ) : !policyAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Policy Engine gehört zur Governance-Stufe"
            description="Richtlinien, Versionen und Governance-Baselines werden über das bezahlte Entitlement freigeschaltet."
            actions={
              <>
                <Button asChild>
                  <Link href={ROUTE_HREFS.control}>Control öffnen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.governanceUpgrade}>
                    Upgrade-Optionen
                  </Link>
                </Button>
              </>
            }
          />
        ) : !registerFirstFlags.controlPolicyEngine ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Policy Engine folgt in Kürze"
            description="Dieser Bereich wird aktuell erweitert und steht bald bereit."
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
                title="Policy-Daten werden geladen"
                description="Policy-Abdeckung, Richtlinien und Registerdaten werden vorbereitet."
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title="Policies konnten nicht geladen werden"
                description={dataError}
              />
            )}

            {coverage && preview && (
              <ControlPolicyEngine
                coverage={coverage}
                preview={preview}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                onExportPreview={() => {
                  const datePart =
                    snapshot?.capturedAt.toISOString().slice(0, 10) ?? 'policy';
                  downloadMarkdown(
                    preview.markdown,
                    `policy-preview-level-${selectedLevel}-${datePart}.md`,
                  );
                }}
              />
            )}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
