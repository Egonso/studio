import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type {
  EnterpriseWorkspaceSettings,
  EnterpriseWorkspaceSettingsUpdate,
  ManagedWorkspaceRole,
  WorkspaceRoleMappingEntry,
  WorkspaceWebhookConfig,
} from '@/lib/enterprise/workspace';
import {
  getWorkspaceRecord,
  updateWorkspaceEnterpriseSettings,
} from '@/lib/workspace-admin';
import {
  ServerAuthError,
  requireWorkspaceAdmin,
  requireWorkspaceMember,
} from '@/lib/server-auth';
import { safeEmailSchema, safeHttpsUrlSchema } from '@/lib/security/request-security';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error('INVALID_TEXT');
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new Error('INVALID_BOOLEAN');
  }
  return value;
}

function parseOptionalEmail(value: unknown): string | null | undefined {
  const normalized = normalizeOptionalText(value);
  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  return safeEmailSchema.parse(normalized);
}

function parseOptionalHttpsUrl(value: unknown, label: string): string | null | undefined {
  const normalized = normalizeOptionalText(value);
  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  return safeHttpsUrlSchema(label).parse(normalized);
}

function parsePositiveInteger(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('INVALID_NUMBER');
  }

  return Math.round(parsed);
}

function parseManagedRole(value: unknown): ManagedWorkspaceRole | undefined {
  if (value === undefined) {
    return undefined;
  }

  switch (value) {
    case 'ADMIN':
    case 'REVIEWER':
    case 'MEMBER':
    case 'EXTERNAL_OFFICER':
      return value as ManagedWorkspaceRole;
    default:
      throw new Error('INVALID_ROLE');
  }
}

function parseRoleMappings(value: unknown): WorkspaceRoleMappingEntry[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('INVALID_ROLE_MAPPINGS');
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        throw new Error('INVALID_ROLE_MAPPINGS');
      }

      const groupName = normalizeOptionalText(entry.groupName);
      const role = parseManagedRole(entry.role);
      if (!groupName || !role) {
        throw new Error('INVALID_ROLE_MAPPINGS');
      }

      return {
        groupName,
        role,
      };
    })
    .filter((entry) => entry.groupName.length > 0);
}

function parseHooks(
  value: unknown,
): WorkspaceWebhookConfig[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('INVALID_HOOKS');
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error('INVALID_HOOKS');
    }

    const eventType = entry.eventType;
    if (
      eventType !== 'submission_received' &&
      eventType !== 'review_due' &&
      eventType !== 'approval_needed'
    ) {
      throw new Error('INVALID_HOOK_EVENT');
    }

    const url = parseOptionalHttpsUrl(entry.url, 'Webhook-URL');
    if (!url) {
      throw new Error('INVALID_HOOK_URL');
    }

    return {
      webhookId:
        normalizeOptionalText(entry.webhookId) ?? `hook_${Date.now()}_${index}`,
      eventType,
      url,
      enabled: parseBoolean(entry.enabled) ?? true,
      secretLabel: normalizeOptionalText(entry.secretLabel) ?? null,
      createdAt:
        normalizeOptionalText(entry.createdAt) ?? new Date().toISOString(),
      lastTriggeredAt: normalizeOptionalText(entry.lastTriggeredAt) ?? null,
    };
  });
}

function parseSubprocessors(
  value: unknown,
): EnterpriseWorkspaceSettings['procurement']['subprocessors'] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('INVALID_SUBPROCESSORS');
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error('INVALID_SUBPROCESSORS');
    }

    const name = normalizeOptionalText(entry.name);
    const region = normalizeOptionalText(entry.region);
    const purpose = normalizeOptionalText(entry.purpose);
    if (!name || !region || !purpose) {
      throw new Error('INVALID_SUBPROCESSORS');
    }

    return {
      name,
      region,
      purpose,
      url: parseOptionalHttpsUrl(entry.url, 'Subprocessor-URL') ?? null,
    };
  });
}

