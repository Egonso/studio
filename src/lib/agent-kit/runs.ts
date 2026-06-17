import '@/lib/server-only-guard';

import { randomBytes } from 'node:crypto';

import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import {
  isPersonalAgentKitScope,
  type AgentKitApiKeyRecord,
} from '@/lib/agent-kit/api-keys';
import {
  resolveAgentOperatorRegisterLocation,
  toAgentOperatorRegisterView,
  toAgentOperatorRegisterViewForLocation,
  type AgentOperatorRegisterView,
} from '@/lib/agent-kit/operator';
import { sanitizeFirestorePayload } from '@/lib/register-first/firestore-sanitize';
import type { ServerRegisterLocation } from '@/lib/register-first/register-admin';

export const AGENT_OPERATOR_RUN_STATUS_VALUES = [
  'running',
  'needs_review',
  'no_candidates',
  'completed',
  'failed',
] as const;

export type AgentOperatorRunStatus =
  (typeof AGENT_OPERATOR_RUN_STATUS_VALUES)[number];

export interface AgentOperatorRunSource {
  agent: string;
  localRunPath: string | null;
}

export interface AgentOperatorRunSkippedSource {
  source: string;
  resolvedPath: string | null;
  reason: string;
}

export interface AgentOperatorRunRecord {
  runId: string;
  registerId: string;
  ownerId: string;
  workspaceId: string | null;
  status: AgentOperatorRunStatus;
  mode: string | null;
  cadence: string | null;
  startedAt: string;
  completedAt: string | null;
  sourceCount: number;
  evidenceCount: number;
  candidateCount: number;
  reviewQuestionCount: number;
  skippedSourceCount: number;
  skippedSources: AgentOperatorRunSkippedSource[];
  error: string | null;
  source: AgentOperatorRunSource;
  createdAt: string;
  updatedAt: string;
  createdByKeyId: string;
  createdByUserId: string;
  createdByEmail: string | null;
}

export interface AgentOperatorRunSummary {
  runId: string;
  registerId: string;
  status: AgentOperatorRunStatus;
  mode: string | null;
  cadence: string | null;
  startedAt: string;
  completedAt: string | null;
  sourceCount: number;
  evidenceCount: number;
  candidateCount: number;
  reviewQuestionCount: number;
  skippedSourceCount: number;
  error: string | null;
  source: AgentOperatorRunSource;
  createdAt: string;
  updatedAt: string;
}

export interface AgentOperatorRunListResult {
  register: AgentOperatorRegisterView;
  runs: AgentOperatorRunSummary[];
  count: number;
  limit: number;
}

export interface AgentOperatorRunDetailResult {
  register: AgentOperatorRegisterView;
  run: AgentOperatorRunRecord;
}

const DEFAULT_RUN_LIMIT = 25;
const MAX_RUN_LIMIT = 100;

const agentOperatorRunSourceSchema = z.object({
  agent: z.string().trim().min(1).max(120).default('studio-agent'),
  localRunPath: z.string().trim().min(1).max(1000).optional().nullable(),
});

const agentOperatorRunSkippedSourceSchema = z.object({
  source: z.string().trim().min(1).max(1000),
  resolvedPath: z.string().trim().min(1).max(1000).optional().nullable(),
  reason: z.string().trim().min(1).max(300),
});

export const agentOperatorRunPayloadSchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  runId: z.string().trim().min(1).max(200).optional(),
  status: z.enum(AGENT_OPERATOR_RUN_STATUS_VALUES),
  mode: z.string().trim().min(1).max(120).optional().nullable(),
  cadence: z.string().trim().min(1).max(120).optional().nullable(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional().nullable(),
  sourceCount: z.number().int().min(0).max(10000).optional().default(0),
  evidenceCount: z.number().int().min(0).max(10000).optional().default(0),
  candidateCount: z.number().int().min(0).max(10000).optional().default(0),
  reviewQuestionCount: z.number().int().min(0).max(10000).optional().default(0),
  skippedSourceCount: z.number().int().min(0).max(10000).optional().default(0),
  skippedSources: z.array(agentOperatorRunSkippedSourceSchema).max(50).optional(),
  error: z.string().trim().min(1).max(1000).optional().nullable(),
  source: agentOperatorRunSourceSchema.optional(),
});

