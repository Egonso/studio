'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowUpRight,
  FileText,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { PageStatePanel, ProtectedAreaGate, SignedInAreaFrame } from '@/components/product-shells';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  getAgentAccessSettingsSummary,
  getAgentActionPolicy,
} from '@/lib/agent-ready-distribution';
import { buildLocalizedLoginPath } from '@/lib/auth/login-routing';
import { localizeHref } from '@/lib/i18n/localize-href';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';

function getAgentAccessCopy(locale: string) {
  if (locale === 'de') {
    return {
      loadingTitle: 'Agentenzugriff',
      loadingDescription:
        'Die agentenlesbaren Produkt- und Nachweisflächen werden geladen.',
      loadingPanelTitle: 'Agentenzugriff wird geladen',
      loadingPanelDescription:
        'Öffentliche Discovery, Demo-Artefakte und Policy-Grenzen werden vorbereitet.',
      signedOutTitle: 'Anmeldung erforderlich',
      signedOutDescription:
        'Agentenzugriff ist eine Organisationseinstellung. Melden Sie sich an, um diesen Bereich zu öffnen.',
      signIn: 'Anmelden',
      title: 'Agentenzugriff',
      description:
        'Öffentliche Agentenflächen, Demo-Artefakte und Freigabegrenzen an einem Ort.',
      nextStep:
        'Prüfen Sie, welche Flächen öffentlich lesbar sind und welche Aktionen weiter menschliche Freigabe brauchen.',
      backToSettings: 'Zurück zu Einstellungen',
      agentKitKeys: 'Agent-Kit-Keys',
      publicDiscoveryTitle: 'Öffentliche Discovery',
      publicDiscoveryDesc:
        'Diese Endpunkte enthalten Produkt-, Demo- und Policy-Informationen, aber keine Workspace-Daten.',
      demoTitle: 'Demo-Artefakte',
      demoDesc:
        'Kuratierte Beispieldaten zeigen Registerlogik und Exportstruktur, ohne echte Organisationen zu lesen.',
      actionPolicyTitle: 'Aktionsgrenzen',
      actionPolicyDesc:
        'Jede agentische Aktion ist read-only, freigabepflichtig oder blockiert.',
      auditTitle: 'Audit-Auszug',
      auditDesc:
        'Demo- und Dossier-Aktivität ist für Nachweiszwecke vorbereitet, ohne Secrets oder Workspace-Daten.',
      active: 'aktiv',
      prepared: 'vorbereitet',
      noWorkspaceData: 'keine Workspace-Daten',
      sampleUseCases: 'Beispiel-Einsatzfälle',
      readOnly: 'read-only',
      approvalRequired: 'Freigabe erforderlich',
      blocked: 'blockiert',
      openEndpoint: 'Endpunkt öffnen',
      endpoint: 'Endpunkt',
      policyClass: 'Klasse',
      action: 'Aktion',
    };
  }

  return {
    loadingTitle: 'Agent access',
    loadingDescription:
      'Loading agent-readable product and evidence surfaces.',
    loadingPanelTitle: 'Loading agent access',
    loadingPanelDescription:
      'Public discovery, demo artifacts and policy boundaries are being prepared.',
    signedOutTitle: 'Sign-in required',
    signedOutDescription:
      'Agent access is an organisation setting. Sign in to open this area.',
    signIn: 'Sign in',
    title: 'Agent access',
    description:
      'Public agent surfaces, demo artifacts and approval boundaries in one place.',
    nextStep:
      'Review which surfaces are publicly readable and which actions still require human approval.',
    backToSettings: 'Back to settings',
    agentKitKeys: 'Agent Kit keys',
    publicDiscoveryTitle: 'Public discovery',
    publicDiscoveryDesc:
      'These endpoints contain product, demo and policy information, but no workspace data.',
    demoTitle: 'Demo artifacts',
    demoDesc:
      'Curated sample data shows register logic and export structure without reading real organisations.',
    actionPolicyTitle: 'Action boundaries',
    actionPolicyDesc:
      'Every agentic action is read-only, approval-required or blocked.',
    auditTitle: 'Audit export',
    auditDesc:
      'Demo and dossier activity is prepared for evidence without secrets or workspace data.',
    active: 'active',
    prepared: 'prepared',
    noWorkspaceData: 'no workspace data',
    sampleUseCases: 'sample use cases',
    readOnly: 'read-only',
    approvalRequired: 'approval required',
    blocked: 'blocked',
    openEndpoint: 'Open endpoint',
    endpoint: 'Endpoint',
    policyClass: 'Class',
    action: 'Action',
  };
}

function StatusLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="text-slate-600">{label}</span>
      <span className="inline-flex items-center gap-2 font-medium text-slate-950">
        <span className="h-2 w-2 rounded-full bg-slate-500" />
        {value}
      </span>
    </div>
  );
}

function EndpointList({
  endpoints,
  openLabel,
}: {
  endpoints: string[];
  openLabel: string;
}) {
  return (
    <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
      {endpoints.map((endpoint) => (
        <div
          key={endpoint}
          className="flex flex-col gap-2 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <code className="break-all text-xs text-slate-700">{endpoint}</code>
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href={endpoint}>
              <ArrowUpRight className="h-4 w-4" />
              {openLabel}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function AgentAccessSettingsPage() {
  const locale = useLocale();
  const { user, loading } = useAuth();
  const workspaceScope = useWorkspaceScope();
  const copy = getAgentAccessCopy(locale);
  const settingsHref = localizeHref(
    locale,
    appendWorkspaceScope('/settings', workspaceScope),
  );
  const agentKitHref = localizeHref(
    locale,
    appendWorkspaceScope('/settings/agent-kit', workspaceScope),
  );
  const returnToHref = localizeHref(
    locale,
    appendWorkspaceScope('/settings/agent-access', workspaceScope),
  );
  const summary = getAgentAccessSettingsSummary();
  const actionPolicy = getAgentActionPolicy();

  if (loading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title={copy.loadingTitle}
        description={copy.loadingDescription}
        nextStep={copy.loadingPanelDescription}
        width="5xl"
      >
        <PageStatePanel
          title={copy.loadingPanelTitle}
          description={copy.loadingPanelDescription}
          tone="loading"
          icon={Loader2}
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return (
      <ProtectedAreaGate
        area="signed_in_free_register"
        title={copy.signedOutTitle}
        description={copy.signedOutDescription}
        signInHref={buildLocalizedLoginPath(locale, {
          mode: 'login',
          returnTo: returnToHref,
        })}
        signInLabel={copy.signIn}
        width="5xl"
      />
    );
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title={copy.title}
      description={copy.description}
      nextStep={copy.nextStep}
      width="5xl"
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={settingsHref}>{copy.backToSettings}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={agentKitHref}>
              <KeyRound className="h-4 w-4" />
              {copy.agentKitKeys}
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <ShieldCheck className="h-5 w-5 text-slate-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-950">
                  {copy.publicDiscoveryTitle}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {copy.publicDiscoveryDesc}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <StatusLine label="Status" value={copy.active} />
              <StatusLine
                label="Datenumfang"
                value={copy.noWorkspaceData}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-950">
                  {copy.demoTitle}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {copy.demoDesc}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <StatusLine
                label={copy.sampleUseCases}
                value={String(summary.demoArtifacts.sampleUseCaseCount)}
              />
              <StatusLine
                label="Datenumfang"
                value={copy.noWorkspaceData}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.endpoint}
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {copy.publicDiscoveryDesc}
            </p>
          </div>
          <EndpointList
            endpoints={summary.publicDiscovery.endpoints}
            openLabel={copy.openEndpoint}
          />
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.actionPolicyTitle}
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {copy.actionPolicyDesc}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatusLine
              label={copy.readOnly}
              value={String(summary.actionPolicy.readOnlyCount)}
            />
            <StatusLine
              label={copy.approvalRequired}
              value={String(summary.actionPolicy.approvalRequiredCount)}
            />
            <StatusLine
              label={copy.blocked}
              value={String(summary.actionPolicy.blockedCount)}
            />
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">{copy.action}</th>
                  <th className="px-3 py-3">{copy.policyClass}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionPolicy.actions.map((entry) => (
                  <tr key={entry.action}>
                    <td className="px-3 py-3 text-slate-700">
                      {entry.label}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-950">
                      {entry.classification === 'approval_required'
                        ? copy.approvalRequired
                        : entry.classification === 'blocked'
                          ? copy.blocked
                          : copy.readOnly}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.auditTitle}
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {copy.auditDesc}
            </p>
          </div>
          <div className="mt-5">
            <StatusLine label="Status" value={copy.prepared} />
            <StatusLine
              label={copy.endpoint}
              value={summary.audit.exportEndpoint}
            />
          </div>
        </section>
      </div>
    </SignedInAreaFrame>
  );
}
