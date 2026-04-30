'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ControlPolicyEngine } from '@/components/control/control-policy-engine';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { trackControlOpened } from '@/lib/analytics/control-events';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { localizeHref } from '@/lib/i18n/localize-href';
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
  const locale = useLocale();
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
  const registerHref = localizeHref(locale, ROUTE_HREFS.register);
  const controlHref = localizeHref(locale, ROUTE_HREFS.control);
  const governanceUpgradeHref = localizeHref(locale, ROUTE_HREFS.governanceUpgrade);

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
        locale === 'de'
          ? 'Policy-Daten konnten nicht geladen werden. Bitte öffnen Sie ein Register und versuchen Sie es erneut.'
          : 'Policy data could not be loaded. Please open a register and try again.',
      );
    } finally {
      setIsDataLoading(false);
    }
  }, [locale]);

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
    return buildControlPolicyCoverage(snapshot.useCases, snapshot.policies, locale);
  }, [snapshot, locale]);

  const preview = useMemo(() => {
    if (!snapshot) return null;
    return buildDeterministicPolicyPreview(
      snapshot.register,
      snapshot.useCases,
      snapshot.orgSettings,
      selectedLevel,
      snapshot.capturedAt,
      locale,
    );
  }, [snapshot, selectedLevel, locale]);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={t('policy.title')}
        description={
          locale === 'de'
            ? 'Policy Engine für Richtlinien, Versionen und Governance-Baselines.'
            : 'Policy Engine for policies, versions and governance baselines.'
        }
        nextStep={
          locale === 'de'
            ? 'Die Policy-Abdeckung wird vorbereitet.'
            : 'Policy coverage is being prepared.'
        }
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title={locale === 'de' ? 'Policies werden geladen' : 'Loading policies'}
          description={
            locale === 'de'
              ? 'Richtlinien, Use Cases und Organisationsdaten werden vorbereitet.'
              : 'Policies, use cases and organisation data are being prepared.'
          }
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
          ? locale === 'de'
            ? `Richtlinien und Governance-Baselines für ${snapshot.register.organisationName}.`
            : `Policies and governance baselines for ${snapshot.register.organisationName}.`
          : locale === 'de'
            ? 'Richtlinien und Governance-Baselines auf Organisationsebene.'
            : 'Policies and governance baselines at organisation level.'
      }
      nextStep={
        preview
          ? locale === 'de'
            ? `Prüfen Sie zuerst die Policy-Abdeckung für Level ${selectedLevel}.`
            : `Review policy coverage for Level ${selectedLevel} first.`
          : locale === 'de'
            ? 'Öffnen Sie Policies, Exports oder kehren Sie ins Register zurück.'
            : 'Open policies, exports or return to the register.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Policies sind noch nicht freigeschaltet' : 'Policies are not enabled yet'}
            description={
              locale === 'de'
                ? 'Die Policy Engine ist für diesen Workspace noch nicht aktiviert.'
                : 'The Policy Engine is not enabled for this workspace yet.'
            }
            actions={
              <Button asChild>
                <Link href={registerHref}>{locale === 'de' ? 'Register öffnen' : 'Open register'}</Link>
              </Button>
            }
          />
        ) : !policyAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Policy Engine gehört zur Governance-Stufe' : 'Policy Engine belongs to the governance tier'}
            description={
              locale === 'de'
                ? 'Richtlinien, Versionen und Governance-Baselines werden über das bezahlte Entitlement freigeschaltet.'
                : 'Policies, versions and governance baselines are unlocked through the paid entitlement.'
            }
            actions={
              <>
                <Button asChild>
                  <Link href={controlHref}>{locale === 'de' ? 'Control öffnen' : 'Open Control'}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={governanceUpgradeHref}>
                    {locale === 'de' ? 'Upgrade-Optionen' : 'Upgrade options'}
                  </Link>
                </Button>
              </>
            }
          />
        ) : !registerFirstFlags.controlPolicyEngine ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Policy Engine folgt in Kürze' : 'Policy Engine coming soon'}
            description={
              locale === 'de'
                ? 'Dieser Bereich wird aktuell erweitert und steht bald bereit.'
                : 'This area is being extended and will be available soon.'
            }
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href={controlHref}>{locale === 'de' ? 'Zu Control' : 'To Control'}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={registerHref}>{locale === 'de' ? 'Zum Register' : 'To register'}</Link>
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
                title={locale === 'de' ? 'Policy-Daten werden geladen' : 'Loading policy data'}
                description={
                  locale === 'de'
                    ? 'Policy-Abdeckung, Richtlinien und Registerdaten werden vorbereitet.'
                    : 'Policy coverage, policies and register data are being prepared.'
                }
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title={locale === 'de' ? 'Policies konnten nicht geladen werden' : 'Policies could not be loaded'}
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
