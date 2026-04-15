'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowUpRight,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { AgentKitScopeOption } from '@/lib/agent-kit/scope-options';
import { localizeHref } from '@/lib/i18n/localize-href';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import { buildScopedRegisterHref } from '@/lib/navigation/workspace-scope';
import { getActiveWorkspaceId, setActiveWorkspaceId } from '@/lib/workspace-session';

interface AgentKitApiKeyRow {
  keyId: string;
  orgId: string;
  label: string;
  keyPreview: string;
  createdAt: string;
  createdByUserId: string;
  createdByEmail?: string | null;
  lastUsedAt?: string | null;
  lastSubmittedUseCaseId?: string | null;
  revokedAt?: string | null;
}

interface AgentKitRegisterOption {
  registerId: string;
  name: string;
  ownerId: string;
}

interface WorkspaceAgentKitKeysResponse {
  actorRole: string;
  keys: AgentKitApiKeyRow[];
  registers: AgentKitRegisterOption[];
  submitEndpoint: string;
  workspace?: {
    orgId: string;
    name: string;
  } | null;
}

interface WorkspaceListResponse {
  workspaces: AgentKitScopeOption[];
}

function getAgentKitSettingsCopy(locale: string) {
  if (locale === 'de') {
    return {
      unknown: 'unbekannt',
      loadDataFallback: 'Agent-Kit-Daten konnten nicht geladen werden.',
      loadWorkspacesFallback: 'Bereiche konnten nicht geladen werden.',
      promptSnippet: (registerId: string) =>
        `Nutze die lokale ki-register-agent-kit CLI in diesem Repository. Falls noch kein Onboarding vorhanden ist, führe zuerst das Onboarding durch. Dokumentiere diesen neuen KI-Einsatzfall, frage fehlende Fakten nach, zeige mir die Zusammenfassung vor dem Schreiben und reiche das Manifest nach meiner Bestätigung in KI Register Register ${registerId} ein.`,
      copiedTitle: (labelText: string) => `${labelText} kopiert`,
      copiedDesc: 'Sie können den Inhalt jetzt direkt weiterverwenden.',
      copyFailedTitle: 'Kopieren fehlgeschlagen',
      copyFailedDesc: 'Bitte den Text manuell markieren und kopieren.',
      createSuccessTitle: 'API-Key erstellt',
      createSuccessDesc:
        'Der volle Key wird nur jetzt angezeigt. Danach bleibt nur die Vorschau sichtbar.',
      createErrorTitle: 'API-Key konnte nicht erstellt werden',
      tryAgain: 'Bitte erneut versuchen.',
      revokeSuccessTitle: 'API-Key widerrufen',
      revokeSuccessDesc: 'Neue Einreichungen mit diesem Key sind jetzt blockiert.',
      revokeErrorTitle: 'API-Key konnte nicht widerrufen werden',
      loadingTitle: 'Agent Kit API Keys',
      loadingDescription:
        'Direkte Agent-Kit-Einreichungen ins KI Register werden vorbereitet.',
      loadingNextStep: 'Wir laden Workspace- und API-Key-Daten.',
      loadingPanelTitle: 'API-Key-Bereich wird geladen',
      loadingPanelDescription:
        'Workspace, Register und bestehende Keys werden vorbereitet.',
      title: 'Agent Kit API Keys',
      description:
        'Der klare Ort für scoped Agent-Kit-API-Keys, Ziel-Register und copy-paste-fertige Einreichungsbefehle.',
      nextStep:
        'Erstellen Sie zuerst einen scoped Key und geben Sie ihn nur an den technischen Agent-Workflow weiter.',
      backToSettings: 'Zurück zu Einstellungen',
      publicDocs: 'Öffentliche API-Doku',
      errorPanelTitle: 'API-Key-Bereich konnte nicht geladen werden',
      reload: 'Neu laden',
      activeScope: 'Aktiver Bereich',
      scopePlaceholder: 'Bereich wählen',
      scopeReload: 'Bereiche erneut laden',
      scopeMissing:
        'Falls hier nichts erscheint, gibt es weder einen Workspace noch ein persönliches Register in diesem Account.',
      notSelected: 'Nicht gewählt',
      linkedRegisters: 'Verknüpfte Register',
      linkedRegistersDesc:
        'Nur verknüpfte Register können direkte Agent-Kit-Einreichungen aufnehmen.',
      noPersonalRegister:
        'Für Mein Register gibt es noch kein Register. Legen Sie zuerst ein Register an, dann erscheint es hier als Ziel für Ihren API-Key.',
      noWorkspaceRegister:
        'Für diesen Workspace gibt es noch kein verknüpftes Register. Öffnen Sie zuerst den passenden Bereich und richten Sie dort ein Register ein oder verknüpfen Sie es.',
      openRegister: 'Register öffnen',
      endpoint: 'Endpoint',
      endpointDesc: 'Dieser Endpoint wird von `studio-agent submit` genutzt.',
      createKeyTitle: 'Scoped API-Key erstellen',
      createKeyDesc:
        'Technische Teams richten das einmal ein. Teamleads brauchen später nur den sichtbaren Fall im KI Register.',
      labelPlaceholder: 'Zum Beispiel: Codex auf MacBook Pro',
      targetRegisterPlaceholder: 'Ziel-Register wählen',
      createKey: 'API-Key erstellen',
      newApiKey: 'Neuer API-Key',
      newApiKeyDesc: 'Der volle Key wird nur jetzt gezeigt.',
      copyKey: 'Key kopieren',
      commandTitle: 'Copy-paste-Befehl',
      commandDesc: 'Für Codex, Claude Code, CI oder Shell-basierte Agenten.',
      promptTitle: 'Beispiel-Prompt',
      promptDesc: 'So versteht ein Agent direkt den vollständigen Ablauf.',
      copy: 'Kopieren',
      commandEmpty: 'Verknüpfen Sie zuerst ein Register.',
      promptEmpty: 'Verknüpfen Sie zuerst ein Register.',
      existingKeys: 'Bestehende Keys',
      existingKeysDesc:
        'Jede Person sollte ihren eigenen Key verwenden. Widerruf blockiert neue Einreichungen sofort.',
      keyLabel: 'Label',
      createdBy: 'Erstellt von',
      createdAt: 'Erstellt am',
      lastUsedAt: 'Zuletzt genutzt',
      status: 'Status',
      action: 'Aktion',
      noKeys: 'Noch kein Agent-Kit-API-Key für diesen Workspace angelegt.',
      revoked: 'widerrufen',
      active: 'aktiv',
      revoke: 'Widerrufen',
      publicKicker: 'Öffentlich erklärt',
      publicTitle: 'Die öffentliche API-Doku liegt auf der Website.',
      publicDesc:
        'Dort stehen Endpoint, Request/Response-Beispiele, cURL und die Erklärung für nicht-technische Stakeholder.',
      organisation: 'Organisation',
    };
  }

  return {
    unknown: 'unknown',
    loadDataFallback: 'Agent Kit data could not be loaded.',
    loadWorkspacesFallback: 'Scopes could not be loaded.',
    promptSnippet: (registerId: string) =>
      `Use the local ki-register-agent-kit CLI in this repository. If there is no onboarding yet, run onboarding first. Document this new AI use case, ask for missing facts, show me the summary before writing, and after my confirmation submit the manifest into AI Registry register ${registerId}.`,
    copiedTitle: (labelText: string) => `${labelText} copied`,
    copiedDesc: 'You can use the content directly now.',
    copyFailedTitle: 'Copy failed',
    copyFailedDesc: 'Please select and copy the text manually.',
    createSuccessTitle: 'API key created',
    createSuccessDesc:
      'The full key is only shown now. After that, only the preview remains visible.',
    createErrorTitle: 'API key could not be created',
    tryAgain: 'Please try again.',
    revokeSuccessTitle: 'API key revoked',
    revokeSuccessDesc: 'New submissions with this key are now blocked.',
    revokeErrorTitle: 'API key could not be revoked',
    loadingTitle: 'Agent Kit API keys',
    loadingDescription: 'Preparing direct Agent Kit submissions into AI Registry.',
    loadingNextStep: 'We are loading workspace and API key data.',
    loadingPanelTitle: 'Loading API key area',
    loadingPanelDescription:
      'Workspace, register and existing keys are being prepared.',
    title: 'Agent Kit API keys',
    description:
      'The clear place for scoped Agent Kit API keys, target registers and ready-to-paste submission commands.',
    nextStep:
      'Create a scoped key first and share it only with the technical agent workflow.',
    backToSettings: 'Back to settings',
    publicDocs: 'Public API docs',
    errorPanelTitle: 'API key area could not be loaded',
    reload: 'Reload',
    activeScope: 'Active scope',
    scopePlaceholder: 'Choose scope',
    scopeReload: 'Reload scopes',
    scopeMissing:
      'If nothing appears here, there is neither a workspace nor a personal register in this account.',
    notSelected: 'Not selected',
    linkedRegisters: 'Linked registers',
    linkedRegistersDesc:
      'Only linked registers can receive direct Agent Kit submissions.',
    noPersonalRegister:
      'There is no register for My Register yet. Create a register first and it will appear here as the target for your API key.',
    noWorkspaceRegister:
      'There is no linked register for this workspace yet. Open the matching area first and create or link a register there.',
    openRegister: 'Open register',
    endpoint: 'Endpoint',
    endpointDesc: 'This endpoint is used by `studio-agent submit`.',
    createKeyTitle: 'Create scoped API key',
    createKeyDesc:
      'Technical teams set this up once. Later, team leads only need the visible use case inside AI Registry.',
    labelPlaceholder: 'For example: Codex on MacBook Pro',
    targetRegisterPlaceholder: 'Choose target register',
    createKey: 'Create API key',
    newApiKey: 'New API key',
    newApiKeyDesc: 'The full key is only shown now.',
    copyKey: 'Copy key',
    commandTitle: 'Copy-paste command',
    commandDesc: 'For Codex, Claude Code, CI or shell-based agents.',
    promptTitle: 'Example prompt',
    promptDesc: 'This gives an agent the full flow immediately.',
    copy: 'Copy',
    commandEmpty: 'Link a register first.',
    promptEmpty: 'Link a register first.',
    existingKeys: 'Existing keys',
    existingKeysDesc:
      'Each person should use their own key. Revoking blocks new submissions immediately.',
    keyLabel: 'Label',
    createdBy: 'Created by',
    createdAt: 'Created at',
    lastUsedAt: 'Last used',
    status: 'Status',
    action: 'Action',
    noKeys: 'No Agent Kit API key has been created for this workspace yet.',
    revoked: 'revoked',
    active: 'active',
    revoke: 'Revoke',
    publicKicker: 'Public docs',
    publicTitle: 'The public API docs live on the website.',
    publicDesc:
      'That page contains the endpoint, request/response examples, cURL and the explanation for non-technical stakeholders.',
    organisation: 'Organisation',
  };
}

