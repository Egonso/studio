import '@/lib/server-only-guard';

import { db } from '@/lib/firebase-admin';
import {
  isPersonalAgentKitScope,
  touchAgentKitApiKeyUsage,
  type AgentKitApiKeyRecord,
} from '@/lib/agent-kit/api-keys';
import {
  findRegisterLocationById,
  listPersonalRegisters,
  listWorkspaceRegisters,
  type ServerRegisterLocation,
} from '@/lib/register-first/register-admin';
import { parseUseCaseCard } from '@/lib/register-first/schema';
import {
  getUseCaseSystemsSummary,
  resolveUseCaseSystemEntries,
} from '@/lib/register-first/systems';
import {
  resolveDataCategories,
  resolveDecisionInfluence,
  type RegisterUseCaseStatus,
  type UseCaseCard,
} from '@/lib/register-first/types';

export interface AgentOperatorRegisterView {
  registerId: string;
  name: string;
  organisationName: string | null;
  organisationUnit: string | null;
  workspaceId: string | null;
  createdAt: string;
  ownerId: string;
  scopeType: 'personal' | 'workspace';
}

export interface AgentOperatorUseCaseSummary {
  useCaseId: string;
  purpose: string;
  status: RegisterUseCaseStatus;
  createdAt: string;
  updatedAt: string;
  systemSummary: string;
  systems: Array<{
    position: number;
    displayName: string;
    toolId: string | null;
    toolFreeText: string | null;
  }>;
  usageContexts: UseCaseCard['usageContexts'];
  decisionInfluence: ReturnType<typeof resolveDecisionInfluence> | null;
  dataCategories: ReturnType<typeof resolveDataCategories>;
  responsibility: UseCaseCard['responsibility'];
  evidenceCount: number;
  reviewHintCount: number;
  labels: NonNullable<UseCaseCard['labels']>;
  origin: UseCaseCard['origin'] | null;
}

export interface AgentOperatorUseCaseDetail
  extends AgentOperatorUseCaseSummary {
  reviewHints: UseCaseCard['reviewHints'];
  evidences: UseCaseCard['evidences'];
  reviews: UseCaseCard['reviews'];
  proof: UseCaseCard['proof'];
  workflow: UseCaseCard['workflow'] | null;
  card: UseCaseCard;
}

export interface AgentOperatorUseCaseFilters {
  registerId: string;
  status?: RegisterUseCaseStatus | null;
  searchText?: string | null;
  limit?: number | null;
}

export interface AgentOperatorUseCaseListResult {
  register: AgentOperatorRegisterView;
  useCases: AgentOperatorUseCaseSummary[];
  count: number;
  limit: number;
}

export interface AgentOperatorUseCaseDetailResult {
  register: AgentOperatorRegisterView;
  useCase: AgentOperatorUseCaseDetail;
}

const DEFAULT_OPERATOR_LIMIT = 50;
const MAX_OPERATOR_LIMIT = 200;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOperatorLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN) || !value || value <= 0) {
    return DEFAULT_OPERATOR_LIMIT;
  }

  return Math.min(Math.floor(value), MAX_OPERATOR_LIMIT);
}

function isPersonalScope(record: AgentKitApiKeyRecord): boolean {
  return isPersonalAgentKitScope(record.orgId, record.createdByUserId);
}

function isLocationInRecordScope(
  record: AgentKitApiKeyRecord,
  location: ServerRegisterLocation,
): boolean {
  return isPersonalScope(record)
    ? location.ownerId === record.createdByUserId
    : location.register.workspaceId === record.orgId;
}

function toRegisterView(
  record: AgentKitApiKeyRecord,
  location: ServerRegisterLocation,
): AgentOperatorRegisterView {
  const register = location.register;
  return {
    registerId: location.registerId,
    name: register.name,
    organisationName: register.organisationName ?? null,
    organisationUnit: register.organisationUnit ?? null,
    workspaceId: register.workspaceId ?? null,
    createdAt: register.createdAt,
    ownerId: location.ownerId,
    scopeType: isPersonalScope(record) ? 'personal' : 'workspace',
  };
}

