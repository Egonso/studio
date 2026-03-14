'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react';

import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import type { GovernanceSignOffRecord } from '@/lib/enterprise/governance-signoff';
import {
  getWorkspaceRoleLabel,
  type EnterpriseWorkspaceSettings,
  type WorkspaceMemberRecord,
  type WorkspaceRole,
  type WorkspaceWebhookConfig,
} from '@/lib/enterprise/workspace';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import type { ExternalSubmission } from '@/lib/register-first/types';
import { cn } from '@/lib/utils';
import { getActiveWorkspaceId } from '@/lib/workspace-session';

interface WorkspaceMembersResponse {
  workspace: {
    orgId: string;
    name: string;
    ownerUserId: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
  actorRole: WorkspaceRole;
  members: WorkspaceMemberRecord[];
  pendingInvites: Array<{
    inviteId: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>;
}

interface WorkspaceSettingsResponse {
  workspace: {
    orgId: string;
    name: string;
    ownerUserId: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
  settings: EnterpriseWorkspaceSettings;
}

interface WorkspaceExternalSubmissionRow extends ExternalSubmission {
  registerName?: string;
  organisationName?: string | null;
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

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function createHookDraft(eventType: WorkspaceWebhookConfig['eventType']): WorkspaceWebhookConfig {
  return {
    webhookId: `hook_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    eventType,
    url: '',
    enabled: true,
    secretLabel: null,
    createdAt: new Date().toISOString(),
    lastTriggeredAt: null,
  };
}

function getSubmissionStatusBadgeClass(status: ExternalSubmission['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'merged':
      return 'bg-slate-900 text-white border-slate-900';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function getSignOffStatusBadgeClass(status: GovernanceSignOffRecord['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function getSubmissionHeadline(submission: WorkspaceExternalSubmissionRow): string {
  const toolName = submission.rawPayloadSnapshot['toolName'];
  if (typeof toolName === 'string' && toolName.trim().length > 0) {
    return toolName;
  }

  const purpose = submission.rawPayloadSnapshot['purpose'];
  if (typeof purpose === 'string' && purpose.trim().length > 0) {
    return purpose;
  }

  return submission.submissionId;
}

export default function ControlEnterprisePage() {
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const scopedHrefs = useScopedRouteHrefs();
  const { toast } = useToast();
  const {
    allowed,
    loading: capabilityLoading,
  } = useCapability('multiOrgStructure');

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [actorRole, setActorRole] = useState<WorkspaceRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [pendingInvites, setPendingInvites] = useState<WorkspaceMembersResponse['pendingInvites']>([]);
  const [settingsDraft, setSettingsDraft] = useState<EnterpriseWorkspaceSettings | null>(null);
  const [signOffs, setSignOffs] = useState<GovernanceSignOffRecord[]>([]);
  const [submissions, setSubmissions] = useState<WorkspaceExternalSubmissionRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'REVIEWER' | 'MEMBER' | 'EXTERNAL_OFFICER'>('MEMBER');
  const [signOffSummary, setSignOffSummary] = useState('');
  const [newSubprocessor, setNewSubprocessor] = useState({
    name: '',
    region: '',
    purpose: '',
    url: '',
  });

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
    const fallbackWorkspaceId = profile.workspaces?.[0]?.orgId ?? null;
    setWorkspaceId(currentWorkspaceId ?? fallbackWorkspaceId);
  }, [profile]);

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

  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const [membersResponse, settingsResponse, signOffResponse, submissionResponse] =
        await Promise.all([
          authFetch(`/api/workspaces/${workspaceId}/members`),
          authFetch(`/api/workspaces/${workspaceId}/settings`),
          authFetch(`/api/workspaces/${workspaceId}/governance-signoffs`),
          authFetch(`/api/workspaces/${workspaceId}/external-submissions`),
        ]);

      const membersPayload =
        (await membersResponse.json()) as WorkspaceMembersResponse;
      const settingsPayload =
        (await settingsResponse.json()) as WorkspaceSettingsResponse;
      const signOffPayload = (await signOffResponse.json()) as {
        signOffs: GovernanceSignOffRecord[];
      };
      const submissionPayload = (await submissionResponse.json()) as {
        submissions: WorkspaceExternalSubmissionRow[];
      };

      setWorkspaceName(membersPayload.workspace.name);
      setActorRole(membersPayload.actorRole);
      setMembers(membersPayload.members);
      setPendingInvites(membersPayload.pendingInvites);
      setSettingsDraft(settingsPayload.settings);
      setSignOffs(signOffPayload.signOffs);
      setSubmissions(submissionPayload.submissions);
    } catch (loadError) {
      console.error('Failed to load enterprise workspace data', loadError);
      setError(
        'Organisationsdaten konnten nicht geladen werden. Bitte pruefen Sie das aktive Workspace-Kontext.',
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, workspaceId]);

  useEffect(() => {
    if (!loading && !capabilityLoading && user && workspaceId && allowed) {
      void loadWorkspaceData();
    }
  }, [
    allowed,
    capabilityLoading,
    loadWorkspaceData,
    loading,
    user,
    workspaceId,
  ]);

  const approvalPendingCount = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.status === 'submitted' ||
          submission.approvalWorkflow?.status === 'pending',
      ).length,
    [submissions],
  );

  const pendingSignOffCount = useMemo(
    () => signOffs.filter((signOff) => signOff.status === 'pending').length,
    [signOffs],
  );

  const canManageMembers =
    actorRole === 'OWNER' || actorRole === 'ADMIN';
  const canApprove =
    actorRole === 'OWNER' ||
    actorRole === 'ADMIN' ||
    actorRole === 'REVIEWER' ||
    actorRole === 'EXTERNAL_OFFICER';

  const updateSettingsDraft = (
    updater: (current: EnterpriseWorkspaceSettings) => EnterpriseWorkspaceSettings,
  ) => {
    setSettingsDraft((current) => (current ? updater(current) : current));
  };

  const saveSettings = async () => {
    if (!workspaceId || !settingsDraft) {
      return;
    }

    setBusyAction('save_settings');
    try {
      await authFetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settingsDraft),
      });
      toast({
        title: 'Organisationseinstellungen gespeichert',
        description:
          'Identity, Approvals, Retention, Webhooks und Procurement-Daten wurden aktualisiert.',
      });
      await loadWorkspaceData();
    } catch (saveError) {
      console.error('Failed to save enterprise settings', saveError);
      toast({
        variant: 'destructive',
        title: 'Speichern fehlgeschlagen',
        description:
          saveError instanceof Error ? saveError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const inviteMember = async () => {
    if (!workspaceId || !workspaceName || !inviteEmail.trim()) {
      return;
    }

    setBusyAction('invite_member');
    try {
      const response = await authFetch('/api/invites', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          targetOrgId: workspaceId,
          targetOrgName: workspaceName,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      toast({
        title: 'Einladung verarbeitet',
        description:
          payload.message ?? 'Das Workspace-Mitglied wurde eingeladen.',
      });
      setInviteEmail('');
      setInviteRole('MEMBER');
      await loadWorkspaceData();
    } catch (inviteError) {
      console.error('Failed to invite workspace member', inviteError);
      toast({
        variant: 'destructive',
        title: 'Einladung fehlgeschlagen',
        description:
          inviteError instanceof Error ? inviteError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const updateMemberRole = async (
    memberUserId: string,
    role: 'ADMIN' | 'REVIEWER' | 'MEMBER' | 'EXTERNAL_OFFICER',
  ) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`member_${memberUserId}`);
    try {
      await authFetch(`/api/workspaces/${workspaceId}/members/${memberUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await loadWorkspaceData();
    } catch (memberError) {
      console.error('Failed to update member role', memberError);
      toast({
        variant: 'destructive',
        title: 'Rolle konnte nicht aktualisiert werden',
        description:
          memberError instanceof Error ? memberError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const removeMember = async (memberUserId: string) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`remove_${memberUserId}`);
    try {
      await authFetch(`/api/workspaces/${workspaceId}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      await loadWorkspaceData();
    } catch (memberError) {
      console.error('Failed to remove workspace member', memberError);
      toast({
        variant: 'destructive',
        title: 'Mitglied konnte nicht entfernt werden',
        description:
          memberError instanceof Error ? memberError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const requestGovernanceSignOff = async () => {
    if (!workspaceId) {
      return;
    }

    setBusyAction('request_signoff');
    try {
      await authFetch(`/api/workspaces/${workspaceId}/governance-signoffs`, {
        method: 'POST',
        body: JSON.stringify({
          summary: normalizeOptionalText(signOffSummary) ?? undefined,
        }),
      });
      setSignOffSummary('');
      await loadWorkspaceData();
      toast({
        title: 'Governance-Sign-off angefordert',
        description:
          'Der aktuelle Organisationsstand wurde als formale Freigabe eingereicht.',
      });
    } catch (signOffError) {
      console.error('Failed to request governance sign-off', signOffError);
      toast({
        variant: 'destructive',
        title: 'Sign-off konnte nicht angefordert werden',
        description:
          signOffError instanceof Error
            ? signOffError.message
            : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const decideGovernanceSignOff = async (
    signOffId: string,
    decision: 'approved' | 'rejected',
  ) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`signoff_${signOffId}_${decision}`);
    try {
      await authFetch(
        `/api/workspaces/${workspaceId}/governance-signoffs/${signOffId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ decision }),
        },
      );
      await loadWorkspaceData();
    } catch (decisionError) {
      console.error('Failed to decide governance sign-off', decisionError);
      toast({
        variant: 'destructive',
        title: 'Sign-off konnte nicht entschieden werden',
        description:
          decisionError instanceof Error
            ? decisionError.message
            : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const reviewSubmission = async (
    submissionId: string,
    action: 'approve' | 'reject' | 'merge',
  ) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`submission_${submissionId}_${action}`);
    try {
      await authFetch(
        `/api/workspaces/${workspaceId}/external-submissions/${submissionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        },
      );
      await loadWorkspaceData();
    } catch (reviewError) {
      console.error('Failed to review workspace submission', reviewError);
      toast({
        variant: 'destructive',
        title: 'Einreichung konnte nicht aktualisiert werden',
        description:
          reviewError instanceof Error ? reviewError.message : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const dispatchReviewDueNotification = async () => {
    if (!workspaceId) {
      return;
    }

    setBusyAction('dispatch_review_due');
    try {
      await authFetch(`/api/workspaces/${workspaceId}/notifications/dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'review_due',
          data: {
            pendingExternalApprovals: approvalPendingCount,
            pendingGovernanceSignOffs: pendingSignOffCount,
          },
        }),
      });
      toast({
        title: 'Review-Hooks ausgeliefert',
        description:
          'Aktuelle Review-Faelligkeiten wurden an konfigurierte Webhooks gesendet.',
      });
    } catch (dispatchError) {
      console.error('Failed to dispatch review due notification', dispatchError);
      toast({
        variant: 'destructive',
        title: 'Review-Hooks fehlgeschlagen',
        description:
          dispatchError instanceof Error
            ? dispatchError.message
            : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const downloadAuditExport = async () => {
    if (!workspaceId) {
      return;
    }

    setBusyAction('download_audit_export');
    try {
      const response = await authFetch(`/api/workspaces/${workspaceId}/audit-export`);
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `immutable-audit-${workspaceId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Failed to download immutable audit export', downloadError);
      toast({
        variant: 'destructive',
        title: 'Audit-Export fehlgeschlagen',
        description:
          downloadError instanceof Error
            ? downloadError.message
            : 'Bitte erneut versuchen.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Organisation"
        description="Workspace-Administration, Beschaffung und formale Freigaben werden vorbereitet."
        nextStep="Wir laden Rollen, Settings und Freigabe-Queues."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Organisation wird geladen"
          description="Mitglieder, Identity, Approvals und Audit-Export werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Organisation"
      description={
        workspaceName
          ? `Organisationssteuerung fuer ${workspaceName}. Rollen, Beschaffung, Identity und Freigaben laufen hier zusammen.`
          : 'Organisationssteuerung fuer Rollen, Beschaffung, Identity und Freigaben.'
      }
      nextStep="Pflegen Sie zuerst Rollen, Approval-Policy und Procurement-Unterlagen fuer den aktiven Workspace."
    >
      <div className="space-y-6">
        {!allowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Dieser Bereich ist fuer den aktiven Arbeitsbereich nicht verfuegbar"
            description="Rollenmodell, SSO/SCIM, Procurement-Settings und formale Workspace-Freigaben werden in der Organisationssteuerung verwaltet."
            actions={
              <>
                <Button asChild>
                  <Link href={scopedHrefs.control}>Control Overview</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={scopedHrefs.controlExports}>Exports / Audit</Link>
                </Button>
              </>
            }
          />
        ) : !workspaceId ? (
          <PageStatePanel
            area="paid_governance_control"
            title="Kein Workspace ausgewaehlt"
            description="Waehlen Sie ueber den Workspace-Switcher einen Workspace aus, um Mitglieder und Einstellungen zu verwalten."
            actions={
              <Button asChild>
                <Link href={scopedHrefs.register}>Zum Register</Link>
              </Button>
            }
          />
        ) : (
          <>
            {isLoadingData && !settingsDraft && (
              <PageStatePanel
                tone="loading"
                area="paid_governance_control"
                title="Organisationsdaten werden geladen"
                description="Mitglieder, Settings, Sign-offs und externe Freigaben werden geladen."
              />
            )}

            {error && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title="Organisation konnte nicht geladen werden"
                description={error}
                actions={
                  <Button
                    variant="outline"
                    onClick={() => void loadWorkspaceData()}
                    disabled={isLoadingData}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Neu laden
                  </Button>
                }
              />
            )}

            {settingsDraft && (
              <>
                <div className="grid gap-4 lg:grid-cols-4">
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>Aktive Rolle</CardDescription>
                      <CardTitle className="text-2xl">
                        {actorRole ? getWorkspaceRoleLabel(actorRole) : 'Unbekannt'}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>Mitglieder</CardDescription>
                      <CardTitle className="text-2xl">{members.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>Freigaben offen</CardDescription>
                      <CardTitle className="text-2xl">{approvalPendingCount}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>Governance-Sign-offs offen</CardDescription>
                      <CardTitle className="text-2xl">{pendingSignOffCount}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Mitglieder und Rollen
                        </CardTitle>
                        <CardDescription>
                          Owner, Admin, Reviewer, Member und External Officer werden zentral im Workspace verwaltet.
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {pendingInvites.length} Einladungen offen
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="name@unternehmen.de"
                      />
                      <Select
                        value={inviteRole}
                        onValueChange={(value) =>
                          setInviteRole(
                            value as 'ADMIN' | 'REVIEWER' | 'MEMBER' | 'EXTERNAL_OFFICER',
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="REVIEWER">Reviewer</SelectItem>
                          <SelectItem value="EXTERNAL_OFFICER">External Officer</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => void inviteMember()}
                        disabled={!canManageMembers || busyAction === 'invite_member'}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Einladen
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Person</TableHead>
                          <TableHead>Rolle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quelle</TableHead>
                          <TableHead>Aktion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.userId}>
                            <TableCell>
                              <div className="font-medium">
                                {member.displayName || member.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={member.role === 'OWNER' ? 'ADMIN' : member.role}
                                onValueChange={(value) =>
                                  void updateMemberRole(
                                    member.userId,
                                    value as 'ADMIN' | 'REVIEWER' | 'MEMBER' | 'EXTERNAL_OFFICER',
                                  )
                                }
                                disabled={
                                  !canManageMembers ||
                                  member.role === 'OWNER' ||
                                  busyAction === `member_${member.userId}`
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                  <SelectItem value="REVIEWER">Reviewer</SelectItem>
                                  <SelectItem value="EXTERNAL_OFFICER">External Officer</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              {member.role === 'OWNER' ? (
                                <div className="pt-1 text-xs text-muted-foreground">
                                  Owner bleibt unveraenderlich.
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>{member.status}</TableCell>
                            <TableCell>{member.source}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void removeMember(member.userId)}
                                disabled={
                                  !canManageMembers ||
                                  member.role === 'OWNER' ||
                                  busyAction === `remove_${member.userId}`
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Entfernen
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {pendingInvites.length > 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          Ausstehende Einladungen
                        </div>
                        <div className="mt-2 space-y-2 text-sm text-slate-600">
                          {pendingInvites.map((invite) => (
                            <div
                              key={invite.inviteId}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span>{invite.email}</span>
                              <Badge variant="outline">{invite.role}</Badge>
                              <span>gueltig bis {formatDate(invite.expiresAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Identity, SCIM und Procurement
                    </CardTitle>
                    <CardDescription>
                      SSO/SAML/OIDC, SCIM-Provisioning, Retention, Webhooks und procurement-faehige Unterlagen an einer Stelle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Identity Provider Modus</Label>
                          <Select
                            value={settingsDraft.identityProvider.mode}
                            onValueChange={(value) =>
                              updateSettingsDraft((current) => ({
                                ...current,
                                identityProvider: {
                                  ...current.identityProvider,
                                  mode: value as EnterpriseWorkspaceSettings['identityProvider']['mode'],
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disabled">Deaktiviert</SelectItem>
                              <SelectItem value="saml">SAML</SelectItem>
                              <SelectItem value="oidc">OIDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Provider Name</Label>
                            <Input
                              value={settingsDraft.identityProvider.displayName ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  identityProvider: {
                                    ...current.identityProvider,
                                    displayName: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Microsoft Entra ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Metadata URL</Label>
                            <Input
                              value={settingsDraft.identityProvider.metadataUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  identityProvider: {
                                    ...current.identityProvider,
                                    metadataUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SSO URL / Issuer</Label>
                            <Input
                              value={settingsDraft.identityProvider.ssoUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  identityProvider: {
                                    ...current.identityProvider,
                                    ssoUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Groups Attribut</Label>
                            <Input
                              value={settingsDraft.identityProvider.groupsAttribute ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  identityProvider: {
                                    ...current.identityProvider,
                                    groupsAttribute: event.target.value,
                                  },
                                }))
                              }
                              placeholder="groups"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>SCIM Status</Label>
                          <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr]">
                            <Select
                              value={settingsDraft.scim.status}
                              onValueChange={(value) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  scim: {
                                    ...current.scim,
                                    status: value as EnterpriseWorkspaceSettings['scim']['status'],
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="disconnected">Disconnected</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={settingsDraft.scim.baseUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  scim: {
                                    ...current.scim,
                                    baseUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="SCIM endpoint"
                            />
                            <Input
                              value={settingsDraft.scim.tokenLabel ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  scim: {
                                    ...current.scim,
                                    tokenLabel: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Token Label"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                              checked={settingsDraft.scim.enabled}
                              onCheckedChange={(checked) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  scim: {
                                    ...current.scim,
                                    enabled: checked === true,
                                  },
                                }))
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              SCIM-User- und Group-Sync aktivieren
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>DPA URL</Label>
                            <Input
                              value={settingsDraft.procurement.dpaUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    dpaUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SCC URL</Label>
                            <Input
                              value={settingsDraft.procurement.sccUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    sccUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Security Contact Name</Label>
                            <Input
                              value={settingsDraft.procurement.securityContactName ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    securityContactName: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Security Team"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Security Contact Email</Label>
                            <Input
                              value={settingsDraft.procurement.securityContactEmail ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    securityContactEmail: event.target.value,
                                  },
                                }))
                              }
                              placeholder="security@..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Incident Reporting URL</Label>
                            <Input
                              value={settingsDraft.procurement.incidentReportingUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    incidentReportingUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dokumentationsportal</Label>
                            <Input
                              value={settingsDraft.procurement.documentationPortalUrl ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    documentationPortalUrl: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Retention Summary</Label>
                          <Textarea
                            value={settingsDraft.procurement.retentionSummary ?? ''}
                            onChange={(event) =>
                              updateSettingsDraft((current) => ({
                                ...current,
                                procurement: {
                                  ...current.procurement,
                                  retentionSummary: event.target.value,
                                },
                              }))
                            }
                            placeholder="Kurze Zusammenfassung fuer Procurement und Security Review"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">Approval Policy</div>
                            <div className="text-sm text-muted-foreground">
                              Steuert externe Einreichungen und formale Governance-Sign-offs.
                            </div>
                          </div>
                          <Workflow className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Externe Einreichungen</Label>
                            <Select
                              value={settingsDraft.approvalPolicy.externalSubmissions}
                              onValueChange={(value) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  approvalPolicy: {
                                    ...current.approvalPolicy,
                                    externalSubmissions:
                                      value as EnterpriseWorkspaceSettings['approvalPolicy']['externalSubmissions'],
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Keine formale Freigabe</SelectItem>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="reviewer_plus_officer">Reviewer + External Officer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Governance-Sign-off</Label>
                            <Select
                              value={settingsDraft.approvalPolicy.governanceSignOff}
                              onValueChange={(value) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  approvalPolicy: {
                                    ...current.approvalPolicy,
                                    governanceSignOff:
                                      value as EnterpriseWorkspaceSettings['approvalPolicy']['governanceSignOff'],
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Keine formale Freigabe</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="external_officer">External Officer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={settingsDraft.approvalPolicy.autoCreateUseCaseOnApproval}
                            onCheckedChange={(checked) =>
                              updateSettingsDraft((current) => ({
                                ...current,
                                approvalPolicy: {
                                  ...current.approvalPolicy,
                                  autoCreateUseCaseOnApproval: checked === true,
                                },
                              }))
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            Bei Lieferantenfreigabe automatisch einen Use Case anlegen
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-sm font-medium">Retention</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Immutable Audit Exports (Tage)</Label>
                            <Input
                              type="number"
                              value={settingsDraft.retentionPolicy.immutableAuditExportsDays}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  retentionPolicy: {
                                    ...current.retentionPolicy,
                                    immutableAuditExportsDays: Number(event.target.value || 0),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>External Submissions (Tage)</Label>
                            <Input
                              type="number"
                              value={settingsDraft.retentionPolicy.externalSubmissionDays}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  retentionPolicy: {
                                    ...current.retentionPolicy,
                                    externalSubmissionDays: Number(event.target.value || 0),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Review Artefakte (Tage)</Label>
                            <Input
                              type="number"
                              value={settingsDraft.retentionPolicy.reviewArtifactsDays}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  retentionPolicy: {
                                    ...current.retentionPolicy,
                                    reviewArtifactsDays: Number(event.target.value || 0),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Incident Logs (Tage)</Label>
                            <Input
                              type="number"
                              value={settingsDraft.retentionPolicy.incidentLogDays}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  retentionPolicy: {
                                    ...current.retentionPolicy,
                                    incidentLogDays: Number(event.target.value || 0),
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={settingsDraft.retentionPolicy.legalHold}
                            onCheckedChange={(checked) =>
                              updateSettingsDraft((current) => ({
                                ...current,
                                retentionPolicy: {
                                  ...current.retentionPolicy,
                                  legalHold: checked === true,
                                },
                              }))
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            Legal Hold aktivieren
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">Notification Hooks</div>
                          <div className="text-sm text-muted-foreground">
                            Hooks fuer submission received, review due und approval needed.
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateSettingsDraft((current) => ({
                              ...current,
                              notifications: {
                                ...current.notifications,
                                hooks: [
                                  ...current.notifications.hooks,
                                  createHookDraft('submission_received'),
                                ],
                              },
                            }))
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Hook
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {settingsDraft.notifications.hooks.map((hook) => (
                          <div
                            key={hook.webhookId}
                            className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[180px_1fr_1fr_auto]"
                          >
                            <Select
                              value={hook.eventType}
                              onValueChange={(value) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  notifications: {
                                    ...current.notifications,
                                    hooks: current.notifications.hooks.map((entry) =>
                                      entry.webhookId === hook.webhookId
                                        ? {
                                            ...entry,
                                            eventType:
                                              value as WorkspaceWebhookConfig['eventType'],
                                          }
                                        : entry,
                                    ),
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submission_received">Submission received</SelectItem>
                                <SelectItem value="review_due">Review due</SelectItem>
                                <SelectItem value="approval_needed">Approval needed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={hook.url}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  notifications: {
                                    ...current.notifications,
                                    hooks: current.notifications.hooks.map((entry) =>
                                      entry.webhookId === hook.webhookId
                                        ? { ...entry, url: event.target.value }
                                        : entry,
                                    ),
                                  },
                                }))
                              }
                              placeholder="https://hooks.example.com/..."
                            />
                            <Input
                              value={hook.secretLabel ?? ''}
                              onChange={(event) =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  notifications: {
                                    ...current.notifications,
                                    hooks: current.notifications.hooks.map((entry) =>
                                      entry.webhookId === hook.webhookId
                                        ? {
                                            ...entry,
                                            secretLabel: event.target.value,
                                          }
                                        : entry,
                                    ),
                                  },
                                }))
                              }
                              placeholder="Secret Label"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Checkbox
                                checked={hook.enabled}
                                onCheckedChange={(checked) =>
                                  updateSettingsDraft((current) => ({
                                    ...current,
                                    notifications: {
                                      ...current.notifications,
                                      hooks: current.notifications.hooks.map((entry) =>
                                        entry.webhookId === hook.webhookId
                                          ? { ...entry, enabled: checked === true }
                                          : entry,
                                      ),
                                    },
                                  }))
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateSettingsDraft((current) => ({
                                    ...current,
                                    notifications: {
                                      ...current.notifications,
                                      hooks: current.notifications.hooks.filter(
                                        (entry) => entry.webhookId !== hook.webhookId,
                                      ),
                                    },
                                  }))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {settingsDraft.notifications.hooks.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            Noch keine Webhooks konfiguriert.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">Subprocessors</div>
                          <div className="text-sm text-muted-foreground">
                            Procurement-sichtbare Unterauftragsverarbeiter fuer DPA, SCC und Security Review.
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              !newSubprocessor.name.trim() ||
                              !newSubprocessor.region.trim() ||
                              !newSubprocessor.purpose.trim()
                            ) {
                              return;
                            }

                            updateSettingsDraft((current) => ({
                              ...current,
                              procurement: {
                                ...current.procurement,
                                subprocessors: [
                                  ...current.procurement.subprocessors,
                                  {
                                    name: newSubprocessor.name.trim(),
                                    region: newSubprocessor.region.trim(),
                                    purpose: newSubprocessor.purpose.trim(),
                                    url: normalizeOptionalText(newSubprocessor.url) ?? null,
                                  },
                                ],
                              },
                            }));
                            setNewSubprocessor({ name: '', region: '', purpose: '', url: '' });
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Hinzufuegen
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <Input
                          value={newSubprocessor.name}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Anbieter"
                        />
                        <Input
                          value={newSubprocessor.region}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              region: event.target.value,
                            }))
                          }
                          placeholder="Region"
                        />
                        <Input
                          value={newSubprocessor.purpose}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              purpose: event.target.value,
                            }))
                          }
                          placeholder="Zweck"
                        />
                        <Input
                          value={newSubprocessor.url}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              url: event.target.value,
                            }))
                          }
                          placeholder="URL"
                        />
                      </div>
                      <div className="space-y-2">
                        {settingsDraft.procurement.subprocessors.map((entry, index) => (
                          <div
                            key={`${entry.name}_${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                          >
                            <div>
                              <div className="font-medium">{entry.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {entry.region} · {entry.purpose}
                                {entry.url ? ` · ${entry.url}` : ''}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateSettingsDraft((current) => ({
                                  ...current,
                                  procurement: {
                                    ...current.procurement,
                                    subprocessors:
                                      current.procurement.subprocessors.filter(
                                        (_, entryIndex) => entryIndex !== index,
                                      ),
                                  },
                                }))
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Entfernen
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => void saveSettings()}
                        disabled={!canManageMembers || busyAction === 'save_settings'}
                      >
                        Organisationseinstellungen speichern
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void dispatchReviewDueNotification()}
                        disabled={!canManageMembers || busyAction === 'dispatch_review_due'}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Review due senden
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void downloadAuditExport()}
                        disabled={busyAction === 'download_audit_export'}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Immutable Audit Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Governance-Sign-off</CardTitle>
                      <CardDescription>
                        Formale Freigaben fuer Governance-Stand und Organisationseinstellungen.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <Input
                          value={signOffSummary}
                          onChange={(event) => setSignOffSummary(event.target.value)}
                          placeholder="Zum Beispiel: Q2 Governance Baseline"
                        />
                        <Button
                          onClick={() => void requestGovernanceSignOff()}
                          disabled={!canManageMembers || busyAction === 'request_signoff'}
                        >
                          Sign-off anfordern
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {signOffs.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            Noch kein Governance-Sign-off angelegt.
                          </div>
                        ) : (
                          signOffs.map((signOff) => (
                            <div
                              key={signOff.signOffId}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="font-medium">{signOff.summary}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Angefordert am {formatDate(signOff.requestedAt)} von{' '}
                                    {signOff.requestedByEmail ?? signOff.requestedByUserId}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Erforderliche Rollen:{' '}
                                    {signOff.approvalWorkflow?.requiredRoles.join(', ') ||
                                      'keine'}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'capitalize',
                                    getSignOffStatusBadgeClass(signOff.status),
                                  )}
                                >
                                  {signOff.status}
                                </Badge>
                              </div>
                              {signOff.status === 'pending' && canApprove ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      void decideGovernanceSignOff(
                                        signOff.signOffId,
                                        'approved',
                                      )
                                    }
                                    disabled={
                                      busyAction ===
                                      `signoff_${signOff.signOffId}_approved`
                                    }
                                  >
                                    Freigeben
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      void decideGovernanceSignOff(
                                        signOff.signOffId,
                                        'rejected',
                                      )
                                    }
                                    disabled={
                                      busyAction ===
                                      `signoff_${signOff.signOffId}_rejected`
                                    }
                                  >
                                    Ablehnen
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Externe Freigabe-Queue</CardTitle>
                      <CardDescription>
                        Lieferanten- und Zugangscode-Einreichungen bleiben mit Herkunft und Freigabestatus nachvollziehbar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {submissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          Noch keine externen Einreichungen im aktiven Workspace.
                        </div>
                      ) : (
                        submissions.map((submission) => (
                          <div
                            key={submission.submissionId}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {getSubmissionHeadline(submission)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {submission.submittedByEmail ?? submission.submittedByName ?? 'Unbekannt'} ·{' '}
                                  {formatDate(submission.submittedAt)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {submission.registerName || submission.registerId} ·{' '}
                                  {submission.sourceType}
                                </div>
                                {submission.approvalWorkflow ? (
                                  <div className="text-xs text-muted-foreground">
                                    Freigaben: {submission.approvalWorkflow.requiredRoles.join(', ')} ·{' '}
                                    {submission.approvalWorkflow.status}
                                  </div>
                                ) : null}
                              </div>
                              <Badge
                                variant="outline"
                                className={getSubmissionStatusBadgeClass(submission.status)}
                              >
                                {submission.status}
                              </Badge>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  void reviewSubmission(submission.submissionId, 'approve')
                                }
                                disabled={!canApprove}
                              >
                                Freigeben
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void reviewSubmission(submission.submissionId, 'reject')
                                }
                                disabled={!canApprove}
                              >
                                Ablehnen
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void reviewSubmission(submission.submissionId, 'merge')
                                }
                                disabled={!canApprove || submission.status === 'rejected'}
                              >
                                Uebernehmen
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