function formatDate(value: string | null | undefined, locale: string, unknownLabel: string): string {
  if (!value) {
    return unknownLabel;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return unknownLabel;
  }

  return parsed.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (typeof window !== 'undefined') {
    return new URL(value, window.location.origin).toString();
  }

  return value;
}

export default function AgentKitSettingsPage() {
  const locale = useLocale();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const scopedHrefs = useScopedRouteHrefs();
  const workspaceScope = useWorkspaceScope();
  const copy = getAgentKitSettingsCopy(locale);
  const developersAgentKitHref = localizeHref(locale, '/developers/agent-kit');

  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [workspaceOptions, setWorkspaceOptions] = useState<AgentKitScopeOption[]>([]);
  const [keys, setKeys] = useState<AgentKitApiKeyRow[]>([]);
  const [registers, setRegisters] = useState<AgentKitRegisterOption[]>([]);
  const [submitEndpoint, setSubmitEndpoint] = useState('/api/agent-kit/submit');
  const [resolvedWorkspaceName, setResolvedWorkspaceName] = useState<string | null>(null);
  const [workspaceOptionsError, setWorkspaceOptionsError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [latestApiKey, setLatestApiKey] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(localizeHref(locale, '/login'));
    }
  }, [loading, locale, router, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setWorkspaceIdState((current) => {
      if (current) {
        return current;
      }

      const currentWorkspaceId = getActiveWorkspaceId();
      return (
        workspaceScope ??
        currentWorkspaceId ??
        profile.workspaces?.[0]?.orgId ??
        profile.workspaceOrgIds?.[0] ??
        null
      );
    });
  }, [profile, user?.uid, workspaceScope]);

  const legacyWorkspaces = useMemo(() => {
    const knownMemberships = profile?.workspaces ?? [];
    const fallbackIds = profile?.workspaceOrgIds ?? [];
    const options = new Map<string, AgentKitScopeOption>();

    for (const workspace of knownMemberships) {
      if (!workspace?.orgId) {
        continue;
      }
      options.set(workspace.orgId, {
        orgId: workspace.orgId,
        orgName: workspace.orgName,
        role: workspace.role,
        scopeType: workspace.orgId === user?.uid ? 'personal' : 'workspace',
      });
    }

    for (const orgId of fallbackIds) {
      if (!orgId || options.has(orgId)) {
        continue;
      }
      options.set(orgId, {
        orgId,
        orgName:
          orgId === workspaceId && resolvedWorkspaceName
            ? resolvedWorkspaceName
            : orgId,
        role: profile?.workspaceRolesByOrg?.[orgId] ?? 'MEMBER',
        scopeType: orgId === user?.uid ? 'personal' : 'workspace',
      });
    }

    if (workspaceId && !options.has(workspaceId)) {
      options.set(workspaceId, {
        orgId: workspaceId,
        orgName: resolvedWorkspaceName ?? workspaceId,
        role: profile?.workspaceRolesByOrg?.[workspaceId] ?? 'MEMBER',
        scopeType: workspaceId === user?.uid ? 'personal' : 'workspace',
      });
    }

    return Array.from(options.values());
  }, [
    profile?.workspaceOrgIds,
    profile?.workspaceRolesByOrg,
    profile?.workspaces,
    resolvedWorkspaceName,
    user?.uid,
    workspaceId,
  ]);

  const workspaces = useMemo(() => {
    const options = new Map<string, AgentKitScopeOption>();

    for (const workspace of workspaceOptions) {
      options.set(workspace.orgId, workspace);
    }

    for (const workspace of legacyWorkspaces) {
      if (!options.has(workspace.orgId)) {
        options.set(workspace.orgId, workspace);
      }
    }

    return Array.from(options.values());
  }, [legacyWorkspaces, workspaceOptions]);

  useEffect(() => {
    if (workspaceId || workspaces.length === 0) {
      return;
    }

    const preferredWorkspaceId =
      workspaceScope ??
      getActiveWorkspaceId() ??
      workspaces[0]?.orgId ??
      null;

    if (preferredWorkspaceId) {
      setWorkspaceIdState(preferredWorkspaceId);
    }
  }, [workspaceId, workspaceScope, workspaces]);

  useEffect(() => {
    const persistedWorkspaceId =
      workspaceId && workspaceId !== user?.uid ? workspaceId : null;
    setActiveWorkspaceId(persistedWorkspaceId);
  }, [user?.uid, workspaceId]);

  const authFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('UNAUTHENTICATED');
      }

      const response = await fetch(input, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? `Request failed with ${response.status}`);
      }

      return response;
    },
    [user],
  );

  const loadData = useCallback(async () => {
    if (!workspaceId) {
      setKeys([]);
      setRegisters([]);
      setResolvedWorkspaceName(null);
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const response = await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys`);
      const payload = (await response.json()) as WorkspaceAgentKitKeysResponse;
      setKeys(payload.keys);
      setRegisters(payload.registers);
      setSubmitEndpoint(payload.submitEndpoint);
      setResolvedWorkspaceName(payload.workspace?.name ?? payload.workspace?.orgId ?? null);
      setSelectedRegisterId((current) =>
        current && payload.registers.some((entry) => entry.registerId === current)
          ? current
          : (payload.registers[0]?.registerId ?? null),
      );
    } catch (loadError) {
      console.error('Failed to load Agent Kit keys', loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : copy.loadDataFallback,
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, copy.loadDataFallback, workspaceId]);

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      return;
    }

    setWorkspaceOptionsError(null);
    try {
      const response = await authFetch('/api/workspaces');
      const payload = (await response.json()) as WorkspaceListResponse;
      setWorkspaceOptions(payload.workspaces);
      setWorkspaceIdState((current) => {
        const scopedWorkspaceId = workspaceScope ?? getActiveWorkspaceId();

        if (
          scopedWorkspaceId &&
          payload.workspaces.some((workspace) => workspace.orgId === scopedWorkspaceId)
        ) {
          return scopedWorkspaceId;
        }

        if (
          current &&
          payload.workspaces.some((workspace) => workspace.orgId === current)
        ) {
          return current;
        }

        return payload.workspaces[0]?.orgId ?? current ?? null;
      });
    } catch (loadError) {
      console.error('Failed to load accessible workspaces', loadError);
      setWorkspaceOptionsError(
        loadError instanceof Error
          ? loadError.message
          : copy.loadWorkspacesFallback,
      );
    }
  }, [authFetch, copy.loadWorkspacesFallback, user, workspaceScope]);

  useEffect(() => {
    if (!loading && !profileLoading && user) {
      void loadWorkspaces();
    }
  }, [loadWorkspaces, loading, profileLoading, user]);

  useEffect(() => {
    if (!loading && !profileLoading && user && workspaceId) {
      void loadData();
    }
  }, [loadData, loading, profileLoading, user, workspaceId]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.orgId === workspaceId) ?? null,
    [workspaceId, workspaces],
  );
  const selectedRegister = useMemo(
    () => registers.find((register) => register.registerId === selectedRegisterId) ?? null,
    [registers, selectedRegisterId],
  );
  const absoluteSubmitEndpoint = useMemo(
    () => resolveAbsoluteUrl(submitEndpoint),
    [submitEndpoint],
  );
  const selectedScopeRegisterHref = useMemo(
    () =>
      localizeHref(
        locale,
        buildScopedRegisterHref(
          selectedWorkspace?.scopeType === 'personal'
            ? null
            : (selectedWorkspace?.orgId ?? null),
          { onboarding: true },
        ),
      ),
    [locale, selectedWorkspace],
  );
  const commandSnippet = useMemo(() => {
    if (!selectedRegister) {
      return null;
    }

    return [
      'export KI_REGISTER_API_KEY="<your-agent-kit-api-key>"',
      `export KI_REGISTER_REGISTER_ID="${selectedRegister.registerId}"`,
      `node ./agent-kit/bin/studio-agent.mjs submit ./docs/agent-workflows/<slug>/manifest.json --endpoint "${absoluteSubmitEndpoint}"`,
    ].join('\n');
  }, [absoluteSubmitEndpoint, selectedRegister]);
  const promptSnippet = useMemo(() => {
    if (!selectedRegister) {
      return null;
    }

    return copy.promptSnippet(selectedRegister.registerId);
  }, [copy, selectedRegister]);

  const handleWorkspaceChange = (nextWorkspaceId: string) => {
    setWorkspaceIdState(nextWorkspaceId);
    setLatestApiKey(null);
  };

  const copyToClipboard = useCallback(
    async (value: string, labelText: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast({
          title: copy.copiedTitle(labelText),
          description: copy.copiedDesc,
        });
      } catch (copyError) {
        console.error(`Failed to copy ${labelText}`, copyError);
        toast({
          variant: 'destructive',
          title: copy.copyFailedTitle,
          description: copy.copyFailedDesc,
        });
      }
    },
    [copy, toast],
  );

  const createKey = async () => {
    if (!workspaceId || !label.trim()) {
      return;
    }

    setBusyAction('create_key');
    try {
      const response = await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys`, {
        method: 'POST',
        body: JSON.stringify({ label: label.trim() }),
      });
      const payload = (await response.json()) as {
        apiKey: string;
      };
      setLatestApiKey(payload.apiKey);
      setLabel('');
      await loadData();
      toast({
        title: copy.createSuccessTitle,
        description: copy.createSuccessDesc,
      });
    } catch (createError) {
      console.error('Failed to create Agent Kit key', createError);
      toast({
        variant: 'destructive',
        title: copy.createErrorTitle,
        description:
          createError instanceof Error ? createError.message : copy.tryAgain,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`revoke_${keyId}`);
    try {
      await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys/${keyId}`, {
        method: 'DELETE',
      });
      if (latestApiKey?.includes(`.${keyId}.`)) {
        setLatestApiKey(null);
      }
      await loadData();
      toast({
        title: copy.revokeSuccessTitle,
        description: copy.revokeSuccessDesc,
      });
    } catch (revokeError) {
      console.error('Failed to revoke Agent Kit key', revokeError);
      toast({
        variant: 'destructive',
        title: copy.revokeErrorTitle,
        description:
          revokeError instanceof Error ? revokeError.message : copy.tryAgain,
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (loading || profileLoading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title={copy.loadingTitle}
        description={copy.loadingDescription}
        nextStep={copy.loadingNextStep}
        width="6xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title={copy.loadingPanelTitle}
          description={copy.loadingPanelDescription}
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title={copy.title}
      description={copy.description}
      nextStep={copy.nextStep}
      width="6xl"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={scopedHrefs.settings}>{copy.backToSettings}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={developersAgentKitHref}>{copy.publicDocs}</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error ? (
          <PageStatePanel
            tone="error"
            title={copy.errorPanelTitle}
            description={error}
            actions={
              <Button variant="outline" onClick={() => void loadData()} disabled={isLoadingData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.reload}
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.activeScope}</CardDescription>
              <CardTitle className="text-2xl">
                {selectedWorkspace?.orgName ?? resolvedWorkspaceName ?? workspaces[0]?.orgName ?? copy.notSelected}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={workspaceId ?? undefined}
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.scopePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.orgId} value={workspace.orgId}>
                      {workspace.orgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workspaceOptionsError ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>{workspaceOptionsError}</p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => void loadWorkspaces()}
                  >
                    {copy.scopeReload}
                  </Button>
                </div>
              ) : null}
              {workspaces.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {copy.scopeMissing}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.linkedRegisters}</CardDescription>
              <CardTitle className="text-2xl">{registers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                {copy.linkedRegistersDesc}
              </p>
              {workspaceId && registers.length === 0 ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p>
                    {selectedWorkspace?.scopeType === 'personal'
                      ? copy.noPersonalRegister
                      : copy.noWorkspaceRegister}
                  </p>
                  <Button asChild variant="outline" className="mt-3">
                    <Link href={selectedScopeRegisterHref}>{copy.openRegister}</Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.endpoint}</CardDescription>
              <CardTitle className="text-base break-all">{absoluteSubmitEndpoint}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">{copy.endpointDesc}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {copy.createKeyTitle}
            </CardTitle>
            <CardDescription>{copy.createKeyDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 xl:grid-cols-[1.2fr_260px_auto]">
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={copy.labelPlaceholder}
              />
              <Select
                value={selectedRegisterId ?? undefined}
                onValueChange={(value) => setSelectedRegisterId(value)}
                disabled={registers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.targetRegisterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((register) => (
                    <SelectItem key={register.registerId} value={register.registerId}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => void createKey()}
                disabled={
                  busyAction === 'create_key' ||
                  !label.trim() ||
                  registers.length === 0
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {copy.createKey}
              </Button>
            </div>

            {latestApiKey ? (
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{copy.newApiKey}</div>
                    <p className="mt-1 text-sm text-slate-300">{copy.newApiKeyDesc}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => void copyToClipboard(latestApiKey, copy.newApiKey)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copy.copyKey}
                  </Button>
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm">
                  {latestApiKey}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{copy.commandTitle}</div>
                    <div className="mt-1 text-sm text-slate-600">{copy.commandDesc}</div>
                  </div>
                  {commandSnippet ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyToClipboard(commandSnippet, copy.commandTitle)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copy.copy}
                    </Button>
                  ) : null}
                </div>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                  <code>{commandSnippet ?? copy.commandEmpty}</code>
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{copy.promptTitle}</div>
                    <div className="mt-1 text-sm text-slate-600">{copy.promptDesc}</div>
                  </div>
                  {promptSnippet ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyToClipboard(promptSnippet, copy.promptTitle)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copy.copy}
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {promptSnippet ?? copy.promptEmpty}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.existingKeys}</CardTitle>
            <CardDescription>{copy.existingKeysDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.keyLabel}</TableHead>
                  <TableHead>{copy.createdBy}</TableHead>
                  <TableHead>{copy.createdAt}</TableHead>
                  <TableHead>{copy.lastUsedAt}</TableHead>
                  <TableHead>{copy.status}</TableHead>
                  <TableHead>{copy.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      {copy.noKeys}
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.keyId}>
                      <TableCell>
                        <div className="font-medium">{key.label}</div>
                        <div className="text-xs text-muted-foreground">{key.keyPreview}</div>
                      </TableCell>
                      <TableCell>{key.createdByEmail ?? key.createdByUserId}</TableCell>
                      <TableCell>{formatDate(key.createdAt, locale, copy.unknown)}</TableCell>
                      <TableCell>{formatDate(key.lastUsedAt, locale, copy.unknown)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            key.revokedAt
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-gray-200 bg-gray-50 text-gray-800'
                          }
                        >
                          {key.revokedAt ? copy.revoked : copy.active}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void revokeKey(key.keyId)}
                          disabled={Boolean(key.revokedAt) || busyAction === `revoke_${key.keyId}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {copy.revoke}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-slate-900 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {copy.publicKicker}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {copy.publicTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{copy.publicDesc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={developersAgentKitHref}>
                  {copy.publicDocs}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={scopedHrefs.controlEnterprise}>{copy.organisation}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SignedInAreaFrame>
  );
}
