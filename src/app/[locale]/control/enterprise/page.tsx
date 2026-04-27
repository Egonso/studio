'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Copy,
  Download,
  KeyRound,
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
import {
  getGovernanceDateLocale,
  resolveGovernanceCopyLocale,
} from '@/lib/i18n/governance-copy';
import type { GovernanceSignOffRecord } from '@/lib/enterprise/governance-signoff';
import {
  getWorkspaceRoleLabel,
  type EnterpriseWorkspaceSettings,
  type WorkspaceMemberRecord,
  type WorkspaceRole,
  type WorkspaceWebhookConfig,
} from '@/lib/enterprise/workspace';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { getExternalSubmissionSystemSummary } from '@/lib/register-first/external-submissions';
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
  actorRole: WorkspaceRole;
  keys: AgentKitApiKeyRow[];
  registers: AgentKitRegisterOption[];
  submitEndpoint: string;
}

function getEnterpriseCopy(locale?: string | null) {
  const isGerman = resolveGovernanceCopyLocale(locale) === 'de';

  if (!isGerman) {
    return {
      unknown: 'Unknown',
      noSystem: 'No system',
      retry: 'Please try again.',
      none: 'none',
      active: 'active',
      revoked: 'revoked',
      copy: 'Copy',
      remove: 'Remove',
      approve: 'Approve',
      reject: 'Reject',
      merge: 'Merge',
      status: {
        approved: 'approved',
        rejected: 'rejected',
        merged: 'merged',
        submitted: 'submitted',
        pending: 'pending',
        invited: 'invited',
      },
      roleLabels: {
        OWNER: 'Owner',
        ADMIN: 'Admin',
        REVIEWER: 'Reviewer',
        EXTERNAL_OFFICER: 'External Officer',
        MEMBER: 'Member',
      },
      errors: {
        workspaceLoad:
          'Organisation data could not be loaded. Please check the active workspace context.',
        saveFailed: 'Saving failed',
        inviteFailed: 'Invitation failed',
        copyFailed: 'Copy failed',
        copyManual: 'Please select and copy the text manually.',
        createKeyFailed: 'API key could not be created',
        revokeKeyFailed: 'API key could not be revoked',
        roleFailed: 'Role could not be updated',
        removeFailed: 'Member could not be removed',
        requestSignOffFailed: 'Sign-off could not be requested',
        decideSignOffFailed: 'Sign-off could not be decided',
        submissionFailed: 'Submission could not be updated',
        reviewHooksFailed: 'Review hooks failed',
        auditExportFailed: 'Audit export failed',
      },
      toast: {
        settingsSavedTitle: 'Organisation settings saved',
        settingsSavedDescription:
          'Identity, approvals, retention, webhooks and procurement data were updated.',
        inviteProcessedTitle: 'Invitation processed',
        inviteProcessedDescription: 'The workspace member was invited.',
        copiedTitle: (label: string) => `${label} copied`,
        copiedDescription: 'You can now reuse the content directly.',
        keyCreatedTitle: 'Agent Kit API key created',
        keyCreatedDescription:
          'Copy the full key now. After this, only the preview will remain visible.',
        keyRevokedTitle: 'Agent Kit API key revoked',
        keyRevokedDescription:
          'New submissions using this key are blocked immediately.',
        signOffRequestedTitle: 'Governance sign-off requested',
        signOffRequestedDescription:
          'The current organisation state was submitted for formal approval.',
        reviewHooksDeliveredTitle: 'Review hooks delivered',
        reviewHooksDeliveredDescription:
          'Current review due events were sent to the configured webhooks.',
      },
      frame: {
        loadingTitle: 'Organisation',
        loadingDescription:
          'Workspace administration, procurement and formal approvals are being prepared.',
        loadingNextStep:
          'Loading roles, settings and approval queues.',
        loadingPanelTitle: 'Loading organisation',
        loadingPanelDescription:
          'Members, identity, approvals and audit export are being prepared.',
        title: 'Organisation',
        descriptionWithWorkspace: (workspace: string) =>
          `Organisation controls for ${workspace}. Roles, procurement, identity and approvals come together here.`,
        description:
          'Organisation controls for roles, procurement, identity and approvals.',
        nextStep:
          'Maintain roles, approval policy and procurement documents for the active workspace first.',
      },
      gated: {
        title:
          'This area is not available for the active workspace',
        description:
          'Role model, SSO/SCIM, procurement settings and formal workspace approvals are managed in organisation controls.',
        controlOverview: 'Control overview',
        exportsAudit: 'Exports / Audit',
        noWorkspaceTitle: 'No workspace selected',
        noWorkspaceDescription:
          'Use the workspace switcher to select a workspace before managing members and settings.',
        openRegister: 'Open register',
      },
      state: {
        loadingTitle: 'Loading organisation data',
        loadingDescription:
          'Members, settings, sign-offs and external approvals are being loaded.',
        errorTitle: 'Organisation could not be loaded',
        reload: 'Reload',
      },
      kpis: {
        activeRole: 'Active role',
        members: 'Members',
        openApprovals: 'Open approvals',
        openSignOffs: 'Open governance sign-offs',
      },
      agentKit: {
        title: 'Agent Kit API Keys',
        description:
          'Let Codex, Claude Code, OpenClaw or other agents submit confirmed documentation directly into this workspace’s AI register.',
        linkedRegisters: (count: number) => `${count} registers linked`,
        step1Title: '1. Create API key',
        step1Description:
          'Each person can create their own key. Owners and admins see all workspace keys and can revoke them if needed.',
        step2Title: '2. Give it to the agent',
        step2Description:
          'The key is used as an environment variable in the agent workflow. The manifest.json is then submitted directly through the CLI.',
        step3Title: '3. Team lead sees the result',
        step3Description:
          'After successful submission, a real use case is created in the AI register. Team leads see it there instead of working with files.',
        labelPlaceholder: 'For example: Codex on MacBook Pro',
        registerPlaceholder: 'Choose target register',
        createKey: 'Create API key',
        noRegisters:
          'Link at least one register with this workspace first. Only then can the Agent Kit make direct submissions visible to team leads.',
        newKeyTitle: 'New API key',
        newKeyDescription:
          'This full key is shown only now. After this, only the preview remains visible in the list.',
        copyKey: 'Copy key',
        apiKeyLabel: 'API key',
        commandTitle: 'Example command for the technical team',
        commandDescription:
          'This command submits a confirmed manifest file directly into the selected register.',
        commandLabel: 'Command',
        promptTitle: 'Example prompt for an agent',
        promptDescription:
          'This helps even a not-perfectly-prepared agent understand what to do.',
        promptLabel: 'Prompt',
        fallbackRegister: 'Link a register first.',
        noKeys: 'No Agent Kit API key has been created for this workspace yet.',
        revoke: 'Revoke',
      },
      members: {
        title: 'Members and roles',
        description:
          'Owner, Admin, Reviewer, Member and External Officer are managed centrally in the workspace.',
        pendingInvites: (count: number) => `${count} open invitations`,
        invite: 'Invite',
        person: 'Person',
        role: 'Role',
        status: 'Status',
        source: 'Source',
        action: 'Action',
        ownerImmutable: 'Owner remains immutable.',
        pendingInvitesTitle: 'Pending invitations',
        validUntil: 'valid until',
      },
      identity: {
        title: 'Identity, SCIM and procurement',
        description:
          'SSO/SAML/OIDC, SCIM provisioning, retention, webhooks and procurement-ready documents in one place.',
        identityProviderMode: 'Identity provider mode',
        providerName: 'Provider name',
        metadataUrl: 'Metadata URL',
        ssoUrl: 'SSO URL / issuer',
        groupsAttribute: 'Groups attribute',
        disabled: 'Disabled',
        documentationPortal: 'Documentation portal',
        retentionSummary: 'Retention summary',
        retentionPlaceholder:
          'Short summary for procurement and security review',
        scimSync: 'Enable SCIM user and group sync',
      },
      approval: {
        title: 'Approval policy',
        description:
          'Controls external submissions and formal governance sign-offs.',
        externalSubmissions: 'External submissions',
        governanceSignOff: 'Governance sign-off',
        noFormalApproval: 'No formal approval',
        autoCreateUseCase:
          'Automatically create a use case after supplier approval',
      },
      retention: {
        title: 'Retention',
        immutableAuditExportsDays: 'Immutable audit exports (days)',
        externalSubmissionsDays: 'External submissions (days)',
        reviewArtifactsDays: 'Review artifacts (days)',
        incidentLogsDays: 'Incident logs (days)',
        legalHold: 'Enable legal hold',
      },
      hooks: {
        title: 'Notification hooks',
        description:
          'Hooks for submission received, review due and approval needed.',
        hook: 'Hook',
        noHooks: 'No webhooks configured yet.',
      },
      subprocessors: {
        title: 'Subprocessors',
        description:
          'Procurement-visible subprocessors for DPA, SCC and security review.',
        add: 'Add',
        provider: 'Provider',
        region: 'Region',
        purpose: 'Purpose',
        url: 'URL',
      },
      actions: {
        saveSettings: 'Save organisation settings',
        sendReviewDue: 'Send review due',
        immutableAuditExport: 'Immutable audit export',
      },
      signOff: {
        title: 'Governance sign-off',
        description:
          'Formal approvals for governance state and organisation settings.',
        placeholder: 'For example: Q2 governance baseline',
        request: 'Request sign-off',
        empty: 'No governance sign-off has been created yet.',
        requestedAtBy: (date: string, actor: string) =>
          `Requested on ${date} by ${actor}`,
        requiredRoles: 'Required roles',
      },
      externalQueue: {
        title: 'External approval queue',
        description:
          'Supplier and access-code submissions remain traceable with origin and approval status.',
        empty: 'No external submissions in the active workspace yet.',
        approvals: 'Approvals',
      },
      tables: {
        label: 'Label',
        createdBy: 'Created by',
        createdAt: 'Created at',
        lastUsed: 'Last used',
        status: 'Status',
        action: 'Action',
      },
    } as const;
  }

  return {
    unknown: 'Unbekannt',
    noSystem: 'Ohne System',
    retry: 'Bitte erneut versuchen.',
    none: 'keine',
    active: 'aktiv',
    revoked: 'widerrufen',
    copy: 'Kopieren',
    remove: 'Entfernen',
    approve: 'Freigeben',
    reject: 'Ablehnen',
    merge: 'Übernehmen',
    status: {
      approved: 'freigegeben',
      rejected: 'abgelehnt',
      merged: 'übernommen',
      submitted: 'eingereicht',
      pending: 'offen',
      invited: 'eingeladen',
    },
    roleLabels: {
      OWNER: 'Owner',
      ADMIN: 'Admin',
      REVIEWER: 'Reviewer',
      EXTERNAL_OFFICER: 'External Officer',
      MEMBER: 'Member',
    },
    errors: {
      workspaceLoad:
        'Organisationsdaten konnten nicht geladen werden. Bitte prüfen Sie den aktiven Workspace-Kontext.',
      saveFailed: 'Speichern fehlgeschlagen',
      inviteFailed: 'Einladung fehlgeschlagen',
      copyFailed: 'Kopieren fehlgeschlagen',
      copyManual: 'Bitte den Text manuell markieren und kopieren.',
      createKeyFailed: 'API-Key konnte nicht erstellt werden',
      revokeKeyFailed: 'API-Key konnte nicht widerrufen werden',
      roleFailed: 'Rolle konnte nicht aktualisiert werden',
      removeFailed: 'Mitglied konnte nicht entfernt werden',
      requestSignOffFailed: 'Sign-off konnte nicht angefordert werden',
      decideSignOffFailed: 'Sign-off konnte nicht entschieden werden',
      submissionFailed: 'Einreichung konnte nicht aktualisiert werden',
      reviewHooksFailed: 'Review-Hooks fehlgeschlagen',
      auditExportFailed: 'Audit-Export fehlgeschlagen',
    },
    toast: {
      settingsSavedTitle: 'Organisationseinstellungen gespeichert',
      settingsSavedDescription:
        'Identity, Approvals, Retention, Webhooks und Procurement-Daten wurden aktualisiert.',
      inviteProcessedTitle: 'Einladung verarbeitet',
      inviteProcessedDescription: 'Das Workspace-Mitglied wurde eingeladen.',
      copiedTitle: (label: string) => `${label} kopiert`,
      copiedDescription: 'Sie können den Inhalt jetzt direkt weiterverwenden.',
      keyCreatedTitle: 'Agent-Kit-API-Key erstellt',
      keyCreatedDescription:
        'Kopieren Sie den Key jetzt einmalig. Danach wird nur noch die Vorschau angezeigt.',
      keyRevokedTitle: 'Agent-Kit-API-Key widerrufen',
      keyRevokedDescription:
        'Neue Einreichungen mit diesem Key werden sofort blockiert.',
      signOffRequestedTitle: 'Governance-Sign-off angefordert',
      signOffRequestedDescription:
        'Der aktuelle Organisationsstand wurde als formale Freigabe eingereicht.',
      reviewHooksDeliveredTitle: 'Review-Hooks ausgeliefert',
      reviewHooksDeliveredDescription:
        'Aktuelle Review-Fälligkeiten wurden an konfigurierte Webhooks gesendet.',
    },
    frame: {
      loadingTitle: 'Organisation',
      loadingDescription:
        'Workspace-Administration, Beschaffung und formale Freigaben werden vorbereitet.',
      loadingNextStep:
        'Wir laden Rollen, Settings und Freigabe-Queues.',
      loadingPanelTitle: 'Organisation wird geladen',
      loadingPanelDescription:
        'Mitglieder, Identity, Approvals und Audit-Export werden vorbereitet.',
      title: 'Organisation',
      descriptionWithWorkspace: (workspace: string) =>
        `Organisationssteuerung für ${workspace}. Rollen, Beschaffung, Identity und Freigaben laufen hier zusammen.`,
      description:
        'Organisationssteuerung für Rollen, Beschaffung, Identity und Freigaben.',
      nextStep:
        'Pflegen Sie zuerst Rollen, Approval-Policy und Procurement-Unterlagen für den aktiven Workspace.',
    },
    gated: {
      title:
        'Dieser Bereich ist für den aktiven Arbeitsbereich nicht verfügbar',
      description:
        'Rollenmodell, SSO/SCIM, Procurement-Settings und formale Workspace-Freigaben werden in der Organisationssteuerung verwaltet.',
      controlOverview: 'Control Overview',
      exportsAudit: 'Exports / Audit',
      noWorkspaceTitle: 'Kein Workspace ausgewählt',
      noWorkspaceDescription:
        'Wählen Sie über den Workspace-Switcher einen Workspace aus, um Mitglieder und Einstellungen zu verwalten.',
      openRegister: 'Zum Register',
    },
    state: {
      loadingTitle: 'Organisationsdaten werden geladen',
      loadingDescription:
        'Mitglieder, Settings, Sign-offs und externe Freigaben werden geladen.',
      errorTitle: 'Organisation konnte nicht geladen werden',
      reload: 'Neu laden',
    },
    kpis: {
      activeRole: 'Aktive Rolle',
      members: 'Mitglieder',
      openApprovals: 'Freigaben offen',
      openSignOffs: 'Governance-Sign-offs offen',
    },
    agentKit: {
      title: 'Agent Kit API Keys',
      description:
        'Lassen Sie Codex, Claude Code, OpenClaw oder andere Agenten bestätigte Dokumentationen direkt in das KI-Register dieses Workspaces einreichen.',
      linkedRegisters: (count: number) => `${count} Register verknüpft`,
      step1Title: '1. API-Key erzeugen',
      step1Description:
        'Jede Person kann ihren eigenen Key anlegen. Owner und Admins sehen alle Keys im Workspace und können sie bei Bedarf widerrufen.',
      step2Title: '2. Dem Agenten geben',
      step2Description:
        'Der Key kommt als Umgebungsvariable in den Agent-Workflow. Das manifest.json wird danach über das CLI direkt eingereicht.',
      step3Title: '3. Teamlead sieht das Ergebnis',
      step3Description:
        'Nach der erfolgreichen Einreichung entsteht ein echter Use Case im KI-Register. Teamleads sehen ihn dort, statt mit Dateien arbeiten zu müssen.',
      labelPlaceholder: 'Zum Beispiel: Codex auf MacBook Pro',
      registerPlaceholder: 'Ziel-Register wählen',
      createKey: 'API-Key erstellen',
      noRegisters:
        'Verknüpfen Sie zuerst mindestens ein Register mit diesem Workspace. Erst dann kann das Agent Kit direkte Einreichungen für Teamleads sichtbar machen.',
      newKeyTitle: 'Neuer API-Key',
      newKeyDescription:
        'Dieser komplette Key wird nur jetzt angezeigt. Danach bleibt in der Liste nur noch die Vorschau sichtbar.',
      copyKey: 'Key kopieren',
      apiKeyLabel: 'API-Key',
      commandTitle: 'Beispielbefehl für das technische Team',
      commandDescription:
        'Dieser Befehl reicht eine bestätigte Manifest-Datei direkt in das gewählte Register ein.',
      commandLabel: 'Befehl',
      promptTitle: 'Beispiel-Prompt für einen Agenten',
      promptDescription:
        'So versteht auch ein nicht perfekt vorbereiteter Agent, was er tun soll.',
      promptLabel: 'Prompt',
      fallbackRegister: 'Verknüpfen Sie zuerst ein Register.',
      noKeys: 'Noch kein Agent-Kit-API-Key für diesen Workspace angelegt.',
      revoke: 'Widerrufen',
    },
    members: {
      title: 'Mitglieder und Rollen',
      description:
        'Owner, Admin, Reviewer, Member und External Officer werden zentral im Workspace verwaltet.',
      pendingInvites: (count: number) => `${count} Einladungen offen`,
      invite: 'Einladen',
      person: 'Person',
      role: 'Rolle',
      status: 'Status',
      source: 'Quelle',
      action: 'Aktion',
      ownerImmutable: 'Owner bleibt unveränderlich.',
      pendingInvitesTitle: 'Ausstehende Einladungen',
      validUntil: 'gültig bis',
    },
    identity: {
      title: 'Identity, SCIM und Procurement',
      description:
        'SSO/SAML/OIDC, SCIM-Provisioning, Retention, Webhooks und procurement-fähige Unterlagen an einer Stelle.',
      identityProviderMode: 'Identity Provider Modus',
      providerName: 'Provider Name',
      metadataUrl: 'Metadata URL',
      ssoUrl: 'SSO URL / Issuer',
      groupsAttribute: 'Groups Attribut',
      disabled: 'Deaktiviert',
      documentationPortal: 'Dokumentationsportal',
      retentionSummary: 'Retention Summary',
      retentionPlaceholder:
        'Kurze Zusammenfassung für Procurement und Security Review',
      scimSync: 'SCIM-User- und Group-Sync aktivieren',
    },
    approval: {
      title: 'Approval Policy',
      description:
        'Steuert externe Einreichungen und formale Governance-Sign-offs.',
      externalSubmissions: 'Externe Einreichungen',
      governanceSignOff: 'Governance-Sign-off',
      noFormalApproval: 'Keine formale Freigabe',
      autoCreateUseCase:
        'Bei Lieferantenfreigabe automatisch einen Use Case anlegen',
    },
    retention: {
      title: 'Retention',
      immutableAuditExportsDays: 'Immutable Audit Exports (Tage)',
      externalSubmissionsDays: 'External Submissions (Tage)',
      reviewArtifactsDays: 'Review Artefakte (Tage)',
      incidentLogsDays: 'Incident Logs (Tage)',
      legalHold: 'Legal Hold aktivieren',
    },
    hooks: {
      title: 'Notification Hooks',
      description:
        'Hooks für submission received, review due und approval needed.',
      hook: 'Hook',
      noHooks: 'Noch keine Webhooks konfiguriert.',
    },
    subprocessors: {
      title: 'Subprocessors',
      description:
        'Procurement-sichtbare Unterauftragsverarbeiter für DPA, SCC und Security Review.',
      add: 'Hinzufügen',
      provider: 'Anbieter',
      region: 'Region',
      purpose: 'Zweck',
      url: 'URL',
    },
    actions: {
      saveSettings: 'Organisationseinstellungen speichern',
      sendReviewDue: 'Review due senden',
      immutableAuditExport: 'Immutable Audit Export',
    },
    signOff: {
      title: 'Governance-Sign-off',
      description:
        'Formale Freigaben für Governance-Stand und Organisationseinstellungen.',
      placeholder: 'Zum Beispiel: Q2 Governance Baseline',
      request: 'Sign-off anfordern',
      empty: 'Noch kein Governance-Sign-off angelegt.',
      requestedAtBy: (date: string, actor: string) =>
        `Angefordert am ${date} von ${actor}`,
      requiredRoles: 'Erforderliche Rollen',
    },
    externalQueue: {
      title: 'Externe Freigabe-Queue',
      description:
        'Lieferanten- und Zugangscode-Einreichungen bleiben mit Herkunft und Freigabestatus nachvollziehbar.',
      empty: 'Noch keine externen Einreichungen im aktiven Workspace.',
      approvals: 'Freigaben',
    },
    tables: {
      label: 'Label',
      createdBy: 'Erstellt von',
      createdAt: 'Erstellt am',
      lastUsed: 'Zuletzt genutzt',
      status: 'Status',
      action: 'Aktion',
    },
  } as const;
}

