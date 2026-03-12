import { createHash } from 'node:crypto';

import type {
  EnterpriseWorkspaceSettings,
  WorkspaceMemberRecord,
  WorkspaceRecord,
} from './workspace';
import type { GovernanceSignOffRecord } from './governance-signoff';

export interface ImmutableAuditExportEvent {
  eventId: string;
  occurredAt: string;
  eventType: string;
  summary: string;
  data: Record<string, unknown>;
  previousHash: string | null;
  hash: string;
}

export interface ImmutableAuditExport {
  workspaceId: string;
  workspaceName: string;
  generatedAt: string;
  retentionPolicy: EnterpriseWorkspaceSettings['retentionPolicy'];
  eventCount: number;
  finalHash: string | null;
  events: ImmutableAuditExportEvent[];
}

function normalizeDate(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : new Date(0).toISOString();
}

function buildHash(input: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export function buildImmutableAuditExport(input: {
  workspace: WorkspaceRecord;
  members: WorkspaceMemberRecord[];
  pendingInvites: Array<{
    inviteId: string;
    email: string;
    role: string;
    createdAt: string;
    expiresAt: string;
  }>;
  signOffs?: GovernanceSignOffRecord[];
  generatedAt?: string;
}): ImmutableAuditExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seedEvents: Array<{
    occurredAt: string;
    eventType: string;
    summary: string;
    data: Record<string, unknown>;
  }> = [
    {
      occurredAt: normalizeDate(input.workspace.createdAt),
      eventType: 'workspace_created',
      summary: `Workspace ${input.workspace.name} eingerichtet`,
      data: {
        ownerUserId: input.workspace.ownerUserId,
        plan: input.workspace.plan,
      },
    },
    ...input.members.map((member) => ({
      occurredAt: normalizeDate(member.joinedAt ?? member.invitedAt),
      eventType: member.status === 'invited' ? 'member_invited' : 'member_active',
      summary: `${member.email} als ${member.role} registriert`,
      data: {
        role: member.role,
        status: member.status,
        source: member.source,
      },
    })),
    ...input.pendingInvites.map((invite) => ({
      occurredAt: normalizeDate(invite.createdAt),
      eventType: 'pending_invite',
      summary: `${invite.email} eingeladen`,
      data: {
        inviteId: invite.inviteId,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    })),
    ...(input.signOffs ?? []).map((signOff) => ({
      occurredAt: normalizeDate(signOff.requestedAt),
      eventType: `governance_signoff_${signOff.status}`,
      summary: signOff.summary,
      data: {
        signOffId: signOff.signOffId,
        requestedByUserId: signOff.requestedByUserId,
        requestedByEmail: signOff.requestedByEmail ?? null,
        resolvedByUserId: signOff.resolvedByUserId ?? null,
        resolvedAt: signOff.resolvedAt ?? null,
        requiredRoles: signOff.approvalWorkflow?.requiredRoles ?? [],
      },
    })),
    {
      occurredAt: normalizeDate(input.workspace.enterpriseSettings.updatedAt),
      eventType: 'enterprise_settings_snapshot',
      summary: 'Enterprise-Steuerung und Procurement-Konfiguration exportiert',
      data: {
        approvalPolicy: input.workspace.enterpriseSettings.approvalPolicy,
        retentionPolicy: input.workspace.enterpriseSettings.retentionPolicy,
        identityProviderMode:
          input.workspace.enterpriseSettings.identityProvider.mode,
        scimEnabled: input.workspace.enterpriseSettings.scim.enabled,
        webhookCount: input.workspace.enterpriseSettings.notifications.hooks.length,
        subprocessorCount:
          input.workspace.enterpriseSettings.procurement.subprocessors.length,
      },
    },
  ].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  const events: ImmutableAuditExportEvent[] = [];
  let previousHash: string | null = null;

  for (const [index, event] of seedEvents.entries()) {
    const payload = {
      ...event,
      previousHash,
    };
    const hash = buildHash(payload);
    events.push({
      eventId: `audit_${String(index + 1).padStart(4, '0')}`,
      occurredAt: event.occurredAt,
      eventType: event.eventType,
      summary: event.summary,
      data: event.data,
      previousHash,
      hash,
    });
    previousHash = hash;
  }

  return {
    workspaceId: input.workspace.orgId,
    workspaceName: input.workspace.name,
    generatedAt,
    retentionPolicy: input.workspace.enterpriseSettings.retentionPolicy,
    eventCount: events.length,
    finalHash: previousHash,
    events,
  };
}