export const agentOperatorRunUpdatePayloadSchema = agentOperatorRunPayloadSchema
  .omit({
    registerId: true,
    runId: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Mindestens ein Run-Feld muss aktualisiert werden.',
  });

export type AgentOperatorRunPayload = z.infer<
  typeof agentOperatorRunPayloadSchema
>;

export type AgentOperatorRunUpdatePayload = z.infer<
  typeof agentOperatorRunUpdatePayloadSchema
>;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCount(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN) || value == null || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeSkippedSources(
  value: readonly z.infer<typeof agentOperatorRunSkippedSourceSchema>[] | null | undefined,
): AgentOperatorRunSkippedSource[] {
  return (value ?? []).slice(0, 50).map((source) => ({
    source: source.source.trim(),
    resolvedPath: normalizeOptionalText(source.resolvedPath ?? null),
    reason: source.reason.trim(),
  }));
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN) || !value || value <= 0) {
    return DEFAULT_RUN_LIMIT;
  }

  return Math.min(Math.floor(value), MAX_RUN_LIMIT);
}

function createRunId(now: Date): string {
  return `arun_${now.getTime().toString(36)}_${randomBytes(6).toString('hex')}`;
}

function runCollection(location: ServerRegisterLocation) {
  return db.collection(
    `users/${location.ownerId}/registers/${location.registerId}/agentRuns`,
  );
}

function getRunScopeTypeForRecord(
  record: AgentKitApiKeyRecord,
): AgentOperatorRegisterView['scopeType'] {
  return isPersonalAgentKitScope(record.orgId, record.createdByUserId)
    ? 'personal'
    : 'workspace';
}

