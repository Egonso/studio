'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

export default function ControlWelcomePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const WELCOME_MODULES: WelcomeModule[] = [
    {
      href: ROUTE_HREFS.control,
      icon: CheckCircle2,
      title: t('control.overview'),
      description: t('control.overviewDesc'),
    },
    {
      href: ROUTE_HREFS.controlReviews,
      icon: ClipboardCheck,
      title: t('control.reviews'),
      description: t('control.welcome.reviewsDescription'),
    },
    {
      href: ROUTE_HREFS.governanceSettings,
      icon: Shield,
      title: t('governance.settings'),
      description: t('control.welcome.settingsDescription'),
    },
    {
      href: ROUTE_HREFS.controlPolicies,
      icon: FileText,
      title: t('control.policies'),
      description: t('control.welcome.policiesDescription'),
    },
    {
      href: ROUTE_HREFS.controlExports,
      icon: Users,
      title: t('control.exports'),
      description: t('control.exportsDesc'),
    },
    {
      href: ROUTE_HREFS.controlTrust,
      icon: Globe,
      title: t('control.trustPortal'),
      description: t('control.welcome.trustDescription'),
    },
    {
      href: ROUTE_HREFS.academy,
      icon: GraduationCap,
      title: t('control.academy'),
      description: t('control.academyDesc'),
    },
  ];
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
            : t('control.errors.reportLoadFailed'),
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
      ? t('control.welcome.title')
      : t('control.welcome.heading');
  const nextStep = hasPaidAccess
    ? t('control.welcome.nextStep')
    : t('control.welcome.nextStepNoAccess');
  const orgLabel = organisationName ?? t('common.unknown');
  const highlightedModules = useMemo(() => WELCOME_MODULES.slice(0, 3), []);

  if (authLoading || capabilityLoading || syncState === 'loading') {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={heading}
        description={t('control.welcome.preparing')}
        nextStep={t('control.welcome.preparingNextStep')}
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title={t('control.welcome.loading')}
          description={t('control.welcome.loadingDesc')}
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
        description={t('control.welcome.notAvailableDesc')}
        nextStep={nextStep}
      >
        <PageStatePanel
          tone={syncState === 'error' ? 'error' : 'default'}
          area="paid_governance_control"
          title={
            syncState === 'error'
              ? t('control.welcome.confirmFailed')
              : t('control.welcome.notActive')
          }
          description={
            syncError ??
            t('control.welcome.notActiveDesc')
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={ROUTE_HREFS.governanceUpgrade}>{t('control.welcome.openButton')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.register}>{t('settings.toRegister')}</Link>
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
      description={t('control.welcome.premiumActive', { orgName: orgLabel })}
      nextStep={nextStep}
      actions={
        <>
          <Button asChild>
            <Link href={ROUTE_HREFS.control}>{t('control.openControl')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTE_HREFS.governanceSettings}>{t('governance.settings')}</Link>
          </Button>
        </>
      }
    >
      <Card className="border-gray-200 bg-gray-50/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-950">
            {t('control.welcome.activationSuccess')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-900">
          <p>
            {t('control.welcome.activationSuccessDesc')}
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
                  <Link href={module.href}>{t('control.welcome.openModuleButton')}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SignedInAreaFrame>
  );
}
