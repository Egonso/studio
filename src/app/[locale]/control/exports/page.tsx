'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
import { localizeHref } from '@/lib/i18n/localize-href';
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
  const locale = useLocale();
  const router = useRouter();
  const {
    allowed: exportAllowed,
    loading: capabilityLoading,
  } = useCapability('auditExport');

  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const registerHref = localizeHref(locale, ROUTE_HREFS.register);
  const controlHref = localizeHref(locale, ROUTE_HREFS.control);
  const governanceUpgradeHref = localizeHref(locale, ROUTE_HREFS.governanceUpgrade);

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
        locale === 'de'
          ? 'Export-Daten konnten nicht geladen werden. Bitte öffnen Sie ein Register und versuchen Sie es erneut.'
          : 'Export data could not be loaded. Please open a register and try again.',
      );
    } finally {
      setIsDataLoading(false);
    }
  }, [locale]);

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
      locale,
    });
  }, [snapshot, policies, locale]);

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Exports"
        description={
          locale === 'de'
            ? 'Audit- und Exportzentrum für Nachweise, Dossiers und Organisationsausgaben.'
            : 'Audit and export center for evidence, dossiers and organisation outputs.'
        }
        nextStep={
          locale === 'de'
            ? 'Export-Artefakte werden vorbereitet.'
            : 'Export artifacts are being prepared.'
        }
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title={locale === 'de' ? 'Exports werden geladen' : 'Loading exports'}
          description={
            locale === 'de'
              ? 'Export-Artefakte und Organisationsdaten werden vorbereitet.'
              : 'Export artifacts and organisation data are being prepared.'
          }
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
          ? locale === 'de'
            ? `Audit- und Exportzentrum für ${snapshot.organisationName}.`
            : `Audit and export center for ${snapshot.organisationName}.`
          : locale === 'de'
            ? 'Audit- und Exportzentrum für Nachweise, Dossiers und Organisationsausgaben.'
            : 'Audit and export center for evidence, dossiers and organisation outputs.'
      }
      nextStep={
        snapshot
          ? locale === 'de'
            ? 'Stellen Sie die passenden Audit- und Nachweisartefakte für Ihre Governance zusammen.'
            : 'Prepare the appropriate audit and evidence artifacts for your governance work.'
          : locale === 'de'
            ? 'Laden Sie Register- und Policy-Daten, um Exporte zu erzeugen.'
            : 'Load register and policy data to generate exports.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Exports sind noch nicht freigeschaltet' : 'Exports are not enabled yet'}
            description={
              locale === 'de'
                ? 'Das Export Center ist für diesen Workspace noch nicht aktiviert.'
                : 'The export center is not enabled for this workspace yet.'
            }
            actions={
              <Button asChild>
                <Link href={registerHref}>{locale === 'de' ? 'Register öffnen' : 'Open register'}</Link>
              </Button>
            }
          />
        ) : !exportAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Exports gehören zur Governance-Stufe' : 'Exports belong to the governance tier'}
            description={
              locale === 'de'
                ? 'Audit-Dossiers und Organisations-Exporte werden über das bezahlte Governance-Entitlement freigeschaltet.'
                : 'Audit dossiers and organisation exports are unlocked through the paid governance entitlement.'
            }
            actions={
              <>
                <Button asChild>
                  <Link href={controlHref}>{locale === 'de' ? 'Overview öffnen' : 'Open overview'}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={governanceUpgradeHref}>
                    {locale === 'de' ? 'Upgrade-Optionen' : 'Upgrade options'}
                  </Link>
                </Button>
              </>
            }
          />
        ) : !registerFirstFlags.controlOrgExportCenter ? (
          <PageStatePanel
            area="paid_governance_control"
            title={locale === 'de' ? 'Export Center folgt in Kürze' : 'Export Center coming soon'}
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
                title={locale === 'de' ? 'Export-Daten werden geladen' : 'Loading export data'}
                description={
                  locale === 'de'
                    ? 'Register-, Policy- und Organisationsdaten werden vorbereitet.'
                    : 'Register, policy and organisation data are being prepared.'
                }
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title={locale === 'de' ? 'Exports konnten nicht geladen werden' : 'Exports could not be loaded'}
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