function toRunSummary(run: AgentOperatorRunRecord): AgentOperatorRunSummary {
  return {
    runId: run.runId,
    registerId: run.registerId,
    status: run.status,
    mode: run.mode,
    cadence: run.cadence,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    sourceCount: run.sourceCount,
    evidenceCount: run.evidenceCount,
    candidateCount: run.candidateCount,
    reviewQuestionCount: run.reviewQuestionCount,
    skippedSourceCount: run.skippedSourceCount,
    error: run.error,
    source: run.source,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export function buildAgentOperatorRunRecord(input: {
  payload: AgentOperatorRunPayload;
  location: ServerRegisterLocation;
  record: AgentKitApiKeyRecord;
  now?: Date;
}): AgentOperatorRunRecord {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const startedAt = input.payload.startedAt ?? nowIso;
  const skippedSources = normalizeSkippedSources(input.payload.skippedSources);

  return {
    runId: input.payload.runId ?? createRunId(now),
    registerId: input.location.registerId,
    ownerId: input.location.ownerId,
    workspaceId: input.location.register.workspaceId ?? null,
    status: input.payload.status,
    mode: normalizeOptionalText(input.payload.mode ?? null),
    cadence: normalizeOptionalText(input.payload.cadence ?? null),
    startedAt,
    completedAt: normalizeOptionalText(input.payload.completedAt ?? null),
    sourceCount: normalizeCount(input.payload.sourceCount),
    evidenceCount: normalizeCount(input.payload.evidenceCount),
    candidateCount: normalizeCount(input.payload.candidateCount),
    reviewQuestionCount: normalizeCount(input.payload.reviewQuestionCount),
    skippedSourceCount:
      input.payload.skippedSourceCount === undefined
        ? skippedSources.length
        : normalizeCount(input.payload.skippedSourceCount),
    skippedSources,
    error: normalizeOptionalText(input.payload.error ?? null),
    source: {
      agent: input.payload.source?.agent ?? 'studio-agent',
      localRunPath: normalizeOptionalText(
        input.payload.source?.localRunPath ?? null,
      ),
    },
    createdAt: nowIso,
    updatedAt: nowIso,
    createdByKeyId: input.record.keyId,
    createdByUserId: input.record.createdByUserId,
    createdByEmail: normalizeOptionalText(input.record.createdByEmail ?? null),
  };
}

export function parseAgentOperatorRunRecord(
  input: unknown,
): AgentOperatorRunRecord {
  const parsed = z
    .object({
      runId: z.string().trim().min(1).max(200),
      registerId: z.string().trim().min(1).max(200),
      ownerId: z.string().trim().min(1).max(200),
      workspaceId: z.string().trim().min(1).max(200).nullable().optional(),
      status: z.enum(AGENT_OPERATOR_RUN_STATUS_VALUES),
      mode: z.string().trim().min(1).max(120).nullable().optional(),
      cadence: z.string().trim().min(1).max(120).nullable().optional(),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().nullable().optional(),
      sourceCount: z.number().int().min(0).optional(),
      evidenceCount: z.number().int().min(0).optional(),
      candidateCount: z.number().int().min(0).optional(),
      reviewQuestionCount: z.number().int().min(0).optional(),
      skippedSourceCount: z.number().int().min(0).optional(),
      skippedSources: z.array(agentOperatorRunSkippedSourceSchema).optional(),
      error: z.string().trim().min(1).max(1000).nullable().optional(),
      source: agentOperatorRunSourceSchema.default({ agent: 'studio-agent' }),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      createdByKeyId: z.string().trim().min(1).max(200),
      createdByUserId: z.string().trim().min(1).max(200),
      createdByEmail: z.string().trim().min(1).max(320).nullable().optional(),
    })
    .parse(input);

  return {
    runId: parsed.runId,
    registerId: parsed.registerId,
    ownerId: parsed.ownerId,
    workspaceId: parsed.workspaceId ?? null,
    status: parsed.status,
    mode: parsed.mode ?? null,
    cadence: parsed.cadence ?? null,
    startedAt: parsed.startedAt,
    completedAt: parsed.completedAt ?? null,
    sourceCount: parsed.sourceCount ?? 0,
    evidenceCount: parsed.evidenceCount ?? 0,
    candidateCount: parsed.candidateCount ?? 0,
    reviewQuestionCount: parsed.reviewQuestionCount ?? 0,
    skippedSourceCount: parsed.skippedSourceCount ?? 0,
    skippedSources: normalizeSkippedSources(parsed.skippedSources),
    error: parsed.error ?? null,
    source: {
      agent: parsed.source.agent,
      localRunPath: parsed.source.localRunPath ?? null,
    },
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    createdByKeyId: parsed.createdByKeyId,
    createdByUserId: parsed.createdByUserId,
    createdByEmail: parsed.createdByEmail ?? null,
  };
}

export async function createAgentOperatorRun(input: {
  record: AgentKitApiKeyRecord;
  payload: AgentOperatorRunPayload;
}): Promise<AgentOperatorRunDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.payload.registerId,
  );
  if (!location) {
    return null;
  }

  const run = buildAgentOperatorRunRecord({
    payload: input.payload,
    location,
    record: input.record,
  });

  await runCollection(location)
    .doc(run.runId)
    .set(sanitizeFirestorePayload(run), { merge: false });

  return {
    register: toAgentOperatorRegisterView(input.record, location),
    run,
  };
}

export async function listAgentOperatorRuns(input: {
  record: AgentKitApiKeyRecord;
  registerId: string;
  limit?: number | null;
}): Promise<AgentOperatorRunListResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  return listAgentOperatorRunsForLocation({
    location,
    scopeType: getRunScopeTypeForRecord(input.record),
    limit: input.limit,
  });
}

export async function listAgentOperatorRunsForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  limit?: number | null;
}): Promise<AgentOperatorRunListResult> {
  const limit = normalizeLimit(input.limit);
  const snapshot = await runCollection(input.location)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();
  const runs = snapshot.docs
    .map((document) => {
      try {
        return parseAgentOperatorRunRecord(document.data());
      } catch (error) {
        console.warn('Skipping invalid operator run', {
          registerId: input.location.registerId,
          documentId: document.id,
          error,
        });
        return null;
      }
    })
    .filter((run): run is AgentOperatorRunRecord => run !== null)
    .map(toRunSummary);

  return {
    register: toAgentOperatorRegisterViewForLocation(
      input.location,
      input.scopeType,
    ),
    runs,
    count: runs.length,
    limit,
  };
}

