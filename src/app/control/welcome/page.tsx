'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Shield,
  Users,
} from 'lucide-react';

import { SignedInAreaFrame, PageStatePanel } from '@/components/product-shells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { buildAuthPath } from '@/lib/auth/login-routing';
import { invalidateEntitlementCache } from '@/lib/compliance-engine/capability/useCapability';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { syncRegisterEntitlement } from '@/lib/register-first/entitlement-client';
import { registerService } from '@/lib/register-first/register-service';
import type { SubscriptionPlan } from '@/lib/register-first/types';

interface WelcomeModule {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const WELCOME_MODULES: WelcomeModule[] = [
  {
    href: ROUTE_HREFS.control,
    icon: CheckCircle2,
    title: 'Overview',
    description:
      'Sehen Sie Reifegrad, offene Aufgaben und den aktuellen Governance-Stand in einem Bericht.',
  },
  {
    href: ROUTE_HREFS.controlReviews,
    icon: ClipboardCheck,
    title: 'Reviews / Action Queue',
    description:
      'Bearbeiten Sie formale Prüfungen und priorisierte Governance-Maßnahmen an einem Ort.',
  },
  {
    href: ROUTE_HREFS.governanceSettings,
    icon: Shield,
    title: 'Governance Settings',
    description:
      'Hinterlegen Sie Rollen, Richtlinien, Incident-Prozesse und Review-Logik für Ihre Organisation.',
  },
  {
    href: ROUTE_HREFS.controlPolicies,
    icon: FileText,
    title: 'Policy Engine',
    description:
      'Erstellen und pflegen Sie Richtlinien und verknüpfen Sie sie sauber mit dokumentierten Use Cases.',
  },
  {
    href: ROUTE_HREFS.controlExports,
    icon: Users,
    title: 'Exports / Audit',
    description:
      'Erzeugen Sie Governance Reports, Policy Bundles und auditfähige Nachweispakete.',
  },
  {
    href: ROUTE_HREFS.controlTrust,
    icon: Globe,
    title: 'Trust Portal',
    description:
      'Steuern Sie, welche Nachweise und Transparenzsignale öffentlich sichtbar werden dürfen.',
  },
  {
    href: ROUTE_HREFS.academy,
    icon: GraduationCap,
    title: 'Academy',
    description:
      'Starten Sie Schulung, Lernfortschritt und Governance-Kompetenz direkt aus der Premium-Ebene.',
  },
];

export default function ControlWelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { allowed, loading: capabilityLoading, plan } =
    useCapability('reviewWorkflow');
  const checkoutSessionId = searchParams.get('checkout_session_id');
  const source = searchParams.get('source');
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    checkoutSessionId ? 'loading' : 'idle',
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activatedPlan, setActivatedPlan] = useState<SubscriptionPlan | null>(null);
  const [organisationName, setOrganisationName] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || user) {
      return;
    }

    router.replace(
      buildAuthPath({
        mode: 'login',
        sessionId: checkoutSessionId ?? undefined,
      }),
    );
  }, [authLoading, checkoutSessionId, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    void registerService
      .getFirstRegister()
      .then((register) => {
        if (!cancelled) {
          setOrganisationName(register?.organisationName ?? register?.name ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrganisationName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !checkoutSessionId || syncState !== 'loading') {
      return;
    }

    let cancelled = false;
    void syncRegisterEntitlement({ sessionId: checkoutSessionId })
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result?.needsRegister) {
          router.replace(
            buildAuthPath({
              mode: 'signup',
              intent: 'create_register',
              email: user.email ?? undefined,
              sessionId: checkoutSessionId,
            }),
          );
          return;
        }

        if (result?.applied) {
          invalidateEntitlementCache();
          setActivatedPlan(result.plan);
          setSyncError(null);
        }

        setSyncState('done');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSyncError(
          error instanceof Error
            ? error.message
            : 'Die Freischaltung konnte noch nicht abgeschlossen werden.',
        );
        setSyncState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [checkoutSessionId, router, syncState, user]);

  const effectivePlan = activatedPlan ?? plan;
  const hasPaidAccess =
    effectivePlan === 'pro' || effectivePlan === 'enterprise' || allowed;
  const heading =
    source === 'checkout'
      ? 'Willkommen im Governance Control Center'
      : 'Governance Control Center';
  const nextStep = hasPaidAccess
    ? 'Starten Sie in Governance Settings, prüfen Sie danach Reviews und aktivieren Sie anschließend Policies und Exports.'
    : 'Öffnen Sie zuerst die Freischaltung in den Governance-Einstellungen.';
  const orgLabel = organisationName ?? 'Ihre Organisation';
  const highlightedModules = useMemo(() => WELCOME_MODULES.slice(0, 3), []);

  if (authLoading || capabilityLoading || syncState === 'loading') {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={heading}
        description="Wir ordnen Ihre Freischaltung zu und bereiten den Premium-Zugriff vor."
        nextStep="Sobald die Billing-Rückkehr bestätigt ist, zeigen wir alle freigeschalteten Bereiche an."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Freischaltung wird vorbereitet"
          description="Checkout, Entitlement-Sync und Premium-Navigation werden gerade bestätigt."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  if (!hasPaidAccess) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={heading}
        description="Diese Seite steht nach erfolgreicher Governance-Freischaltung zur Verfügung."
        nextStep={nextStep}
      >
        <PageStatePanel
          tone={syncState === 'error' ? 'error' : 'default'}
          area="paid_governance_control"
          title={
            syncState === 'error'
              ? 'Freischaltung konnte nicht bestätigt werden'
              : 'Governance-Stufe noch nicht aktiv'
          }
          description={
            syncError ??
            'Öffnen Sie die Governance-Einstellungen, um die Freischaltung zu starten oder den Billing-Status zu prüfen.'
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={ROUTE_HREFS.governanceUpgrade}>Freischaltung öffnen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.register}>Zum Register</Link>
              </Button>
            </div>
          }
        />
      </SignedInAreaFrame>
    );
  }

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title={heading}
      description={`Die Premium-Ebene ist für ${orgLabel} aktiv. Sie haben jetzt Zugriff auf Reviews, Richtlinien, Export- und Trust-Funktionen sowie die Academy.`}
      nextStep={nextStep}
      actions={
        <>
          <Button asChild>
            <Link href={ROUTE_HREFS.control}>Control öffnen</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTE_HREFS.governanceSettings}>Governance Settings</Link>
          </Button>
        </>
      }
    >
      <Card className="border-gray-200 bg-gray-50/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-950">
            Freischaltung erfolgreich
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-900">
          <p>
            Sie behalten das Free Register und erhalten zusätzlich die komplette
            Governance-Ebene für Reviews, Policies, Exports, Trust Portal und
            Academy.
          </p>
          <ul className="space-y-2">
            {highlightedModules.map((module) => (
              <li key={module.title} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="font-medium">{module.title}:</span>{' '}
                  {module.description}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WELCOME_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="border-slate-200">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-base">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={module.href}>Öffnen</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SignedInAreaFrame>
  );
}
