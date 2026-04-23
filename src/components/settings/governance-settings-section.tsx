'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Building,
  FileCheck2,
  GraduationCap,
  Loader2,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';

import { FeatureGate } from '@/components/register/feature-gate';
import { AccessCodeManager } from '@/components/register/access-code-manager';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { GovernanceBillingInterval } from '@/lib/billing/governance-volume-pricing';
import { buildBillingWelcomePath } from '@/lib/billing/post-checkout';
import { getGovernanceUpgradeDestination } from '@/lib/billing/upgrade-surface';
import { invalidateEntitlementCache } from '@/lib/compliance-engine/capability/useCapability';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { syncRegisterEntitlement } from '@/lib/register-first/entitlement-client';
import {
  parseRegisterScopeFromWorkspaceValue,
  resolveClientRegisterScopeContext,
} from '@/lib/register-first/register-scope';
import { registerService } from '@/lib/register-first/register-service';
import type {
  OrgSettings,
  Register,
  RegisterScopeContext,
  RoleEntry,
} from '@/lib/register-first/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageStatePanel } from '@/components/product-shells';

const SCOPE_OPTIONS = [
  { value: 'INTERNAL' as const, label: 'Intern (eigene Mitarbeitende)' },
  { value: 'EXTERNAL' as const, label: 'Extern (Kunden, Öffentlichkeit)' },
  { value: 'PRODUCT_AI' as const, label: 'Produkt-KI (eigenes KI-Produkt)' },
  { value: 'SUPPLY_CHAIN' as const, label: 'Lieferkette (Zulieferer-KI)' },
] as const;

const RACI_ROLES = [
  { key: 'aiOwner' as const, label: 'KI-Verantwortliche:r (AI Owner)' },
  { key: 'complianceOwner' as const, label: 'Compliance Officer' },
  {
    key: 'technicalOwner' as const,
    label: 'Technische:r Verantwortliche:r',
  },
  { key: 'incidentOwner' as const, label: 'Incident-Verantwortliche:r' },
  { key: 'reviewOwner' as const, label: 'Review-Verantwortliche:r' },
  { key: 'dpo' as const, label: 'Datenschutzbeauftragte:r (DPO)' },
  {
    key: 'securityOfficer' as const,
    label: 'Informationssicherheit (CISO)',
  },
  { key: 'productOwner' as const, label: 'Product Owner' },
] as const;

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRoleEntry(
  entry: RoleEntry | null | undefined,
): RoleEntry | null {
  const name = entry?.name?.trim() ?? '';
  if (!name) {
    return null;
  }

  const email = normalizeOptionalText(entry?.email ?? '');
  const department = normalizeOptionalText(entry?.department ?? '');

  return {
    name,
    ...(email ? { email } : {}),
    ...(department ? { department } : {}),
  };
}

