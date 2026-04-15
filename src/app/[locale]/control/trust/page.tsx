'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ExternalLink, Globe } from 'lucide-react';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { localizeHref } from '@/lib/i18n/localize-href';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { registerService } from '@/lib/register-first/register-service';
import { buildVerifyPassAbsoluteUrl } from '@/lib/register-first/entry-links';
import type { Register, UseCaseCard } from '@/lib/register-first/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TrustSnapshot {
  register: Register | null;
  totalUseCases: number;
  proofReadyCount: number;
  publicUseCases: UseCaseCard[];
  capturedAt: Date;
}

function getTrustPageCopy(locale: string) {
  if (locale === 'de') {
    return {
      title: 'Trust Portal',
      loadingFrameDescription:
        'Steuern Sie öffentliche Trust-Signale und nach außen sichtbare Nachweise.',
      loadingNextStep: 'Trust-Daten werden vorbereitet.',
      loadingPanelTitle: 'Trust Portal wird geladen',
      loadingPanelDescription:
        'Öffentliche Nachweise und Disclosure-Daten werden vorbereitet.',
      frameDescriptionWithOrg:
        'Öffentliche Trust-Signale für {organisation}.',
      frameDescription:
        'Öffentliche Trust-Signale und Disclosure-Steuerung für Ihr Register.',
      nextStepWithItems:
        'Prüfen Sie, welche Nachweise öffentlich sichtbar sein sollen.',
      nextStepEmpty:
        'Aktivieren Sie zuerst sichtbare Nachweise oder Organisations-Offenlegung.',
      disabledTitle: 'Trust Portal ist noch nicht freigeschaltet',
      disabledDescription:
        'Trust- und Portal-Steuerung wird über die bezahlte Control-Ebene bereitgestellt.',
      openRegister: 'Register öffnen',
      gatedTitle: 'Trust Portal gehört zur Governance-Stufe',
      gatedDescription:
        'Das Trust Portal bleibt für bezahlte Governance-Workspaces reserviert. Die Navigation bleibt sichtbar, damit der Zielbereich auffindbar ist.',
      openControl: 'Control öffnen',
      upgradeOptions: 'Upgrade-Optionen',
      dataLoadingTitle: 'Trust-Daten werden geladen',
      dataLoadingDescription:
        'Öffentliche Nachweise und Disclosure-Daten werden vorbereitet.',
      dataErrorTitle: 'Trust Portal konnte nicht geladen werden',
      publicEvidence: 'Öffentlich sichtbare Nachweise',
      proofReady: 'Nachweisfähige Einsatzfälle',
      orgDisclosure: 'Org-Disclosure',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      publicLinks: 'Öffentliche Links',
      publicLinksDescription:
        'Sichtbar gewordene Use Cases bleiben im Register gepflegt und werden hier als Trust-Ausgabe gebündelt.',
      empty:
        'Noch keine öffentlichen Nachweise vorhanden. Aktivieren Sie Trust Portal auf einem Use Case Pass oder schalten Sie die Organisations-Offenlegung in den Governance-Einstellungen frei.',
      open: 'Öffnen',
      loadDataError:
        'Trust-Portal-Daten konnten nicht geladen werden. Bitte öffnen Sie ein Register und versuchen Sie es erneut.',
    } as const;
  }

  return {
    title: 'Trust Portal',
    loadingFrameDescription:
      'Manage public trust signals and outward-facing evidence.',
    loadingNextStep: 'Trust data is being prepared.',
    loadingPanelTitle: 'Loading trust portal',
    loadingPanelDescription:
      'Public evidence and disclosure data are being prepared.',
    frameDescriptionWithOrg:
      'Public trust signals for {organisation}.',
    frameDescription:
      'Public trust signals and disclosure controls for your register.',
    nextStepWithItems:
      'Review which evidence should be publicly visible.',
    nextStepEmpty:
      'Enable visible evidence or organisational disclosure first.',
    disabledTitle: 'Trust Portal is not enabled yet',
    disabledDescription:
      'Trust and portal controls are provided through the paid control tier.',
    openRegister: 'Open register',
    gatedTitle: 'Trust Portal belongs to the governance tier',
    gatedDescription:
      'Trust Portal remains reserved for paid governance workspaces. The navigation stays visible so the target area remains discoverable.',
    openControl: 'Open control',
    upgradeOptions: 'Upgrade options',
    dataLoadingTitle: 'Loading trust data',
    dataLoadingDescription:
      'Public evidence and disclosure data are being prepared.',
    dataErrorTitle: 'Trust Portal could not be loaded',
    publicEvidence: 'Publicly visible evidence',
    proofReady: 'Proof-ready use cases',
    orgDisclosure: 'Org disclosure',
    active: 'Active',
    inactive: 'Inactive',
    publicLinks: 'Public links',
    publicLinksDescription:
      'Use cases that became visible remain maintained in the register and are bundled here as trust output.',
    empty:
      'There is no public evidence yet. Enable Trust Portal on a use case pass or turn on organisational disclosure in governance settings.',
    open: 'Open',
    loadDataError:
      'Trust portal data could not be loaded. Please open a register and try again.',
  } as const;
}

export default function ControlTrustPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const copy = useMemo(() => getTrustPageCopy(locale), [locale]);
  const router = useRouter();
  const {
    allowed: trustAllowed,
    loading: capabilityLoading,
  } = useCapability('trustPortal');

  const [snapshot, setSnapshot] = useState<TrustSnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const loadTrustData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;
      const useCases = register
        ? await registerService
            .listUseCases(register.registerId, { includeDeleted: false })
            .catch(() => [])
        : [];

      setSnapshot({
        register,
        totalUseCases: useCases.length,
        proofReadyCount: useCases.filter(
          (card) => card.status === 'PROOF_READY',
        ).length,
        publicUseCases: useCases.filter(
          (card) =>
            card.isPublicVisible &&
            Boolean(card.publicHashId) &&
            !card.isDeleted,
        ),
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to load trust portal data', error);
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
      registerFirstFlags.controlShell
    ) {
      void loadTrustData();
    }
  }, [loading, capabilityLoading, user, loadTrustData]);

  const previewLinks = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.publicUseCases.slice(0, 6).map((card) => ({
      useCaseId: card.useCaseId,
      purpose: card.purpose,
      href: buildVerifyPassAbsoluteUrl(card.publicHashId!),
    }));
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
        snapshot?.register?.organisationName
          ? copy.frameDescriptionWithOrg.replace(
              '{organisation}',
              snapshot.register.organisationName,
            )
          : copy.frameDescription
      }
      nextStep={
        snapshot?.publicUseCases.length
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
        ) : !trustAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title={copy.gatedTitle}
            description={copy.gatedDescription}
            actions={
              <>
                <Button asChild>
                  <Link href={controlHref}>{copy.openControl}</Link>
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

            {snapshot && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.publicEvidence}</CardDescription>
                      <CardTitle className="text-3xl">
                        {snapshot.publicUseCases.length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.proofReady}</CardDescription>
                      <CardTitle className="text-3xl">
                        {snapshot.proofReadyCount}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.orgDisclosure}</CardDescription>
                      <CardTitle className="text-2xl">
                        {snapshot.register?.publicOrganisationDisclosure
                          ? copy.active
                          : copy.inactive}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {copy.publicLinks}
                    </CardTitle>
                    <CardDescription>{copy.publicLinksDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {previewLinks.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        {copy.empty}
                      </div>
                    ) : (
                      previewLinks.map((entry) => (
                        <div
                          key={entry.useCaseId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {entry.purpose}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.href}
                            </p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={entry.href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {copy.open}
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
