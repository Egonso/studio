'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Globe } from 'lucide-react';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
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

export default function ControlTrustPage() {
  const { user, loading } = useAuth();
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
      setDataError(
        'Trust-Portal-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut.',
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

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Trust Portal"
        description="Steuern Sie öffentliche Trust-Signale und nach außen sichtbare Nachweise."
        nextStep="Trust-Daten werden vorbereitet."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Trust Portal wird geladen"
          description="Öffentliche Nachweise und Disclosure-Daten werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Trust Portal"
      description={
        snapshot?.register?.organisationName
          ? `Öffentliche Trust-Signale für ${snapshot.register.organisationName}.`
          : 'Öffentliche Trust-Signale und Disclosure-Steuerung für Ihr Register.'
      }
      nextStep={
        snapshot?.publicUseCases.length
          ? 'Prüfen Sie, welche Nachweise öffentlich sichtbar sein sollen.'
          : 'Aktivieren Sie zuerst sichtbare Nachweise oder Organisations-Offenlegung.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Trust Portal ist noch nicht freigeschaltet"
            description="Trust- und Portal-Steuerung wird über die bezahlte Control-Ebene bereitgestellt."
            actions={
              <Button asChild>
                <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
              </Button>
            }
          />
        ) : !trustAllowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Trust Portal gehört zur Governance-Stufe"
            description="Das Trust Portal bleibt für bezahlte Governance-Workspaces reserviert. Die Navigation bleibt sichtbar, damit der Zielbereich auffindbar ist."
            actions={
              <>
                <Button asChild>
                  <Link href={ROUTE_HREFS.control}>Control öffnen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={ROUTE_HREFS.register}>Register öffnen</Link>
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
                title="Trust-Daten werden geladen"
                description="Öffentliche Nachweise und Disclosure-Daten werden vorbereitet."
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title="Trust Portal konnte nicht geladen werden"
                description={dataError}
              />
            )}

            {snapshot && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>
                        Öffentlich sichtbare Nachweise
                      </CardDescription>
                      <CardTitle className="text-3xl">
                        {snapshot.publicUseCases.length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Proof-ready Use Cases</CardDescription>
                      <CardTitle className="text-3xl">
                        {snapshot.proofReadyCount}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Org-Disclosure</CardDescription>
                      <CardTitle className="text-2xl">
                        {snapshot.register?.publicOrganisationDisclosure
                          ? 'Aktiv'
                          : 'Inaktiv'}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Öffentliche Links
                    </CardTitle>
                    <CardDescription>
                      Sichtbar gewordene Use Cases bleiben im Register gepflegt
                      und werden hier als Trust-Ausgabe gebündelt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {previewLinks.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        Noch keine öffentlichen Nachweise vorhanden. Aktivieren
                        Sie Trust Portal auf einem Use Case Pass oder schalten
                        Sie die Organisations-Offenlegung in den
                        Governance-Einstellungen frei.
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
                              Öffnen
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