export async function getAgentOperatorRun(input: {
  record: AgentKitApiKeyRecord;
  registerId: string;
  runId: string;
}): Promise<AgentOperatorRunDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  return getAgentOperatorRunForLocation({
    location,
    scopeType: getRunScopeTypeForRecord(input.record),
    runId: input.runId,
  });
}

export async function getAgentOperatorRunForLocation(input: {
  location: ServerRegisterLocation;
  scopeType: AgentOperatorRegisterView['scopeType'];
  runId: string;
}): Promise<AgentOperatorRunDetailResult | null> {
  const snapshot = await runCollection(input.location).doc(input.runId).get();
  if (!snapshot.exists) {
    return null;
  }

  return {
    register: toAgentOperatorRegisterViewForLocation(
      input.location,
      input.scopeType,
    ),
    run: parseAgentOperatorRunRecord(snapshot.data()),
  };
}

export async function updateAgentOperatorRun(input: {
  record: AgentKitApiKeyRecord;
  registerId: string;
  runId: string;
  payload: AgentOperatorRunUpdatePayload;
}): Promise<AgentOperatorRunDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    input.record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  const ref = runCollection(location).doc(input.runId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    return null;
  }

  const current = parseAgentOperatorRunRecord(snapshot.data());
  const updatedAt = new Date().toISOString();
  const skippedSources =
    input.payload.skippedSources === undefined
      ? current.skippedSources
      : normalizeSkippedSources(input.payload.skippedSources);
  const run: AgentOperatorRunRecord = {
    ...current,
    status: input.payload.status ?? current.status,
    mode:
      'mode' in input.payload
        ? normalizeOptionalText(input.payload.mode ?? null)
        : current.mode,
    cadence:
      'cadence' in input.payload
        ? normalizeOptionalText(input.payload.cadence ?? null)
        : current.cadence,
    startedAt: input.payload.startedAt ?? current.startedAt,
    completedAt:
      'completedAt' in input.payload
        ? normalizeOptionalText(input.payload.completedAt ?? null)
        : current.completedAt,
    sourceCount:
      input.payload.sourceCount === undefined
        ? current.sourceCount
        : normalizeCount(input.payload.sourceCount),
    evidenceCount:
      input.payload.evidenceCount === undefined
        ? current.evidenceCount
        : normalizeCount(input.payload.evidenceCount),
    candidateCount:
      input.payload.candidateCount === undefined
        ? current.candidateCount
        : normalizeCount(input.payload.candidateCount),
    reviewQuestionCount:
      input.payload.reviewQuestionCount === undefined
        ? current.reviewQuestionCount
        : normalizeCount(input.payload.reviewQuestionCount),
    skippedSourceCount:
      input.payload.skippedSourceCount !== undefined
        ? normalizeCount(input.payload.skippedSourceCount)
        : input.payload.skippedSources !== undefined
          ? skippedSources.length
          : current.skippedSourceCount,
    skippedSources,
    error:
      'error' in input.payload
        ? normalizeOptionalText(input.payload.error ?? null)
        : current.error,
    source:
      input.payload.source === undefined
        ? current.source
        : {
            agent: input.payload.source.agent ?? current.source.agent,
            localRunPath: normalizeOptionalText(
              input.payload.source.localRunPath ?? null,
            ),
          },
    updatedAt,
  };

  await ref.set(
    sanitizeFirestorePayload({
      status: run.status,
      mode: run.mode,
      cadence: run.cadence,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      sourceCount: run.sourceCount,
      evidenceCount: run.evidenceCount,
      candidateCount: run.candidateCount,
      reviewQuestionCount: run.reviewQuestionCount,
      skippedSourceCount: run.skippedSourceCount,
      skippedSources: run.skippedSources,
      error: run.error,
      source: run.source,
      updatedAt,
    }),
    { merge: true },
  );

  return {
    register: toAgentOperatorRegisterView(input.record, location),
    run,
  };
}
