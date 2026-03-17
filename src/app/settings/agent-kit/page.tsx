'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useUserProfile, type WorkspaceMembership } from '@/hooks/use-user-profile';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
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
  workspaces: WorkspaceMembership[];
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'unbekannt';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'unbekannt';
  }

  return parsed.toLocaleString('de-DE', {
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
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const scopedHrefs = useScopedRouteHrefs();
  const workspaceScope = useWorkspaceScope();

  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceMembership[]>([]);
  const [keys, setKeys] = useState<AgentKitApiKeyRow[]>([]);
  const [registers, setRegisters] = useState<AgentKitRegisterOption[]>([]);
  const [submitEndpoint, setSubmitEndpoint] = useState('/api/agent-kit/submit');
  const [resolvedWorkspaceName, setResolvedWorkspaceName] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [latestApiKey, setLatestApiKey] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const currentWorkspaceId = getActiveWorkspaceId();
    const fallbackWorkspaceId =
      workspaceScope ??
      currentWorkspaceId ??
      profile.workspaces?.[0]?.orgId ??
      profile.workspaceOrgIds?.[0] ??
      null;
    setWorkspaceIdState(fallbackWorkspaceId);
  }, [profile, workspaceScope]);

  const legacyWorkspaces = useMemo(() => {
    const knownMemberships = profile?.workspaces ?? [];
    const fallbackIds = profile?.workspaceOrgIds ?? [];
    const options = new Map<string, WorkspaceMembership>();

    for (const workspace of knownMemberships) {
      if (!workspace?.orgId) {
        continue;
      }
      options.set(workspace.orgId, workspace);
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
      });
    }

    if (workspaceId && !options.has(workspaceId)) {
      options.set(workspaceId, {
        orgId: workspaceId,
        orgName: resolvedWorkspaceName ?? workspaceId,
        role: profile?.workspaceRolesByOrg?.[workspaceId] ?? 'MEMBER',
      });
    }

    return Array.from(options.values());
  }, [
    profile?.workspaceOrgIds,
    profile?.workspaceRolesByOrg,
    profile?.workspaces,
    resolvedWorkspaceName,
    workspaceId,
  ]);

  const workspaces = useMemo(() => {
    const options = new Map<string, WorkspaceMembership>();

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
          : 'Agent-Kit-Daten konnten nicht geladen werden.',
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, workspaceId]);

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      return;
    }

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
    }
  }, [authFetch, user, workspaceScope]);

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

    return `Use the local ki-register-agent-kit CLI in this repository. If there is no onboarding yet, run onboarding first. Document this new AI use case, ask for missing facts, show me the summary before writing, and after my confirmation submit the manifest to KI-Register register ${selectedRegister.registerId}.`;
  }, [selectedRegister]);

  const handleWorkspaceChange = (nextWorkspaceId: string) => {
    setWorkspaceIdState(nextWorkspaceId);
    setActiveWorkspaceId(nextWorkspaceId);
    setLatestApiKey(null);
  };

  const copyToClipboard = async (value: string, labelText: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${labelText} kopiert`,
        description: 'Sie koennen den Inhalt jetzt direkt weiterverwenden.',
      });
    } catch (copyError) {
      console.error(`Failed to copy ${labelText}`, copyError);
      toast({
        variant: 'destructive',
        title: 'Kopieren fehlgeschlagen',
        description: 'Bitte den Text manuell markieren und kopieren.',
      });
    }
  };

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
        title: 'API-Key erstellt',
        description:
          'Der volle Key wird nur jetzt angezeigt. Danach bleibt nur die Vorschau sichtbar.',
      });
    } catch (createError) {
      console.error('Failed to create Agent Kit key', createError);
      toast({
        variant: 'destructive',
        title: 'API-Key konnte nicht erstellt werden',
        description:
          createError instanceof Error ? createError.message : 'Bitte erneut versuchen.',
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
        title: 'API-Key widerrufen',
        description: 'Neue Einreichungen mit diesem Key sind jetzt blockiert.',
      });
    } catch (revokeError) {
      console.error('Failed to revoke Agent Kit key', revokeError);
      toast({
        variant: 'destructive',
        title: 'API-Key konnte nicht widerrufen werden',
        description:
          revokeError instanceof Error ? revokeError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (loading || profileLoading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="Agent Kit API Keys"
        description="Direkte Agent-Kit-Einreichungen ins KI-Register werden vorbereitet."
        nextStep="Wir laden Workspace und API-Key-Daten."
        width="6xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title="API-Key-Bereich wird geladen"
          description="Workspace, Register und bestehende Keys werden vorbereitet."
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
      title="Agent Kit API Keys"
      description="Der klare Ort für persönliche Agent-Kit-API-Keys, Ziel-Register und copy-paste-fertige Einreichungsbefehle."
      nextStep="Erstellen Sie zuerst einen persönlichen Key und geben Sie ihn nur an den technischen Agent-Workflow weiter."
      width="6xl"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={scopedHrefs.settings}>Zurück zu Settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/developers/agent-kit">Öffentliche API-Doku</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error ? (
          <PageStatePanel
            tone="error"
            title="API-Key-Bereich konnte nicht geladen werden"
            description={error}
            actions={
              <Button variant="outline" onClick={() => void loadData()} disabled={isLoadingData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Neu laden
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
                <CardDescription>Aktiver Workspace</CardDescription>
              <CardTitle className="text-2xl">
                {selectedWorkspace?.orgName ?? resolvedWorkspaceName ?? 'Nicht gewählt'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={workspaceId ?? undefined}
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Workspace wählen" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace: WorkspaceMembership) => (
                    <SelectItem key={workspace.orgId} value={workspace.orgId}>
                      {workspace.orgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workspaces.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Falls hier nichts erscheint, gibt es meist nur persoenliche Register.
                  Agent-Kit-Keys werden pro Workspace angelegt.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Verknüpfte Register</CardDescription>
              <CardTitle className="text-2xl">{registers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Nur verknüpfte Register können direkte Agent-Kit-Einreichungen aufnehmen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Endpoint</CardDescription>
              <CardTitle className="text-base break-all">{absoluteSubmitEndpoint}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Dieser Endpoint wird von `studio-agent submit` genutzt.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Persönlichen API-Key erstellen
            </CardTitle>
            <CardDescription>
              Technische Teams richten das einmal ein. Teamleads brauchen später nur den sichtbaren Fall im KI-Register.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 xl:grid-cols-[1.2fr_260px_auto]">
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Zum Beispiel: Codex auf MacBook Pro"
              />
              <Select
                value={selectedRegisterId ?? undefined}
                onValueChange={(value) => setSelectedRegisterId(value)}
                disabled={registers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ziel-Register wählen" />
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
                API-Key erstellen
              </Button>
            </div>

            {latestApiKey ? (
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Neuer API-Key</div>
                    <p className="mt-1 text-sm text-slate-300">
                      Der volle Key wird nur jetzt gezeigt.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => void copyToClipboard(latestApiKey, 'API-Key')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Key kopieren
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
                    <div className="text-sm font-medium text-slate-900">Copy-paste-Befehl</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Für Codex, Claude Code, CI oder Shell-basierte Agenten.
                    </div>
                  </div>
                  {commandSnippet ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyToClipboard(commandSnippet, 'Befehl')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Kopieren
                    </Button>
                  ) : null}
                </div>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                  <code>{commandSnippet ?? 'Verknüpfen Sie zuerst ein Register.'}</code>
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Beispiel-Prompt</div>
                    <div className="mt-1 text-sm text-slate-600">
                      So versteht ein Agent direkt den vollständigen Ablauf.
                    </div>
                  </div>
                  {promptSnippet ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyToClipboard(promptSnippet, 'Prompt')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Kopieren
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {promptSnippet ?? 'Verknüpfen Sie zuerst ein Register.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestehende Keys</CardTitle>
            <CardDescription>
              Jede Person sollte ihren eigenen Key verwenden. Widerruf blockiert neue Einreichungen sofort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Erstellt von</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Zuletzt genutzt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      Noch kein Agent-Kit-API-Key für diesen Workspace angelegt.
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
                      <TableCell>{formatDate(key.createdAt)}</TableCell>
                      <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            key.revokedAt
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          }
                        >
                          {key.revokedAt ? 'widerrufen' : 'aktiv'}
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
                          Widerrufen
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
                Öffentlich erklärt
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Die schöne öffentliche API-Doku liegt auf der Website.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Dort stehen Endpoint, Request/Response-Beispiele, cURL und die Erklärung für nicht-technische Stakeholder.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/developers/agent-kit">
                  Öffentliche API-Doku
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={scopedHrefs.controlEnterprise}>Organisation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SignedInAreaFrame>
  );
}