function useCaseMatchesSearch(
  card: UseCaseCard,
  searchText: string | null,
): boolean {
  if (!searchText) {
    return true;
  }

  const systems = resolveUseCaseSystemEntries(card).map(
    (system) => system.displayName,
  );
  const searchable = [
    card.useCaseId,
    card.purpose,
    getUseCaseSystemsSummary(card),
    card.responsibility.responsibleParty ?? '',
    card.responsibility.contactPersonName ?? '',
    ...systems,
    ...(card.reviewHints ?? []),
    ...(card.labels ?? []).map((label) => `${label.key} ${label.value}`),
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes(searchText);
}

export function toAgentOperatorUseCaseSummary(
  card: UseCaseCard,
): AgentOperatorUseCaseSummary {
  const systems = resolveUseCaseSystemEntries(card);
  return {
    useCaseId: card.useCaseId,
    purpose: card.purpose,
    status: card.status,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    systemSummary: getUseCaseSystemsSummary(card),
    systems: systems.map((system) => ({
      position: system.position,
      displayName: system.displayName,
      toolId: system.toolId ?? null,
      toolFreeText: system.toolFreeText ?? null,
    })),
    usageContexts: card.usageContexts,
    decisionInfluence: resolveDecisionInfluence(card) ?? null,
    dataCategories: resolveDataCategories(card),
    responsibility: card.responsibility,
    evidenceCount: card.evidences.length,
    reviewHintCount: card.reviewHints.length,
    labels: card.labels ?? [],
    origin: card.origin ?? null,
  };
}

export function toAgentOperatorUseCaseDetail(
  card: UseCaseCard,
): AgentOperatorUseCaseDetail {
  return {
    ...toAgentOperatorUseCaseSummary(card),
    reviewHints: card.reviewHints,
    evidences: card.evidences,
    reviews: card.reviews,
    proof: card.proof,
    workflow: card.workflow ?? null,
    card,
  };
}

export async function listAgentOperatorRegisters(
  record: AgentKitApiKeyRecord,
): Promise<AgentOperatorRegisterView[]> {
  const locations = isPersonalScope(record)
    ? await listPersonalRegisters(record.createdByUserId)
    : await listWorkspaceRegisters(record.orgId);

  return locations
    .filter((location) => isLocationInRecordScope(record, location))
    .map((location) => toRegisterView(record, location))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function resolveAgentOperatorRegisterLocation(
  record: AgentKitApiKeyRecord,
  registerId: string,
): Promise<ServerRegisterLocation | null> {
  const location = await findRegisterLocationById(registerId, {
    ownerId: isPersonalScope(record) ? record.createdByUserId : undefined,
    workspaceId: isPersonalScope(record) ? undefined : record.orgId,
  });

  if (!location || !isLocationInRecordScope(record, location)) {
    return null;
  }

  return location;
}

async function listUseCaseCards(
  location: ServerRegisterLocation,
  limit: number,
): Promise<UseCaseCard[]> {
  const snapshot = await db
    .collection(
      `users/${location.ownerId}/registers/${location.registerId}/useCases`,
    )
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs
    .map((document) => {
      try {
        return parseUseCaseCard(document.data());
      } catch (error) {
        console.warn('Skipping invalid operator use case card', {
          registerId: location.registerId,
          documentId: document.id,
          error,
        });
        return null;
      }
    })
    .filter((card): card is UseCaseCard => card !== null);
}

export async function listAgentOperatorUseCases(
  record: AgentKitApiKeyRecord,
  filters: AgentOperatorUseCaseFilters,
): Promise<AgentOperatorUseCaseListResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    record,
    filters.registerId,
  );
  if (!location) {
    return null;
  }

  const limit = normalizeOperatorLimit(filters.limit);
  const searchText = normalizeOptionalText(filters.searchText)?.toLowerCase() ?? null;
  const cards = await listUseCaseCards(location, limit);
  const useCases = cards
    .filter((card) => card.isDeleted !== true)
    .filter((card) => (filters.status ? card.status === filters.status : true))
    .filter((card) => useCaseMatchesSearch(card, searchText))
    .map(toAgentOperatorUseCaseSummary);

  return {
    register: toRegisterView(record, location),
    useCases,
    count: useCases.length,
    limit,
  };
}

export async function getAgentOperatorUseCase(
  record: AgentKitApiKeyRecord,
  input: {
    registerId: string;
    useCaseId: string;
  },
): Promise<AgentOperatorUseCaseDetailResult | null> {
  const location = await resolveAgentOperatorRegisterLocation(
    record,
    input.registerId,
  );
  if (!location) {
    return null;
  }

  const snapshot = await db
    .doc(
      `users/${location.ownerId}/registers/${location.registerId}/useCases/${input.useCaseId}`,
    )
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const card = parseUseCaseCard(snapshot.data());
  if (card.isDeleted === true) {
    return null;
  }

  return {
    register: toRegisterView(record, location),
    useCase: toAgentOperatorUseCaseDetail(card),
  };
}

export async function touchAgentOperatorReadUsage(
  record: AgentKitApiKeyRecord,
): Promise<void> {
  await touchAgentKitApiKeyUsage({
    orgId: record.orgId,
    keyId: record.keyId,
  });
}