function formatDate(
  value: string | null | undefined,
  locale?: string | null,
  unknownLabel = 'unknown',
): string {
  if (!value) {
    return unknownLabel;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return unknownLabel;
  }

  return parsed.toLocaleString(getGovernanceDateLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRole(role: WorkspaceRole, locale?: string | null): string {
  const copy = getEnterpriseCopy(locale);
  return copy.roleLabels[role] ?? getWorkspaceRoleLabel(role);
}

function formatStatusLabel(
  value: string,
  locale?: string | null,
): string {
  const copy = getEnterpriseCopy(locale);
  return copy.status[value as keyof typeof copy.status] ?? value;
}

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
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
      return 'bg-gray-50 text-gray-800 border-gray-200';
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
      return 'bg-gray-50 text-gray-800 border-gray-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function getSubmissionHeadline(
  submission: WorkspaceExternalSubmissionRow,
  locale?: string | null,
): string {
  const systemSummary = getExternalSubmissionSystemSummary(submission);
  if (systemSummary !== 'Ohne System') {
    return systemSummary;
  }

  const purpose = submission.rawPayloadSnapshot['purpose'];
  if (typeof purpose === 'string' && purpose.trim().length > 0) {
    return purpose;
  }

  return getEnterpriseCopy(locale).noSystem || submission.submissionId;
}

export default function ControlEnterprisePage() {
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const locale = useLocale();
  const copy = useMemo(() => getEnterpriseCopy(locale), [locale]);
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
  const [agentKitKeys, setAgentKitKeys] = useState<AgentKitApiKeyRow[]>([]);
  const [agentKitRegisters, setAgentKitRegisters] = useState<AgentKitRegisterOption[]>([]);
  const [agentKitSubmitEndpoint, setAgentKitSubmitEndpoint] = useState('/api/agent-kit/submit');
  const [agentKitLabel, setAgentKitLabel] = useState('');
  const [agentKitSelectedRegisterId, setAgentKitSelectedRegisterId] = useState<string | null>(null);
  const [latestAgentKitApiKey, setLatestAgentKitApiKey] = useState<string | null>(null);
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
      const [
        membersResponse,
        settingsResponse,
        signOffResponse,
        submissionResponse,
        agentKitResponse,
      ] =
        await Promise.all([
          authFetch(`/api/workspaces/${workspaceId}/members`),
          authFetch(`/api/workspaces/${workspaceId}/settings`),
          authFetch(`/api/workspaces/${workspaceId}/governance-signoffs`),
          authFetch(`/api/workspaces/${workspaceId}/external-submissions`),
          authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys`),
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
      const agentKitPayload =
        (await agentKitResponse.json()) as WorkspaceAgentKitKeysResponse;

      setWorkspaceName(membersPayload.workspace.name);
      setActorRole(membersPayload.actorRole);
      setMembers(membersPayload.members);
      setPendingInvites(membersPayload.pendingInvites);
      setSettingsDraft(settingsPayload.settings);
      setSignOffs(signOffPayload.signOffs);
      setSubmissions(submissionPayload.submissions);
      setAgentKitKeys(agentKitPayload.keys);
      setAgentKitRegisters(agentKitPayload.registers);
      setAgentKitSubmitEndpoint(agentKitPayload.submitEndpoint);
      setAgentKitSelectedRegisterId((current) =>
        current && agentKitPayload.registers.some((entry) => entry.registerId === current)
          ? current
          : (agentKitPayload.registers[0]?.registerId ?? null),
      );
    } catch (loadError) {
      console.error('Failed to load enterprise workspace data', loadError);
      setError(copy.errors.workspaceLoad);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, copy.errors.workspaceLoad, workspaceId]);

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
  const selectedAgentKitRegister = useMemo(
    () =>
      agentKitRegisters.find(
        (register) => register.registerId === agentKitSelectedRegisterId,
      ) ?? null,
    [agentKitRegisters, agentKitSelectedRegisterId],
  );
  const absoluteAgentKitSubmitEndpoint = useMemo(
    () => resolveAbsoluteUrl(agentKitSubmitEndpoint),
    [agentKitSubmitEndpoint],
  );
  const agentKitCommandSnippet = useMemo(() => {
    if (!selectedAgentKitRegister) {
      return null;
    }

    return [
      'export KI_REGISTER_API_KEY="<your-agent-kit-api-key>"',
      `export KI_REGISTER_REGISTER_ID="${selectedAgentKitRegister.registerId}"`,
      `node ./agent-kit/bin/studio-agent.mjs submit ./docs/agent-workflows/<slug>/manifest.json --endpoint "${absoluteAgentKitSubmitEndpoint}"`,
    ].join('\n');
  }, [absoluteAgentKitSubmitEndpoint, selectedAgentKitRegister]);
  const agentKitPromptSnippet = useMemo(() => {
    if (!selectedAgentKitRegister) {
      return null;
    }

    return `Use the local ki-register-agent-kit CLI in this repository. If no onboarding exists yet, run onboarding first. Document this AI workflow, ask me about missing facts, show me the summary before writing, and after my confirmation submit the manifest to KI-Register register ${selectedAgentKitRegister.registerId}.`;
  }, [selectedAgentKitRegister]);

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
        title: copy.toast.settingsSavedTitle,
        description: copy.toast.settingsSavedDescription,
      });
      await loadWorkspaceData();
    } catch (saveError) {
      console.error('Failed to save enterprise settings', saveError);
      toast({
        variant: 'destructive',
        title: copy.errors.saveFailed,
        description:
          saveError instanceof Error ? saveError.message : copy.retry,
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
        title: copy.toast.inviteProcessedTitle,
        description:
          payload.message ?? copy.toast.inviteProcessedDescription,
      });
      setInviteEmail('');
      setInviteRole('MEMBER');
      await loadWorkspaceData();
    } catch (inviteError) {
      console.error('Failed to invite workspace member', inviteError);
      toast({
        variant: 'destructive',
        title: copy.errors.inviteFailed,
        description:
          inviteError instanceof Error ? inviteError.message : copy.retry,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: copy.toast.copiedTitle(label),
        description: copy.toast.copiedDescription,
      });
    } catch (copyError) {
      console.error(`Failed to copy ${label}`, copyError);
      toast({
        variant: 'destructive',
        title: copy.errors.copyFailed,
        description: copy.errors.copyManual,
      });
    }
  };

  const createAgentKitKey = async () => {
    if (!workspaceId || !agentKitLabel.trim()) {
      return;
    }

    setBusyAction('create_agent_kit_key');
    try {
      const response = await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys`, {
        method: 'POST',
        body: JSON.stringify({
          label: agentKitLabel.trim(),
        }),
      });
      const payload = (await response.json()) as {
        apiKey: string;
        key: AgentKitApiKeyRow;
      };

      setLatestAgentKitApiKey(payload.apiKey);
      setAgentKitLabel('');
      await loadWorkspaceData();
      toast({
        title: copy.toast.keyCreatedTitle,
        description: copy.toast.keyCreatedDescription,
      });
    } catch (agentKitError) {
      console.error('Failed to create Agent Kit API key', agentKitError);
      toast({
        variant: 'destructive',
        title: copy.errors.createKeyFailed,
        description:
          agentKitError instanceof Error
            ? agentKitError.message
            : copy.retry,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const revokeAgentKitKey = async (keyId: string) => {
    if (!workspaceId) {
      return;
    }

    setBusyAction(`revoke_agent_kit_${keyId}`);
    try {
      await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys/${keyId}`, {
        method: 'DELETE',
      });
      if (latestAgentKitApiKey?.includes(`.${keyId}.`)) {
        setLatestAgentKitApiKey(null);
      }
      await loadWorkspaceData();
      toast({
        title: copy.toast.keyRevokedTitle,
        description: copy.toast.keyRevokedDescription,
      });
    } catch (agentKitError) {
      console.error('Failed to revoke Agent Kit API key', agentKitError);
      toast({
        variant: 'destructive',
        title: copy.errors.revokeKeyFailed,
        description:
          agentKitError instanceof Error
            ? agentKitError.message
            : copy.retry,
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
        title: copy.errors.roleFailed,
        description:
          memberError instanceof Error ? memberError.message : copy.retry,
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
        title: copy.errors.removeFailed,
        description:
          memberError instanceof Error ? memberError.message : copy.retry,
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
        title: copy.toast.signOffRequestedTitle,
        description: copy.toast.signOffRequestedDescription,
      });
    } catch (signOffError) {
      console.error('Failed to request governance sign-off', signOffError);
      toast({
        variant: 'destructive',
        title: copy.errors.requestSignOffFailed,
        description:
          signOffError instanceof Error
            ? signOffError.message
            : copy.retry,
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
        title: copy.errors.decideSignOffFailed,
        description:
          decisionError instanceof Error
            ? decisionError.message
            : copy.retry,
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
        title: copy.errors.submissionFailed,
        description:
          reviewError instanceof Error ? reviewError.message : copy.retry,
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
        title: copy.toast.reviewHooksDeliveredTitle,
        description: copy.toast.reviewHooksDeliveredDescription,
      });
    } catch (dispatchError) {
      console.error('Failed to dispatch review due notification', dispatchError);
      toast({
        variant: 'destructive',
        title: copy.errors.reviewHooksFailed,
        description:
          dispatchError instanceof Error
            ? dispatchError.message
            : copy.retry,
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
        title: copy.errors.auditExportFailed,
        description:
          downloadError instanceof Error
            ? downloadError.message
            : copy.retry,
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (loading || capabilityLoading) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title={copy.frame.loadingTitle}
        description={copy.frame.loadingDescription}
        nextStep={copy.frame.loadingNextStep}
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title={copy.frame.loadingPanelTitle}
          description={copy.frame.loadingPanelDescription}
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
      title={copy.frame.title}
      description={
        workspaceName
          ? copy.frame.descriptionWithWorkspace(workspaceName)
          : copy.frame.description
      }
      nextStep={copy.frame.nextStep}
    >
      <div className="space-y-6">
        {!allowed ? (
          <PageStatePanel
            area="paid_governance_control"
            title={copy.gated.title}
            description={copy.gated.description}
            actions={
              <>
                <Button asChild>
                  <Link href={scopedHrefs.control}>{copy.gated.controlOverview}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={scopedHrefs.controlExports}>{copy.gated.exportsAudit}</Link>
                </Button>
              </>
            }
          />
        ) : !workspaceId ? (
          <PageStatePanel
            area="paid_governance_control"
            title={copy.gated.noWorkspaceTitle}
            description={copy.gated.noWorkspaceDescription}
            actions={
              <Button asChild>
                <Link href={scopedHrefs.register}>{copy.gated.openRegister}</Link>
              </Button>
            }
          />
        ) : (
          <>
            {isLoadingData && !settingsDraft && (
              <PageStatePanel
                tone="loading"
                area="paid_governance_control"
                title={copy.state.loadingTitle}
                description={copy.state.loadingDescription}
              />
            )}

            {error && (
              <PageStatePanel
                tone="error"
                area="paid_governance_control"
                title={copy.state.errorTitle}
                description={error}
                actions={
                  <Button
                    variant="outline"
                    onClick={() => void loadWorkspaceData()}
                    disabled={isLoadingData}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {copy.state.reload}
                  </Button>
                }
              />
            )}

            {settingsDraft && (
              <>
                <div className="grid gap-4 lg:grid-cols-4">
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.kpis.activeRole}</CardDescription>
                      <CardTitle className="text-2xl">
                        {actorRole ? formatRole(actorRole, locale) : copy.unknown}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.kpis.members}</CardDescription>
                      <CardTitle className="text-2xl">{members.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.kpis.openApprovals}</CardDescription>
                      <CardTitle className="text-2xl">{approvalPendingCount}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>{copy.kpis.openSignOffs}</CardDescription>
                      <CardTitle className="text-2xl">{pendingSignOffCount}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <KeyRound className="h-5 w-5" />
                          {copy.agentKit.title}
                        </CardTitle>
                        <CardDescription>
                          {copy.agentKit.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {copy.agentKit.linkedRegisters(agentKitRegisters.length)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          {copy.agentKit.step1Title}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {copy.agentKit.step1Description}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          {copy.agentKit.step2Title}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {copy.agentKit.step2Description}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          {copy.agentKit.step3Title}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {copy.agentKit.step3Description}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[1.2fr_260px_auto]">
                      <Input
                        value={agentKitLabel}
                        onChange={(event) => setAgentKitLabel(event.target.value)}
                        placeholder={copy.agentKit.labelPlaceholder}
                      />
                      <Select
                        value={agentKitSelectedRegisterId ?? undefined}
                        onValueChange={(value) => setAgentKitSelectedRegisterId(value)}
                        disabled={agentKitRegisters.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={copy.agentKit.registerPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {agentKitRegisters.map((register) => (
                            <SelectItem key={register.registerId} value={register.registerId}>
                              {register.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => void createAgentKitKey()}
                        disabled={
                          busyAction === 'create_agent_kit_key' ||
                          !agentKitLabel.trim() ||
                          agentKitRegisters.length === 0
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {copy.agentKit.createKey}
                      </Button>
                    </div>

                    {agentKitRegisters.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        {copy.agentKit.noRegisters}
                      </div>
                    ) : null}

                    {latestAgentKitApiKey ? (
                      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">
                              {copy.agentKit.newKeyTitle}
                            </div>
                            <p className="mt-1 text-sm text-slate-300">
                              {copy.agentKit.newKeyDescription}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void copyToClipboard(
                                latestAgentKitApiKey,
                                copy.agentKit.apiKeyLabel,
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {copy.agentKit.copyKey}
                          </Button>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm">
                          {latestAgentKitApiKey}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {copy.agentKit.commandTitle}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {copy.agentKit.commandDescription}
                            </div>
                          </div>
                          {agentKitCommandSnippet ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void copyToClipboard(
                                  agentKitCommandSnippet,
                                  copy.agentKit.commandLabel,
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {copy.copy}
                            </Button>
                          ) : null}
                        </div>
                        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                          <code>
                            {agentKitCommandSnippet ?? copy.agentKit.fallbackRegister}
                          </code>
                        </pre>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {copy.agentKit.promptTitle}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {copy.agentKit.promptDescription}
                            </div>
                          </div>
                          {agentKitPromptSnippet ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void copyToClipboard(
                                  agentKitPromptSnippet,
                                  copy.agentKit.promptLabel,
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {copy.copy}
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                          {agentKitPromptSnippet ?? copy.agentKit.fallbackRegister}
                        </div>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{copy.tables.label}</TableHead>
                          <TableHead>{copy.tables.createdBy}</TableHead>
                          <TableHead>{copy.tables.createdAt}</TableHead>
                          <TableHead>{copy.tables.lastUsed}</TableHead>
                          <TableHead>{copy.tables.status}</TableHead>
                          <TableHead>{copy.tables.action}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentKitKeys.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-sm text-muted-foreground">
                              {copy.agentKit.noKeys}
                            </TableCell>
                          </TableRow>
                        ) : (
                          agentKitKeys.map((key) => (
                            <TableRow key={key.keyId}>
                              <TableCell>
                                <div className="font-medium">{key.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {key.keyPreview}
                                </div>
                              </TableCell>
                              <TableCell>{key.createdByEmail ?? key.createdByUserId}</TableCell>
                              <TableCell>
                                {formatDate(key.createdAt, locale, copy.unknown)}
                              </TableCell>
                              <TableCell>
                                {formatDate(key.lastUsedAt, locale, copy.unknown)}
                              </TableCell>
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
                                  onClick={() => void revokeAgentKitKey(key.keyId)}
                                  disabled={
                                    Boolean(key.revokedAt) ||
                                    busyAction === `revoke_agent_kit_${key.keyId}`
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {copy.agentKit.revoke}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {copy.members.title}
                        </CardTitle>
                        <CardDescription>
                          {copy.members.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {copy.members.pendingInvites(pendingInvites.length)}
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
                        {copy.members.invite}
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{copy.members.person}</TableHead>
                          <TableHead>{copy.members.role}</TableHead>
                          <TableHead>{copy.members.status}</TableHead>
                          <TableHead>{copy.members.source}</TableHead>
                          <TableHead>{copy.members.action}</TableHead>
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
                                  {copy.members.ownerImmutable}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>{formatStatusLabel(member.status, locale)}</TableCell>
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
                                {copy.remove}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {pendingInvites.length > 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          {copy.members.pendingInvitesTitle}
                        </div>
                        <div className="mt-2 space-y-2 text-sm text-slate-600">
                          {pendingInvites.map((invite) => (
                            <div
                              key={invite.inviteId}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span>{invite.email}</span>
                              <Badge variant="outline">{invite.role}</Badge>
                              <span>
                                {copy.members.validUntil}{' '}
                                {formatDate(invite.expiresAt, locale, copy.unknown)}
                              </span>
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
                      {copy.identity.title}
                    </CardTitle>
                    <CardDescription>
                      {copy.identity.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{copy.identity.identityProviderMode}</Label>
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
                              <SelectItem value="disabled">{copy.identity.disabled}</SelectItem>
                              <SelectItem value="saml">SAML</SelectItem>
                              <SelectItem value="oidc">OIDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{copy.identity.providerName}</Label>
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
                            <Label>{copy.identity.metadataUrl}</Label>
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
                            <Label>{copy.identity.ssoUrl}</Label>
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
                            <Label>{copy.identity.groupsAttribute}</Label>
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
                              {copy.identity.scimSync}
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
                            <Label>{copy.identity.documentationPortal}</Label>
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
                          <Label>{copy.identity.retentionSummary}</Label>
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
                            placeholder={copy.identity.retentionPlaceholder}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">{copy.approval.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {copy.approval.description}
                            </div>
                          </div>
                          <Workflow className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{copy.approval.externalSubmissions}</Label>
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
                                <SelectItem value="none">{copy.approval.noFormalApproval}</SelectItem>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="reviewer_plus_officer">Reviewer + External Officer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{copy.approval.governanceSignOff}</Label>
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
                                <SelectItem value="none">{copy.approval.noFormalApproval}</SelectItem>
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
                            {copy.approval.autoCreateUseCase}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-sm font-medium">{copy.retention.title}</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{copy.retention.immutableAuditExportsDays}</Label>
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
                            <Label>{copy.retention.externalSubmissionsDays}</Label>
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
                            <Label>{copy.retention.reviewArtifactsDays}</Label>
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
                            <Label>{copy.retention.incidentLogsDays}</Label>
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
                            {copy.retention.legalHold}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                          <div>
                          <div className="text-sm font-medium">{copy.hooks.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {copy.hooks.description}
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
                          {copy.hooks.hook}
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
                            {copy.hooks.noHooks}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            {copy.subprocessors.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {copy.subprocessors.description}
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
                          {copy.subprocessors.add}
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
                          placeholder={copy.subprocessors.provider}
                        />
                        <Input
                          value={newSubprocessor.region}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              region: event.target.value,
                            }))
                          }
                          placeholder={copy.subprocessors.region}
                        />
                        <Input
                          value={newSubprocessor.purpose}
                          onChange={(event) =>
                            setNewSubprocessor((current) => ({
                              ...current,
                              purpose: event.target.value,
                            }))
                          }
                          placeholder={copy.subprocessors.purpose}
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
                              {copy.remove}
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
                        {copy.actions.saveSettings}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void dispatchReviewDueNotification()}
                        disabled={!canManageMembers || busyAction === 'dispatch_review_due'}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {copy.actions.sendReviewDue}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void downloadAuditExport()}
                        disabled={busyAction === 'download_audit_export'}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {copy.actions.immutableAuditExport}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.signOff.title}</CardTitle>
                      <CardDescription>
                        {copy.signOff.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <Input
                          value={signOffSummary}
                          onChange={(event) => setSignOffSummary(event.target.value)}
                          placeholder={copy.signOff.placeholder}
                        />
                        <Button
                          onClick={() => void requestGovernanceSignOff()}
                          disabled={!canManageMembers || busyAction === 'request_signoff'}
                        >
                          {copy.signOff.request}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {signOffs.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            {copy.signOff.empty}
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
                                    {copy.signOff.requestedAtBy(
                                      formatDate(signOff.requestedAt, locale, copy.unknown),
                                      signOff.requestedByEmail ?? signOff.requestedByUserId,
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {copy.signOff.requiredRoles}:{' '}
                                    {signOff.approvalWorkflow?.requiredRoles.join(', ') ||
                                      copy.none}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'capitalize',
                                    getSignOffStatusBadgeClass(signOff.status),
                                  )}
                                >
                                  {formatStatusLabel(signOff.status, locale)}
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
                                    {copy.approve}
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
                                    {copy.reject}
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
                      <CardTitle>{copy.externalQueue.title}</CardTitle>
                      <CardDescription>
                        {copy.externalQueue.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {submissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          {copy.externalQueue.empty}
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
                                  {getSubmissionHeadline(submission, locale)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {submission.submittedByName ??
                                    submission.submittedByEmail ??
                                    copy.unknown}{' '}
                                  · {formatDate(submission.submittedAt, locale, copy.unknown)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {submission.registerName || submission.registerId} ·{' '}
                                  {submission.sourceType}
                                </div>
                                {submission.approvalWorkflow ? (
                                  <div className="text-xs text-muted-foreground">
                                    {copy.externalQueue.approvals}:{' '}
                                    {submission.approvalWorkflow.requiredRoles.join(', ')} ·{' '}
                                    {formatStatusLabel(
                                      submission.approvalWorkflow.status,
                                      locale,
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              <Badge
                                variant="outline"
                                className={getSubmissionStatusBadgeClass(submission.status)}
                              >
                                {formatStatusLabel(submission.status, locale)}
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
                                {copy.approve}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void reviewSubmission(submission.submissionId, 'reject')
                                }
                                disabled={!canApprove}
                              >
                                {copy.reject}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void reviewSubmission(submission.submissionId, 'merge')
                                }
                                disabled={!canApprove || submission.status === 'rejected'}
                              >
                                {copy.merge}
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