function coerceSettingsUpdates(
  payload: unknown,
): EnterpriseWorkspaceSettingsUpdate {
  if (!isRecord(payload)) {
    throw new Error('INVALID_SETTINGS_PAYLOAD');
  }

  const updates: EnterpriseWorkspaceSettingsUpdate = {};

  if (isRecord(payload.identityProvider)) {
    const mode = payload.identityProvider.mode;
    if (
      mode !== undefined &&
      mode !== 'disabled' &&
      mode !== 'saml' &&
      mode !== 'oidc'
    ) {
      throw new Error('INVALID_IDENTITY_PROVIDER_MODE');
    }

    const status = payload.identityProvider.status;
    if (
      status !== undefined &&
      status !== 'draft' &&
      status !== 'configured'
    ) {
      throw new Error('INVALID_IDENTITY_PROVIDER_STATUS');
    }

    updates.identityProvider = {
      ...(mode !== undefined ? { mode } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(normalizeOptionalText(payload.identityProvider.displayName) !== undefined
        ? { displayName: normalizeOptionalText(payload.identityProvider.displayName) ?? null }
        : {}),
      ...(normalizeOptionalText(payload.identityProvider.entityId) !== undefined
        ? { entityId: normalizeOptionalText(payload.identityProvider.entityId) ?? null }
        : {}),
      ...(parseOptionalHttpsUrl(payload.identityProvider.metadataUrl, 'Metadata-URL') !== undefined
        ? { metadataUrl: parseOptionalHttpsUrl(payload.identityProvider.metadataUrl, 'Metadata-URL') ?? null }
        : {}),
      ...(parseOptionalHttpsUrl(payload.identityProvider.ssoUrl, 'SSO-URL') !== undefined
        ? { ssoUrl: parseOptionalHttpsUrl(payload.identityProvider.ssoUrl, 'SSO-URL') ?? null }
        : {}),
      ...(normalizeOptionalText(payload.identityProvider.issuer) !== undefined
        ? { issuer: normalizeOptionalText(payload.identityProvider.issuer) ?? null }
        : {}),
      ...(normalizeOptionalText(payload.identityProvider.clientId) !== undefined
        ? { clientId: normalizeOptionalText(payload.identityProvider.clientId) ?? null }
        : {}),
      ...(normalizeOptionalText(payload.identityProvider.audience) !== undefined
        ? { audience: normalizeOptionalText(payload.identityProvider.audience) ?? null }
        : {}),
      ...(normalizeOptionalText(payload.identityProvider.groupsAttribute) !== undefined
        ? {
            groupsAttribute:
              normalizeOptionalText(payload.identityProvider.groupsAttribute) ??
              null,
          }
        : {}),
      ...(parseRoleMappings(payload.identityProvider.roleMappings) !== undefined
        ? { roleMappings: parseRoleMappings(payload.identityProvider.roleMappings) ?? [] }
        : {}),
    };
  }

  if (isRecord(payload.scim)) {
    const status = payload.scim.status;
    if (
      status !== undefined &&
      status !== 'disconnected' &&
      status !== 'ready' &&
      status !== 'error'
    ) {
      throw new Error('INVALID_SCIM_STATUS');
    }

    const defaultRole = parseManagedRole(payload.scim.defaultRole);
    updates.scim = {
      ...(parseBoolean(payload.scim.enabled) !== undefined
        ? { enabled: parseBoolean(payload.scim.enabled) }
        : {}),
      ...(status !== undefined ? { status } : {}),
      ...(parseOptionalHttpsUrl(payload.scim.baseUrl, 'SCIM-URL') !== undefined
        ? { baseUrl: parseOptionalHttpsUrl(payload.scim.baseUrl, 'SCIM-URL') ?? null }
        : {}),
      ...(normalizeOptionalText(payload.scim.tokenLabel) !== undefined
        ? { tokenLabel: normalizeOptionalText(payload.scim.tokenLabel) ?? null }
        : {}),
      ...(parseBoolean(payload.scim.syncGroups) !== undefined
        ? { syncGroups: parseBoolean(payload.scim.syncGroups) }
        : {}),
      ...(defaultRole !== undefined ? { defaultRole } : {}),
      ...(parseRoleMappings(payload.scim.groupMappings) !== undefined
        ? { groupMappings: parseRoleMappings(payload.scim.groupMappings) ?? [] }
        : {}),
      ...(normalizeOptionalText(payload.scim.lastSyncAt) !== undefined
        ? { lastSyncAt: normalizeOptionalText(payload.scim.lastSyncAt) ?? null }
        : {}),
    };
  }

  if (isRecord(payload.approvalPolicy)) {
    const externalSubmissions = payload.approvalPolicy.externalSubmissions;
    const governanceSignOff = payload.approvalPolicy.governanceSignOff;

    if (
      externalSubmissions !== undefined &&
      externalSubmissions !== 'none' &&
      externalSubmissions !== 'reviewer' &&
      externalSubmissions !== 'reviewer_plus_officer' &&
      externalSubmissions !== 'admin'
    ) {
      throw new Error('INVALID_EXTERNAL_APPROVAL_MODE');
    }

    if (
      governanceSignOff !== undefined &&
      governanceSignOff !== 'none' &&
      governanceSignOff !== 'admin' &&
      governanceSignOff !== 'external_officer'
    ) {
      throw new Error('INVALID_GOVERNANCE_SIGNOFF_MODE');
    }

    updates.approvalPolicy = {
      ...(externalSubmissions !== undefined ? { externalSubmissions } : {}),
      ...(governanceSignOff !== undefined ? { governanceSignOff } : {}),
      ...(parseBoolean(payload.approvalPolicy.autoCreateUseCaseOnApproval) !==
      undefined
        ? {
            autoCreateUseCaseOnApproval:
              parseBoolean(payload.approvalPolicy.autoCreateUseCaseOnApproval),
          }
        : {}),
    };
  }

  if (isRecord(payload.retentionPolicy)) {
    updates.retentionPolicy = {
      ...(parsePositiveInteger(payload.retentionPolicy.immutableAuditExportsDays) !==
      undefined
        ? {
            immutableAuditExportsDays: parsePositiveInteger(
              payload.retentionPolicy.immutableAuditExportsDays,
            ),
          }
        : {}),
      ...(parsePositiveInteger(payload.retentionPolicy.externalSubmissionDays) !==
      undefined
        ? {
            externalSubmissionDays: parsePositiveInteger(
              payload.retentionPolicy.externalSubmissionDays,
            ),
          }
        : {}),
      ...(parsePositiveInteger(payload.retentionPolicy.reviewArtifactsDays) !==
      undefined
        ? {
            reviewArtifactsDays: parsePositiveInteger(
              payload.retentionPolicy.reviewArtifactsDays,
            ),
          }
        : {}),
      ...(parsePositiveInteger(payload.retentionPolicy.incidentLogDays) !==
      undefined
        ? {
            incidentLogDays: parsePositiveInteger(
              payload.retentionPolicy.incidentLogDays,
            ),
          }
        : {}),
      ...(parseBoolean(payload.retentionPolicy.legalHold) !== undefined
        ? { legalHold: parseBoolean(payload.retentionPolicy.legalHold) }
        : {}),
    };
  }

  if (isRecord(payload.notifications)) {
    const emailDigest = payload.notifications.emailDigest;
    if (
      emailDigest !== undefined &&
      emailDigest !== 'disabled' &&
      emailDigest !== 'daily' &&
      emailDigest !== 'weekly'
    ) {
      throw new Error('INVALID_EMAIL_DIGEST');
    }

    updates.notifications = {
      ...(emailDigest !== undefined ? { emailDigest } : {}),
      ...(parseHooks(payload.notifications.hooks) !== undefined
        ? { hooks: parseHooks(payload.notifications.hooks) ?? [] }
        : {}),
    };
  }

  if (isRecord(payload.procurement)) {
    updates.procurement = {
      ...(parseOptionalHttpsUrl(payload.procurement.dpaUrl, 'DPA-URL') !== undefined
        ? { dpaUrl: parseOptionalHttpsUrl(payload.procurement.dpaUrl, 'DPA-URL') ?? null }
        : {}),
      ...(parseOptionalHttpsUrl(payload.procurement.sccUrl, 'SCC-URL') !== undefined
        ? { sccUrl: parseOptionalHttpsUrl(payload.procurement.sccUrl, 'SCC-URL') ?? null }
        : {}),
      ...(parseOptionalHttpsUrl(
        payload.procurement.subprocessorDirectoryUrl,
        'Unterauftragsverarbeiter-URL',
      ) !== undefined
        ? {
            subprocessorDirectoryUrl:
              parseOptionalHttpsUrl(
                payload.procurement.subprocessorDirectoryUrl,
                'Unterauftragsverarbeiter-URL',
              ) ??
              null,
          }
        : {}),
      ...(parseSubprocessors(payload.procurement.subprocessors) !== undefined
        ? {
            subprocessors:
              parseSubprocessors(payload.procurement.subprocessors) ?? [],
          }
        : {}),
      ...(normalizeOptionalText(payload.procurement.securityContactName) !== undefined
        ? {
            securityContactName:
              normalizeOptionalText(payload.procurement.securityContactName) ??
              null,
          }
        : {}),
      ...(parseOptionalEmail(payload.procurement.securityContactEmail) !== undefined
        ? {
            securityContactEmail:
              parseOptionalEmail(payload.procurement.securityContactEmail) ??
              null,
          }
        : {}),
      ...(parseOptionalHttpsUrl(payload.procurement.securityContactUrl, 'Security-URL') !== undefined
        ? {
            securityContactUrl:
              parseOptionalHttpsUrl(payload.procurement.securityContactUrl, 'Security-URL') ??
              null,
          }
        : {}),
      ...(parseOptionalHttpsUrl(payload.procurement.incidentReportingUrl, 'Incident-Reporting-URL') !== undefined
        ? {
            incidentReportingUrl:
              parseOptionalHttpsUrl(
                payload.procurement.incidentReportingUrl,
                'Incident-Reporting-URL',
              ) ??
              null,
          }
        : {}),
      ...(parseOptionalEmail(payload.procurement.incidentReportingEmail) !== undefined
        ? {
            incidentReportingEmail:
              parseOptionalEmail(payload.procurement.incidentReportingEmail) ??
              null,
          }
        : {}),
      ...(normalizeOptionalText(payload.procurement.retentionSummary) !== undefined
        ? {
            retentionSummary:
              normalizeOptionalText(payload.procurement.retentionSummary) ?? null,
          }
        : {}),
      ...(parseOptionalHttpsUrl(
        payload.procurement.documentationPortalUrl,
        'Dokumentations-Portal-URL',
      ) !== undefined
        ? {
            documentationPortalUrl:
              parseOptionalHttpsUrl(
                payload.procurement.documentationPortalUrl,
                'Dokumentations-Portal-URL',
              ) ??
              null,
          }
        : {}),
    };
  }

  return updates;
}

function handleWorkspaceRouteError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Organisationseinstellungen konnten nicht verarbeitet werden.' },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.startsWith('INVALID_')) {
    return NextResponse.json(
      { error: 'Organisationseinstellungen konnten nicht verarbeitet werden.' },
      { status: 400 },
    );
  }

  console.error('Workspace settings route failed:', error);
  return NextResponse.json(
    { error: 'Workspace-Einstellungen konnten nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    await requireWorkspaceMember(req.headers.get('authorization'), orgId);
    const workspace = await getWorkspaceRecord(orgId);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace nicht gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      workspace: {
        orgId: workspace.orgId,
        name: workspace.name,
        ownerUserId: workspace.ownerUserId,
        plan: workspace.plan,
      },
      settings: workspace.enterpriseSettings,
    });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;

  try {
    const authorization = await requireWorkspaceAdmin(
      req.headers.get('authorization'),
      orgId,
    );
    const updates = coerceSettingsUpdates(await req.json());
    const settings = await updateWorkspaceEnterpriseSettings({
      orgId,
      actorUserId: authorization.user.uid,
      updates,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleWorkspaceRouteError(error);
  }
}