function RoleInput({
  role,
  value,
  onChange,
}: {
  role: { key: string; label: string };
  value: RoleEntry | null | undefined;
  onChange: (val: RoleEntry | null) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/10 p-3">
      <div className="text-sm font-medium">{role.label}</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input
          placeholder="Name"
          value={value?.name || ''}
          onChange={(e) =>
            onChange({
              ...value,
              name: e.target.value,
              email: value?.email,
              department: value?.department,
            })
          }
        />
        <Input
          placeholder="E-Mail"
          type="email"
          value={value?.email || ''}
          onChange={(e) =>
            onChange({
              ...value,
              name: value?.name || '',
              email: e.target.value,
              department: value?.department,
            })
          }
        />
        <Input
          placeholder="Abteilung"
          value={value?.department || ''}
          onChange={(e) =>
            onChange({
              ...value,
              name: value?.name || '',
              email: value?.email,
              department: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}

export function GovernanceSettingsSection() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const checkoutSessionId = searchParams.get('checkout_session_id');
  const workspaceScopeValue = searchParams.get('workspace');

  const [register, setRegister] = useState<Register | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [billingAction, setBillingAction] = useState<
    'checkout' | 'portal' | null
  >(null);
  const [billingInterval, setBillingInterval] =
    useState<GovernanceBillingInterval>('month');
  const [syncedCheckoutSessionId, setSyncedCheckoutSessionId] = useState<
    string | null
  >(null);
  const [scopeContext, setScopeContext] = useState<RegisterScopeContext | null>(
    null,
  );

  const [orgName, setOrgName] = useState('');
  const [orgUnit, setOrgUnit] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [aiPolicyUrl, setAiPolicyUrl] = useState('');
  const [aiPolicyOwner, setAiPolicyOwner] = useState('');
  const [aiPolicyReviewedAt, setAiPolicyReviewedAt] = useState('');
  const [incidentUrl, setIncidentUrl] = useState('');
  const [rolesUrl, setRolesUrl] = useState('');
  const [rolesDefined, setRolesDefined] = useState(false);
  const [reviewStandard, setReviewStandard] = useState<string>('risk-based');
  const [publicDisclosure, setPublicDisclosure] = useState(false);
  const [scope, setScope] = useState<string[]>([]);
  const [raci, setRaci] = useState<Record<string, RoleEntry | null>>({});
  const [riskMethodology, setRiskMethodology] = useState<string>('basis');
  const [incidentReportingPath, setIncidentReportingPath] = useState('');
  const [incidentEscalation, setIncidentEscalation] = useState('');
  const [incidentDocRequired, setIncidentDocRequired] = useState(false);
  const [incidentTimeframe, setIncidentTimeframe] = useState('');
  const [reviewCycleType, setReviewCycleType] = useState<string>('risk_based');
  const [reviewCycleInterval, setReviewCycleInterval] = useState('');
  const [euAiActTraining, setEuAiActTraining] = useState(false);
  const [techAiCompetency, setTechAiCompetency] = useState(false);
  const [privacyTraining, setPrivacyTraining] = useState(false);
  const [incidentTraining, setIncidentTraining] = useState(false);
  const [iso27001, setIso27001] = useState(false);
  const [iso42001, setIso42001] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;
    const requestedScope =
      parseRegisterScopeFromWorkspaceValue(workspaceScopeValue);

    void resolveClientRegisterScopeContext({
      userId: user.uid,
      requestedScope,
    })
      .then(async (resolvedScope) => {
        if (isCancelled) {
          return;
        }

        setScopeContext(resolvedScope);
        const reg = await registerService.getFirstRegister(resolvedScope);
        if (isCancelled || !reg) {
          return;
        }

        if (!reg) {
          return;
        }

        setRegister(reg);
        setOrgName(reg.organisationName || '');
        setOrgUnit(reg.organisationUnit || '');
        setPublicDisclosure(reg.publicOrganisationDisclosure || false);

        const settings = reg.orgSettings;
        if (!settings) {
          return;
        }

        setIndustry(settings.industry || '');
        setContactName(settings.contactPerson?.name || '');
        setContactEmail(settings.contactPerson?.email || '');
        setAiPolicyUrl(settings.aiPolicy?.url || '');
        setAiPolicyOwner(settings.aiPolicy?.owner || '');
        setAiPolicyReviewedAt(settings.aiPolicy?.lastReviewedAt || '');
        setIncidentUrl(settings.incidentProcess?.url || '');
        setRolesUrl(settings.rolesFramework?.docUrl || '');
        setRolesDefined(settings.rolesFramework?.booleanDefined || false);
        setReviewStandard(settings.reviewStandard || 'risk-based');
        setScope(settings.scope || []);
        if (settings.raci) {
          const nextRaci: Record<string, RoleEntry | null> = {};
          for (const role of RACI_ROLES) {
            nextRaci[role.key] = settings.raci[role.key] || null;
          }
          setRaci(nextRaci);
        }
        setRiskMethodology(settings.riskMethodology || 'basis');
        setIncidentReportingPath(settings.incidentConfig?.reportingPath || '');
        setIncidentEscalation(settings.incidentConfig?.escalationLevel || '');
        setIncidentDocRequired(
          settings.incidentConfig?.documentationRequired || false,
        );
        setIncidentTimeframe(settings.incidentConfig?.responseTimeframe || '');
        setReviewCycleType(settings.reviewCycle?.type || 'risk_based');
        setReviewCycleInterval(settings.reviewCycle?.interval || '');
        setEuAiActTraining(
          settings.competencyMatrix?.euAiActTrainingRequired || false,
        );
        setTechAiCompetency(
          settings.competencyMatrix?.technicalAiCompetency || false,
        );
        setPrivacyTraining(
          settings.competencyMatrix?.dataPrivacyTraining || false,
        );
        setIncidentTraining(
          settings.competencyMatrix?.incidentTraining || false,
        );
        setIso27001(settings.isoFlags?.iso27001Alignment || false);
        setIso42001(settings.isoFlags?.iso42001Preparation || false);
      })
      .catch((error) => {
        console.error('Governance settings load failed', error);
      })
      .finally(() => setIsLoading(false));

    return () => {
      isCancelled = true;
    };
  }, [user, workspaceScopeValue]);

  useEffect(() => {
    if (!register?.registerId || !checkoutSessionId) {
      return;
    }

    const syncKey = `${register.registerId}:${checkoutSessionId}`;
    if (syncedCheckoutSessionId === syncKey) {
      return;
    }

    setSyncedCheckoutSessionId(syncKey);
    void syncRegisterEntitlement({
      registerId: register.registerId,
      sessionId: checkoutSessionId,
    })
      .then((result) => {
        if (!result?.applied) {
          return;
        }

        invalidateEntitlementCache();
        setRegister((current) =>
          current
            ? {
                ...current,
                plan: result.plan,
                entitlement: {
                  ...current.entitlement,
                  plan: result.plan,
                  status: 'active',
                  source:
                    result.source === 'stripe_checkout' ||
                    result.source === 'stripe_webhook' ||
                    result.source === 'customer_entitlement_sync' ||
                    result.source === 'billing_repair' ||
                    result.source === 'legacy_purchase_import' ||
                    result.source === 'legacy_plan_field' ||
                    result.source === 'default_free' ||
                    result.source === 'manual'
                      ? result.source
                      : 'customer_entitlement_sync',
                  updatedAt: new Date().toISOString(),
                  checkoutSessionId,
                },
              }
            : current,
        );
        toast({
          title: t('settings.billing.syncSuccess'),
          description:
            result.plan === 'enterprise'
              ? t('settings.billing.syncSuccessEnterprise')
              : t('settings.billing.syncSuccessPro'),
        });
        router.replace(
          buildBillingWelcomePath(checkoutSessionId, {
            source: 'checkout',
          }),
        );
      })
      .catch((error) => {
        console.error('Governance entitlement sync failed', error);
        toast({
          variant: 'destructive',
          title: t('settings.billing.syncFailed'),
          description: t('settings.billing.syncFailedDesc'),
        });
      });
  }, [
    checkoutSessionId,
    register?.registerId,
    router,
    syncedCheckoutSessionId,
    t,
    toast,
  ]);

  if (!user) {
    return null;
  }

  const toggleScope = (value: string) => {
    setScope((previous) =>
      previous.includes(value)
        ? previous.filter((entry) => entry !== value)
        : [...previous, value],
    );
  };

  const handleBillingAction = async (
    action: 'checkout' | 'portal',
    targetPlan: 'pro' | 'enterprise' = 'pro',
  ) => {
    if (!user) {
      return;
    }

    setBillingAction(action);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        action === 'checkout' ? '/api/billing/checkout' : '/api/billing/portal',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body:
            action === 'checkout'
              ? JSON.stringify({
                  targetPlan,
                  billingInterval,
                  registerId: register?.registerId ?? null,
                  workspaceId:
                    scopeContext?.kind === 'workspace'
                      ? scopeContext.workspaceId
                      : register?.workspaceId ?? null,
                })
              : JSON.stringify({}),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || typeof payload.url !== 'string') {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : action === 'portal'
              ? t('settings.billing.billingPortalError')
              : t('settings.billing.checkoutError'),
        );
      }

      window.location.assign(payload.url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title:
          action === 'portal'
            ? t('settings.billing.billingNotAvailable')
            : t('settings.billing.checkoutNotAvailable'),
        description:
          error instanceof Error
            ? error.message
            : t('settings.billing.billingActionUnavailable'),
      });
    } finally {
      setBillingAction(null);
    }
  };

  const handleSave = async () => {
    if (!register) {
      return;
    }

    setIsSaving(true);
    try {
      const raciData: OrgSettings['raci'] = {};
      for (const role of RACI_ROLES) {
        raciData[role.key] = normalizeRoleEntry(raci[role.key]);
      }

      const normalizedAiPolicyUrl = normalizeOptionalText(aiPolicyUrl);
      const normalizedAiPolicyOwner = normalizeOptionalText(aiPolicyOwner);
      const normalizedAiPolicyReviewedAt =
        normalizeOptionalText(aiPolicyReviewedAt);
      const normalizedIncidentUrl = normalizeOptionalText(incidentUrl);
      const normalizedRolesUrl = normalizeOptionalText(rolesUrl);
      const normalizedIncidentReportingPath = normalizeOptionalText(
        incidentReportingPath,
      );
      const normalizedIncidentEscalation =
        normalizeOptionalText(incidentEscalation);
      const normalizedIncidentTimeframe =
        normalizeOptionalText(incidentTimeframe);
      const normalizedReviewCycleInterval =
        normalizeOptionalText(reviewCycleInterval);

      const orgSettings: OrgSettings = {
        organisationName: orgName.trim(),
        industry: industry.trim(),
        contactPerson: {
          name: contactName.trim(),
          email: contactEmail.trim(),
        },
        aiPolicy: normalizedAiPolicyUrl
          ? {
              url: normalizedAiPolicyUrl,
              ...(normalizedAiPolicyOwner
                ? { owner: normalizedAiPolicyOwner }
                : {}),
              ...(normalizedAiPolicyReviewedAt
                ? { lastReviewedAt: normalizedAiPolicyReviewedAt }
                : {}),
            }
          : null,
        incidentProcess: normalizedIncidentUrl
          ? { url: normalizedIncidentUrl }
          : null,
        rolesFramework:
          normalizedRolesUrl || rolesDefined
            ? {
                ...(normalizedRolesUrl ? { docUrl: normalizedRolesUrl } : {}),
                booleanDefined: rolesDefined,
              }
            : null,
        reviewStandard: reviewStandard as OrgSettings['reviewStandard'],
        scope: scope as OrgSettings['scope'],
        raci: raciData,
        riskMethodology: riskMethodology as OrgSettings['riskMethodology'],
        incidentConfig: {
          ...(normalizedIncidentReportingPath
            ? { reportingPath: normalizedIncidentReportingPath }
            : {}),
          ...(normalizedIncidentEscalation
            ? { escalationLevel: normalizedIncidentEscalation }
            : {}),
          documentationRequired: incidentDocRequired,
          ...(normalizedIncidentTimeframe
            ? { responseTimeframe: normalizedIncidentTimeframe }
            : {}),
        },
        reviewCycle: {
          type: reviewCycleType as 'fixed' | 'risk_based' | 'event_based',
          ...(normalizedReviewCycleInterval
            ? { interval: normalizedReviewCycleInterval }
            : {}),
        },
        competencyMatrix: {
          euAiActTrainingRequired: euAiActTraining,
          technicalAiCompetency: techAiCompetency,
          dataPrivacyTraining: privacyTraining,
          incidentTraining: incidentTraining,
        },
        isoFlags: {
          iso27001Alignment: iso27001,
          iso42001Preparation: iso42001,
        },
      };

      await registerService.updateRegisterProfile(register.registerId, {
        organisationName: orgName.trim() || null,
        organisationUnit: orgUnit.trim() || null,
        publicOrganisationDisclosure: publicDisclosure,
        orgSettings,
      });

      toast({
        title: t('settings.saved'),
        description: t('settings.savedDesc'),
      });
    } catch (error) {
      console.error('Governance settings save failed', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('settings.saveFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageStatePanel
        tone="loading"
        area="signed_in_free_register"
        title={t('settings.loading')}
        description={t('settings.loadingDesc')}
      />
    );
  }

  if (!register) {
    return (
      <PageStatePanel
        area="signed_in_free_register"
        title={t('settings.noRegister')}
        description={t('settings.noRegisterDesc')}
        actions={
          <Button asChild>
            <Link href={ROUTE_HREFS.register}>{t('settings.toRegister')}</Link>
          </Button>
        }
      />
    );
  }

  const activeRegisterEntitlement =
    register.entitlement?.status === 'active' ? register.entitlement : null;
  const activeWorkspaceEntitlement =
    profile?.workspaceEntitlement?.status === 'active'
      ? profile.workspaceEntitlement
      : null;
  const currentPlan =
    activeRegisterEntitlement?.plan ??
    activeWorkspaceEntitlement?.plan ??
    register.plan ??
    'free';
  const enterpriseUpgradeDestination =
    currentPlan === 'pro' ? getGovernanceUpgradeDestination(currentPlan) : null;
  const workspaceIdFromScope =
    scopeContext?.kind === 'workspace' ? scopeContext.workspaceId : null;
  const currentPlanLabel =
    currentPlan === 'enterprise'
      ? t('settings.billing.enterprisePlan')
      : currentPlan === 'pro'
        ? t('settings.billing.proPlan')
        : t('settings.billing.freePlan');
  const currentPlanDescription =
    currentPlan === 'enterprise'
      ? t('settings.billing.enterpriseDesc')
      : currentPlan === 'pro'
        ? t('settings.billing.proDesc')
        : t('settings.billing.freeDesc');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('settings.governance.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('governance.settingsDesc')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('settings.governance.saveChanges')}
        </Button>
      </div>

      <div
        id="upgrade-panel"
        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-950">
              {t('settings.billing.title')}
            </p>
            <p className="text-sm text-slate-700">
              {t('settings.billing.currentPlan', { plan: currentPlanLabel })}
            </p>
            <p className="text-sm text-slate-600">{currentPlanDescription}</p>
            {enterpriseUpgradeDestination ? (
              <p className="text-xs text-slate-500">
                {enterpriseUpgradeDestination.description}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {currentPlan === 'free'
                  ? t('settings.billing.freeHint')
                  : t('settings.billing.maxLevelHint')}
              </p>
            )}
            {currentPlan === 'free' ? (
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      billingInterval === 'month' ? 'default' : 'outline'
                    }
                    onClick={() => setBillingInterval('month')}
                    disabled={billingAction !== null}
                  >
                    {t('settings.billing.monthly')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={billingInterval === 'year' ? 'default' : 'outline'}
                    onClick={() => setBillingInterval('year')}
                    disabled={billingAction !== null}
                  >
                    {t('settings.billing.yearly')}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {t('settings.billing.yearlyHint')}
                </p>
                {workspaceIdFromScope || register.workspaceId ? (
                  <p className="text-xs text-slate-500">
                    {t('settings.billing.workspaceContext')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {currentPlan === 'free' ? (
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.control}>{t('control.viewReport')}</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.control}>{t('control.openControl')}</Link>
              </Button>
            )}
            {currentPlan === 'free' ? (
              <Button
                onClick={() => void handleBillingAction('checkout', 'pro')}
                disabled={billingAction !== null}
              >
                {billingAction === 'checkout' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('settings.billing.unlockGovernance')}
              </Button>
            ) : null}
            {currentPlan === 'pro' || currentPlan === 'enterprise' ? (
              <Button
                variant="outline"
                onClick={() => void handleBillingAction('portal')}
                disabled={billingAction !== null}
              >
                {billingAction === 'portal' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('settings.billing.manageBilling')}
              </Button>
            ) : null}
            {enterpriseUpgradeDestination ? (
              <Button
                asChild
                variant={
                  enterpriseUpgradeDestination.checkoutConfigured
                    ? 'default'
                    : 'outline'
                }
              >
                <a
                  href={enterpriseUpgradeDestination.href}
                  target={
                    enterpriseUpgradeDestination.external &&
                    !enterpriseUpgradeDestination.href.startsWith('mailto:')
                      ? '_blank'
                      : undefined
                  }
                  rel={
                    enterpriseUpgradeDestination.external &&
                    !enterpriseUpgradeDestination.href.startsWith('mailto:')
                      ? 'noreferrer'
                      : undefined
                  }
                >
                  {enterpriseUpgradeDestination.label}
                </a>
              </Button>
            ) : currentPlan === 'enterprise' ? (
              <Button asChild>
                <Link href={ROUTE_HREFS.controlEnterprise}>
                  {t('control.openOrganisation')}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={['identity', 'governance-framework']}
        className="space-y-3"
      >
        <AccordionItem value="identity" className="rounded-lg border px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.orgData.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('governance.orgData.org')}</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={t('governance.orgData.orgPlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('governance.orgData.orgUnit')}</Label>
                  <Input
                    value={orgUnit}
                    onChange={(e) => setOrgUnit(e.target.value)}
                    placeholder={t('governance.orgData.orgUnitPlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('governance.orgData.industry')}</Label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder={t('governance.orgData.industryPlaceholder')}
                  />
                </div>
              </div>
              <div className="pt-2 text-sm font-medium">
                {t('governance.orgData.primaryContact')}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('governance.orgData.name')}</Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('governance.orgData.namePlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('governance.orgData.email')}</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('governance.orgData.emailPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="governance-framework"
          className="rounded-lg border px-1"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.frameworkTitle')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-6">
              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div className="text-sm font-medium">
                  {t('settings.governance.aiPolicy')}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>{t('governance.aiPolicy.docUrl')}</Label>
                    <Input
                      value={aiPolicyUrl}
                      onChange={(e) => setAiPolicyUrl(e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('governance.aiPolicy.owner')}</Label>
                    <Input
                      value={aiPolicyOwner}
                      onChange={(e) => setAiPolicyOwner(e.target.value)}
                      placeholder={t('governance.aiPolicy.ownerPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('governance.aiPolicy.lastReview')}</Label>
                    <Input
                      type="date"
                      value={aiPolicyReviewedAt}
                      onChange={(e) => setAiPolicyReviewedAt(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div className="text-sm font-medium">{t('governance.incident.title')}</div>
                <div className="space-y-1.5">
                  <Label>{t('governance.incident.processUrl')}</Label>
                  <Input
                    value={incidentUrl}
                    onChange={(e) => setIncidentUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div className="text-sm font-medium">
                  {t('settings.governance.roles')}
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="gs-roles"
                    checked={rolesDefined}
                    onCheckedChange={(checked) =>
                      setRolesDefined(checked === true)
                    }
                  />
                  <Label htmlFor="gs-roles" className="text-sm">
                    {t('governance.roles.formallyDefined')}
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('governance.roles.docUrl')}</Label>
                  <Input
                    value={rolesUrl}
                    onChange={(e) => setRolesUrl(e.target.value)}
                    disabled={!rolesDefined}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('governance.review.minFrequency')}</Label>
                <Select
                  value={reviewStandard}
                  onValueChange={setReviewStandard}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">{t('governance.review.annual')}</SelectItem>
                    <SelectItem value="semiannual">{t('governance.review.semiannual')}</SelectItem>
                    <SelectItem value="risk-based">{t('governance.review.riskBasedLabel')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scope" className="rounded-lg border px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.scope.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <FeatureGate feature="extendedOrgSettings" mode="overlay">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('governance.scope.description')}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {SCOPE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center gap-3 rounded-md border bg-muted/10 p-3"
                    >
                      <Checkbox
                        id={`scope-${option.value}`}
                        checked={scope.includes(option.value)}
                        onCheckedChange={() => toggleScope(option.value)}
                      />
                      <Label
                        htmlFor={`scope-${option.value}`}
                        className="cursor-pointer text-sm"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <Label>{t('governance.riskMethodology.label')}</Label>
                  <Select
                    value={riskMethodology}
                    onValueChange={setRiskMethodology}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basis">
                        {t('governance.riskMethodology.basis')}
                      </SelectItem>
                      <SelectItem value="extended">
                        {t('governance.riskMethodology.extended')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FeatureGate>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="raci" className="rounded-lg border px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.raci.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <FeatureGate feature="extendedOrgSettings" mode="overlay">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('governance.raci.description')}
                </p>
                {RACI_ROLES.map((role) => (
                  <RoleInput
                    key={role.key}
                    role={role}
                    value={raci[role.key]}
                    onChange={(value) =>
                      setRaci((previous) => ({
                        ...previous,
                        [role.key]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </FeatureGate>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="incident-config"
          className="rounded-lg border px-1"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.incident.config')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <FeatureGate feature="extendedOrgSettings" mode="overlay">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('governance.incident.configDesc')}
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('governance.incident.reportingPath')}</Label>
                    <Input
                      value={incidentReportingPath}
                      onChange={(e) => setIncidentReportingPath(e.target.value)}
                      placeholder={t('governance.incident.reportingPathPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('governance.incident.escalation')}</Label>
                    <Input
                      value={incidentEscalation}
                      onChange={(e) => setIncidentEscalation(e.target.value)}
                      placeholder={t('governance.incident.escalationPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('governance.incident.timeframe')}</Label>
                    <Input
                      value={incidentTimeframe}
                      onChange={(e) => setIncidentTimeframe(e.target.value)}
                      placeholder={t('governance.incident.timeframePlaceholder')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="inc-doc"
                    checked={incidentDocRequired}
                    onCheckedChange={(checked) =>
                      setIncidentDocRequired(checked === true)
                    }
                  />
                  <Label htmlFor="inc-doc" className="text-sm">
                    {t('governance.incident.documentationRequired')}
                  </Label>
                </div>
              </div>
            </FeatureGate>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="review-logic" className="rounded-lg border px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.review.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <FeatureGate feature="extendedOrgSettings" mode="overlay">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('governance.review.type')}</Label>
                  <Select
                    value={reviewCycleType}
                    onValueChange={setReviewCycleType}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{t('governance.review.fixed')}</SelectItem>
                      <SelectItem value="risk_based">{t('governance.review.riskBased')}</SelectItem>
                      <SelectItem value="event_based">{t('governance.review.eventBased')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {reviewCycleType === 'fixed' ? (
                  <div className="space-y-1.5">
                    <Label>{t('governance.review.interval')}</Label>
                    <Input
                      value={reviewCycleInterval}
                      onChange={(e) => setReviewCycleInterval(e.target.value)}
                      placeholder={t('governance.review.intervalPlaceholder')}
                    />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {reviewCycleType === 'risk_based'
                    ? t('governance.review.riskBasedHint')
                    : reviewCycleType === 'event_based'
                      ? t('governance.review.eventBasedHint')
                      : t('governance.review.fixedHint')}
                </p>
              </div>
            </FeatureGate>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="competency-iso"
          className="rounded-lg border px-1"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('governance.competency.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <FeatureGate feature="extendedOrgSettings" mode="overlay">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-sm font-medium">
                    {t('governance.competency.requirements')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('governance.competency.requirementsHint')}
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="comp-euai"
                        checked={euAiActTraining}
                        onCheckedChange={(checked) =>
                          setEuAiActTraining(checked === true)
                        }
                      />
                      <Label
                        htmlFor="comp-euai"
                        className="cursor-pointer text-sm"
                      >
                        {t('governance.competency.euAiActTraining')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="comp-tech"
                        checked={techAiCompetency}
                        onCheckedChange={(checked) =>
                          setTechAiCompetency(checked === true)
                        }
                      />
                      <Label
                        htmlFor="comp-tech"
                        className="cursor-pointer text-sm"
                      >
                        {t('governance.competency.technicalAiCompetency')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="comp-priv"
                        checked={privacyTraining}
                        onCheckedChange={(checked) =>
                          setPrivacyTraining(checked === true)
                        }
                      />
                      <Label
                        htmlFor="comp-priv"
                        className="cursor-pointer text-sm"
                      >
                        {t('governance.competency.dataPrivacyTraining')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="comp-inc"
                        checked={incidentTraining}
                        onCheckedChange={(checked) =>
                          setIncidentTraining(checked === true)
                        }
                      />
                      <Label
                        htmlFor="comp-inc"
                        className="cursor-pointer text-sm"
                      >
                        {t('governance.competency.incidentTraining')}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-5">
                  <div className="text-sm font-medium">{t('governance.iso.title')}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('governance.iso.hint')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="iso-27001"
                        checked={iso27001}
                        onCheckedChange={(checked) =>
                          setIso27001(checked === true)
                        }
                      />
                      <div>
                        <Label
                          htmlFor="iso-27001"
                          className="cursor-pointer text-sm font-medium"
                        >
                          {t('governance.iso.iso27001Label')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('governance.iso.iso27001Desc')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border bg-muted/10 p-3">
                      <Checkbox
                        id="iso-42001"
                        checked={iso42001}
                        onCheckedChange={(checked) =>
                          setIso42001(checked === true)
                        }
                      />
                      <div>
                        <Label
                          htmlFor="iso-42001"
                          className="cursor-pointer text-sm font-medium"
                        >
                          {t('governance.iso.iso42001Label')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('governance.iso.iso42001Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FeatureGate>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advanced" className="rounded-lg border px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Erweiterte Steuerung & Zugangscodes
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-md border p-4">
                <Checkbox
                  id="gs-disclosure"
                  checked={publicDisclosure}
                  onCheckedChange={(checked) =>
                    setPublicDisclosure(checked === true)
                  }
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="gs-disclosure"
                    className="text-sm font-medium leading-none"
                  >
                    {t('governance.publicDisclosure.title')}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('governance.publicDisclosure.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-sm font-medium">
                  {t('governance.accessCodes.title')}
                </div>
                <AccessCodeManager registerId={register.registerId} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
