/**
 * Register Service – Standalone Business Logic for User-Scoped Registers.
 *
 * Uses the SAME shared pure functions as the Legacy registerFirstService
 * (schema.ts, status-flow.ts, id-generation.ts, use-case-builder.ts)
 * but operates on RegisterScope { userId, registerId } instead of
 * RegisterUseCaseScope { userId, projectId }.
 */
import { ZodError } from 'zod';
import { assertManualGovernanceDecision, parseUseCaseCard } from './schema';
import { createUseCaseOrigin, ensureV1_1Shape } from './migration';
import { isStatusTransitionAllowed } from './status-flow';
import { createManualEditEvent } from './timeline';
import { prepareUseCaseForStorage } from './use-case-builder';
import {
  createFirestoreRegisterRepository,
  createFirestoreRegisterUseCaseRepo,
  createFirestorePublicIndexRepo,
  createFirestoreRegisterAccessCodeRepo,
  type RegisterRepository,
  type RegisterUseCaseRepository,
  type PublicIndexRepository,
  type RegisterAccessCodeRepository,
  type RegisterScope,
  type RegisterUseCaseFilters,
} from './register-repository';
import {
  getRegisterScopeKey,
  loadAccessibleWorkspaceIds,
  parseRegisterScopeFromWorkspaceValue,
  resolveClientRegisterScopeContext,
  type RegisterLocation,
} from './register-scope';
import {
  clearActiveRegisterId,
  getActiveRegisterId,
  setActiveRegisterId,
  getDefaultRegisterId,
  setDefaultRegisterId,
} from './register-settings-client';
import { getRegisterDisplayName } from './register-helpers';
import { getEntitlementAccessPlan } from './entitlement';
import { resolvePrimaryDataCategory } from './types';
import { getActiveWorkspaceId } from '@/lib/workspace-session';
import type {
  ExternalIntakeTrace,
  GovernanceDecisionActor,
  PublicUseCaseIndexEntry,
  Register,
  RegisterEntitlement,
  RegisterUseCaseStatus,
  RegisterAccessCode,
  ReviewEvent,
  StatusChange,
  UseCaseCard,
  RegisterMetrics,
  RegisterDeletionState,
  RegisterScopeContext,
  UseCaseOrigin,
} from './types';

// ── Error Types ─────────────────────────────────────────────────────────────

export type RegisterServiceErrorCode =
  | 'UNAUTHENTICATED'
  | 'REGISTER_NOT_FOUND'
  | 'REGISTER_DELETE_FORBIDDEN'
  | 'REGISTER_CONFIRMATION_MISMATCH'
  | 'USE_CASE_NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'AUTOMATION_FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'PERSISTENCE_FAILED';

export class RegisterServiceError extends Error {
  public readonly code: RegisterServiceErrorCode;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(
    code: RegisterServiceErrorCode,
    message: string,
    options?: { details?: unknown; cause?: unknown },
  ) {
    super(message);
    this.name = 'RegisterServiceError';
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

// ── Service Interface ───────────────────────────────────────────────────────

export interface CreateUseCaseOptions {
  registerId?: string;
  useCaseId?: string;
  scopeContext?: RegisterScopeContext | null;
  origin?: UseCaseOrigin | null;
  capturedBy?: string;
  capturedByName?: string;
  capturedViaCode?: boolean;
  accessCodeLabel?: string;
  externalIntake?: ExternalIntakeTrace | null;
}

export interface UpdateStatusInput {
  registerId?: string;
  scopeContext?: RegisterScopeContext | null;
  useCaseId: string;
  nextStatus: RegisterUseCaseStatus;
  reason?: string;
  actor?: GovernanceDecisionActor;
  reviewedBy?: string;
}

export interface UpdateProofInput {
  registerId?: string;
  scopeContext?: RegisterScopeContext | null;
  useCaseId: string;
  verifyUrl: string;
  isReal: boolean;
  isCurrent: boolean;
  scope: string;
  actor?: GovernanceDecisionActor;
}

export interface UpdateAssessmentInput {
  registerId?: string;
  scopeContext?: RegisterScopeContext | null;
  useCaseId: string;
  actor?: GovernanceDecisionActor;
  core: NonNullable<UseCaseCard['governanceAssessment']>['core'];
  flex?: NonNullable<UseCaseCard['governanceAssessment']>['flex'];
}

export interface SetVisibilityInput {
  registerId?: string;
  scopeContext?: RegisterScopeContext | null;
  useCaseId: string;
  isPublicVisible: boolean;
  /** Resolved tool name for the public index entry */
  resolvedToolName?: string;
}

export interface SealUseCaseInput {
  registerId?: string;
  scopeContext?: RegisterScopeContext | null;
  useCaseId: string;
  officerId: string;
  officerName: string;
}

export interface DeleteRegisterInput {
  registerId: string;
  confirmationName: string;
}

export interface RegisterDeleteImpact {
  totalUseCaseCount: number;
  activeUseCaseCount: number;
  publicUseCaseCount: number;
  totalAccessCodeCount: number;
  activeAccessCodeCount: number;
  supplierRequestLinkDisabled: boolean;
}

export interface RegisterDeletePreview {
  registerId: string;
  displayName: string;
  strategy: 'SOFT_DELETE';
  canDelete: boolean;
  blockedReason?: 'LAST_REGISTER';
  fallbackRegisterId: string | null;
  fallbackRegisterName: string | null;
  impact: RegisterDeleteImpact;
  restoreAvailable: true;
}

export interface DeleteRegisterResult {
  deletedRegisterId: string;
  fallbackRegisterId: string;
  fallbackRegisterName: string;
  strategy: 'SOFT_DELETE';
  impact: RegisterDeleteImpact;
}

export interface RegisterService {
  createRegister(
    name: string,
    linkedProjectId?: string | null,
    options?: { scopeContext?: RegisterScopeContext | null },
  ): Promise<Register>;
  listRegisters(scopeContext?: RegisterScopeContext | null): Promise<Register[]>;
  getFirstRegister(
    scopeContext?: RegisterScopeContext | null,
  ): Promise<Register | null>;
  setActiveRegister(
    registerId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<Register>;
  updateRegisterProfile(
    registerId: string,
    profile: Partial<
      Pick<
        Register,
        | 'organisationName'
        | 'organisationUnit'
        | 'publicOrganisationDisclosure'
        | 'orgSettings'
      >
    >,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<void>;
  setRegisterEntitlement(
    registerId: string,
    entitlement: RegisterEntitlement,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<Register>;
  getRegisterDeletionPreview(
    registerId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<RegisterDeletePreview>;
  deleteRegister(
    input: DeleteRegisterInput & { scopeContext?: RegisterScopeContext | null },
  ): Promise<DeleteRegisterResult>;
  restoreRegister(
    registerId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<Register>;
  createUseCaseFromCapture(
    input: unknown,
    options?: CreateUseCaseOptions,
  ): Promise<UseCaseCard>;
  getUseCase(
    registerId: string | undefined,
    useCaseId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<UseCaseCard | null>;
  listUseCases(
    registerId?: string,
    filters?: RegisterUseCaseFilters,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<UseCaseCard[]>;
  updateUseCase(
    useCaseId: string,
    updates: Partial<UseCaseCard>,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<UseCaseCard>;
  updateUseCaseStatusManual(input: UpdateStatusInput): Promise<UseCaseCard>;
  updateProofMetaManual(input: UpdateProofInput): Promise<UseCaseCard>;
  updateAssessmentManual(input: UpdateAssessmentInput): Promise<UseCaseCard>;
  setPublicVisibility(input: SetVisibilityInput): Promise<UseCaseCard>;
  sealUseCaseManual(input: SealUseCaseInput): Promise<UseCaseCard>;
  softDeleteUseCase(
    registerId: string | undefined,
    useCaseId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<void>;
  restoreUseCase(
    registerId: string | undefined,
    useCaseId: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<UseCaseCard>;
  getRegisterMetrics(
    registerId?: string,
    scopeContext?: RegisterScopeContext | null,
  ): Promise<RegisterMetrics>;
}

// ── Dependencies ────────────────────────────────────────────────────────────

type ResolveUserId = () => Promise<string | null>;
type IdGenerator = () => string;
type Clock = () => Date;

interface RegisterServiceDependencies {
  registerRepo?: RegisterRepository;
  useCaseRepo?: RegisterUseCaseRepository;
  publicIndexRepo?: PublicIndexRepository;
  accessCodeRepo?: RegisterAccessCodeRepository;
  resolveUserId?: ResolveUserId;
  now?: Clock;
  useCaseIdGenerator?: IdGenerator;
  reviewIdGenerator?: IdGenerator;
  resolveRequestedScopeContext?: () => Promise<RegisterScopeContext | null>;
  resolveAccessibleWorkspaceIds?: (userId: string) => Promise<string[]>;
  linkRegisterToWorkspace?: (input: {
    orgId: string;
    registerId: string;
  }) => Promise<void>;
  // For tests: override settings resolution
  getDefaultRegisterIdFn?: (
    userId: string,
    scopeKey?: string,
  ) => Promise<string | null>;
  setDefaultRegisterIdFn?: (
    userId: string,
    registerId: string,
    scopeKey?: string,
  ) => Promise<void>;
  getActiveRegisterIdFn?: (scopeKey?: string) => string | null;
  setActiveRegisterIdFn?: (id: string, scopeKey?: string) => void;
  clearActiveRegisterIdFn?: (scopeKey?: string) => void;
}

// ── Factory ─────────────────────────────────────────────────────────────────

function createDefaultIdGenerator(prefix: string): IdGenerator {
  return () => {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  };
}

async function defaultResolveUserId(): Promise<string | null> {
  const { getFirebaseAuth } = await import('@/lib/firebase');
  const auth = await getFirebaseAuth();
  return auth.currentUser?.uid || null;
}

async function defaultResolveRequestedScopeContext(): Promise<RegisterScopeContext | null> {
  return parseRegisterScopeFromWorkspaceValue(getActiveWorkspaceId());
}

async function defaultLinkRegisterToWorkspace(input: {
  orgId: string;
  registerId: string;
}): Promise<void> {
  const { getFirebaseAuth } = await import('@/lib/firebase');
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new RegisterServiceError(
      'UNAUTHENTICATED',
      'A signed-in user is required for workspace register linking.',
    );
  }

  const response = await fetch(`/api/workspaces/${input.orgId}/registers/link`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      registerId: input.registerId,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(
      payload?.error ?? `Workspace register link failed with ${response.status}`,
    );
  }
}

function mapServiceError(error: unknown): RegisterServiceError {
  if (error instanceof RegisterServiceError) return error;
  if (error instanceof ZodError) {
    return new RegisterServiceError(
      'VALIDATION_FAILED',
      'Register payload validation failed.',
      { details: error.flatten(), cause: error },
    );
  }
  return new RegisterServiceError(
    'PERSISTENCE_FAILED',
    'Register operation failed.',
    { cause: error },
  );
}

function appendManualEdit(
  existing: UseCaseCard,
  updated: UseCaseCard,
  input: {
    editedAt: string;
    editedBy: string;
    editedByName?: string | null;
    summary?: string;
  },
): UseCaseCard {
  const manualEdit = createManualEditEvent({
    before: existing,
    after: updated,
    editedAt: input.editedAt,
    editedBy: input.editedBy,
    editedByName: input.editedByName,
    summary: input.summary,
  });

  if (!manualEdit) {
    return updated;
  }

  return parseUseCaseCard({
    ...updated,
    manualEdits: [...(updated.manualEdits ?? []), manualEdit],
  });
}

function sanitizeUseCaseUpdates(
  updates: Partial<UseCaseCard>,
): Partial<UseCaseCard> {
  const {
    useCaseId: _useCaseId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    status: _status,
    reviews: _reviews,
    statusHistory: _statusHistory,
    manualEdits: _manualEdits,
    proof: _proof,
    origin: _origin,
    externalIntake: _externalIntake,
    capturedBy: _capturedBy,
    capturedByName: _capturedByName,
    capturedViaCode: _capturedViaCode,
    accessCodeLabel: _accessCodeLabel,
    sealedAt: _sealedAt,
    sealedBy: _sealedBy,
    sealedByName: _sealedByName,
    sealHash: _sealHash,
    isDeleted: _isDeleted,
    ...safeUpdates
  } = updates;

  return safeUpdates;
}

export function createRegisterService(
  dependencies: RegisterServiceDependencies = {},
): RegisterService {
  const registerRepo =
    dependencies.registerRepo ?? createFirestoreRegisterRepository();
  const useCaseRepo =
    dependencies.useCaseRepo ?? createFirestoreRegisterUseCaseRepo();
  const publicIndexRepo =
    dependencies.publicIndexRepo ?? createFirestorePublicIndexRepo();
  const accessCodeRepo =
    dependencies.accessCodeRepo ?? createFirestoreRegisterAccessCodeRepo();
  const resolveUserId = dependencies.resolveUserId ?? defaultResolveUserId;
  const now = dependencies.now ?? (() => new Date());
  const generateUseCaseId =
    dependencies.useCaseIdGenerator ?? createDefaultIdGenerator('uc');
  const reviewIdGenerator =
    dependencies.reviewIdGenerator ?? createDefaultIdGenerator('review');
  const resolveRequestedScopeContext =
    dependencies.resolveRequestedScopeContext ??
    defaultResolveRequestedScopeContext;
  const resolveAccessibleWorkspaceIds =
    dependencies.resolveAccessibleWorkspaceIds ?? loadAccessibleWorkspaceIds;
  const linkRegisterToWorkspace =
    dependencies.linkRegisterToWorkspace ?? defaultLinkRegisterToWorkspace;

  // Settings resolution (injectable for tests)
  const getDefaultRegId =
    dependencies.getDefaultRegisterIdFn ?? getDefaultRegisterId;
  const setDefaultRegId =
    dependencies.setDefaultRegisterIdFn ?? setDefaultRegisterId;
  const getActiveRegId =
    dependencies.getActiveRegisterIdFn ?? getActiveRegisterId;
  const setActiveRegId =
    dependencies.setActiveRegisterIdFn ?? setActiveRegisterId;
  const clearActiveRegId =
    dependencies.clearActiveRegisterIdFn ?? clearActiveRegisterId;

  interface ResolvedRegisterScope {
    actorUserId: string;
    ownerId: string;
    registerId: string;
    scopeContext: RegisterScopeContext;
  }

  function toStorageScope(scope: ResolvedRegisterScope): RegisterScope {
    return {
      userId: scope.ownerId,
      registerId: scope.registerId,
    };
  }

  async function resolveUserIdOrThrow(): Promise<string> {
    const userId = await resolveUserId();
    if (!userId) {
      throw new RegisterServiceError(
        'UNAUTHENTICATED',
        'A signed-in user is required for Register operations.',
      );
    }
    return userId;
  }

  async function fetchWorkspaceRegisters(
    workspaceId: string,
  ): Promise<RegisterLocation[]> {
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const auth = await getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      throw new RegisterServiceError(
        'UNAUTHENTICATED',
        'A signed-in user is required for workspace register access.',
      );
    }

    const response = await fetch(`/api/workspaces/${workspaceId}/registers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(
        payload?.error ??
          `Workspace register lookup failed with ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      registers: Array<Register & { ownerId?: string | null }>;
    };

    return payload.registers
      .map((register) => {
        const ownerId = register.ownerId?.trim();
        if (!ownerId) {
          return null;
        }

        return {
          ownerId,
          register,
        } satisfies RegisterLocation;
      })
      .filter((location): location is RegisterLocation => location !== null);
  }

  async function findRegisterLocationForScope(
    actorUserId: string,
    registerId: string,
    scopeContext: RegisterScopeContext,
    options?: { includeDeleted?: boolean },
  ): Promise<RegisterLocation | null> {
    let location: RegisterLocation | null = null;

    try {
      location = await registerRepo.findRegisterLocation(registerId, {
        ownerId: scopeContext.kind === 'personal' ? actorUserId : undefined,
        scopeContext,
        includeDeleted: options?.includeDeleted,
      });
    } catch (error) {
      if (scopeContext.kind !== 'workspace') {
        throw error;
      }
    }

    if (location || scopeContext.kind !== 'workspace') {
      return location;
    }

    const workspaceLocations = await fetchWorkspaceRegisters(
      scopeContext.workspaceId!,
    );

    return (
      workspaceLocations.find(
        (entry) => entry.register.registerId === registerId,
      ) ?? null
    );
  }

  function buildRegisterDeleteImpact(
    useCases: UseCaseCard[],
    accessCodes: RegisterAccessCode[],
  ): RegisterDeleteImpact {
    return {
      totalUseCaseCount: useCases.length,
      activeUseCaseCount: useCases.filter((card) => !card.isDeleted).length,
      publicUseCaseCount: useCases.filter(
        (card) =>
          !card.isDeleted && card.isPublicVisible && Boolean(card.publicHashId),
      ).length,
      totalAccessCodeCount: accessCodes.length,
      activeAccessCodeCount: accessCodes.filter((code) => code.isActive).length,
      supplierRequestLinkDisabled: true,
    };
  }

  async function requireRegister(
    ownerId: string,
    registerId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Register> {
    const register = await registerRepo.getRegister(ownerId, registerId, {
      includeDeleted: options?.includeDeleted,
    });

    if (!register) {
      throw new RegisterServiceError(
        'REGISTER_NOT_FOUND',
        `Register '${registerId}' was not found.`,
      );
    }

    return register;
  }

  async function resolveScopeContext(
    explicitScopeContext?: RegisterScopeContext | null,
    actorUserId?: string,
  ): Promise<RegisterScopeContext> {
    const resolvedActorUserId = actorUserId ?? (await resolveUserIdOrThrow());
    const requestedScopeContext =
      explicitScopeContext ?? (await resolveRequestedScopeContext());

    if (requestedScopeContext?.kind !== 'workspace') {
      return { kind: 'personal' };
    }

    const accessibleWorkspaceIds = await resolveAccessibleWorkspaceIds(
      resolvedActorUserId,
    );

    return resolveClientRegisterScopeContext({
      userId: resolvedActorUserId,
      requestedScope: requestedScopeContext,
      accessibleWorkspaceIds,
    });
  }

  async function listRegisterLocations(
    actorUserId: string,
    scopeContext: RegisterScopeContext,
    options?: { includeDeleted?: boolean },
  ): Promise<RegisterLocation[]> {
    if (scopeContext.kind === 'workspace') {
      try {
        const locations = await registerRepo.listWorkspaceRegisters(
          scopeContext.workspaceId!,
          {
            includeDeleted: options?.includeDeleted,
          },
        );

        if (locations.length > 0) {
          return locations;
        }
      } catch {
        // Fall back to the server-side workspace register route below.
      }

      return fetchWorkspaceRegisters(scopeContext.workspaceId!);
    }

    return (await registerRepo.listRegisters(actorUserId, {
      includeDeleted: options?.includeDeleted,
    })).map((register) => ({
      ownerId: actorUserId,
      register,
    }));
  }

  async function setActiveRegisterInternal(
    actorUserId: string,
    registerId: string,
    scopeContext: RegisterScopeContext,
  ): Promise<Register> {
    const location = await findRegisterLocationForScope(
      actorUserId,
      registerId,
      scopeContext,
      { includeDeleted: false },
    );

    if (!location) {
      throw new RegisterServiceError(
        'REGISTER_NOT_FOUND',
        `Register '${registerId}' was not found.`,
      );
    }

    const scopeKey = getRegisterScopeKey(scopeContext);
    await setDefaultRegId(actorUserId, location.register.registerId, scopeKey);
    setActiveRegId(location.register.registerId, scopeKey);
    return location.register;
  }

  async function buildPublicIndexEntry(
    scope: RegisterScope,
    card: UseCaseCard,
    resolvedToolName?: string,
  ): Promise<PublicUseCaseIndexEntry | null> {
    const normalizedCard = ensureV1_1Shape(card);

    if (
      !normalizedCard.publicHashId ||
      !normalizedCard.isPublicVisible ||
      normalizedCard.isDeleted
    ) {
      return null;
    }

    const register = await requireRegister(scope.userId, scope.registerId);
    const organisationName =
      register.publicOrganisationDisclosure && register.organisationName
        ? register.organisationName
        : null;

    return {
      publicHashId: normalizedCard.publicHashId,
      globalUseCaseId: normalizedCard.globalUseCaseId ?? '',
      formatVersion: normalizedCard.formatVersion ?? 'v1.1',
      purpose: normalizedCard.purpose,
      toolName:
        resolvedToolName ??
        normalizedCard.toolFreeText ??
        normalizedCard.toolId ??
        '',
      dataCategory:
        resolvePrimaryDataCategory(normalizedCard) ?? 'INTERNAL_CONFIDENTIAL',
      status: normalizedCard.status,
      createdAt: normalizedCard.createdAt,
      ownerId: scope.userId,
      verification: normalizedCard.proof?.verification ?? null,
      organisationName,
    };
  }

  async function republishRegisterPublicEntries(
    scope: RegisterScope,
  ): Promise<void> {
    const cards = await useCaseRepo.list(scope, { includeDeleted: true });
    for (const card of cards) {
      const entry = await buildPublicIndexEntry(scope, card);
      if (entry) {
        await publicIndexRepo.publishToIndex(entry);
      }
    }
  }

  async function loadDeleteContext(
    actorUserId: string,
    registerId: string,
    scopeContext: RegisterScopeContext,
  ) {
    const location = await findRegisterLocationForScope(
      actorUserId,
      registerId,
      scopeContext,
      { includeDeleted: false },
    );

    if (!location) {
      throw new RegisterServiceError(
        'REGISTER_NOT_FOUND',
        `Register '${registerId}' was not found.`,
      );
    }

    const register = location.register;
    const fallbackRegister =
      (await listRegisterLocations(actorUserId, scopeContext)).find(
        (candidate) => candidate.register.registerId !== registerId,
      ) ?? null;
    const scope: RegisterScope = {
      userId: location.ownerId,
      registerId,
    };
    const [useCases, accessCodes] = await Promise.all([
      useCaseRepo.list(scope, { includeDeleted: true }),
      accessCodeRepo.listCodes(location.ownerId, registerId),
    ]);

    return {
      location,
      register,
      fallbackRegister,
      scope,
      useCases,
      accessCodes,
      impact: buildRegisterDeleteImpact(useCases, accessCodes),
    };
  }

  /**
   * Resolve register scope WITHOUT auto-creating a register.
   * Throws REGISTER_NOT_FOUND if no register can be resolved.
   */
  async function resolveScope(
    registerId?: string,
    explicitScopeContext?: RegisterScopeContext | null,
  ): Promise<ResolvedRegisterScope> {
    const actorUserId = await resolveUserIdOrThrow();
    const scopeContext = await resolveScopeContext(
      explicitScopeContext,
      actorUserId,
    );
    const scopeKey = getRegisterScopeKey(scopeContext);

    if (registerId) {
      const location = await findRegisterLocationForScope(
        actorUserId,
        registerId,
        scopeContext,
        { includeDeleted: false },
      );

      if (!location) {
        throw new RegisterServiceError(
          'REGISTER_NOT_FOUND',
          `Register '${registerId}' was not found.`,
        );
      }

      return {
        actorUserId,
        ownerId: location.ownerId,
        registerId,
        scopeContext,
      };
    }

    const cached = getActiveRegId(scopeKey);
    if (cached) {
      const location = await findRegisterLocationForScope(
        actorUserId,
        cached,
        scopeContext,
        { includeDeleted: false },
      );
      if (location) {
        return {
          actorUserId,
          ownerId: location.ownerId,
          registerId: cached,
          scopeContext,
        };
      }
      clearActiveRegId(scopeKey);
    }

    const persisted = await getDefaultRegId(actorUserId, scopeKey);
    if (persisted) {
      const location = await findRegisterLocationForScope(
        actorUserId,
        persisted,
        scopeContext,
        { includeDeleted: false },
      );
      if (location) {
        setActiveRegId(persisted, scopeKey);
        return {
          actorUserId,
          ownerId: location.ownerId,
          registerId: persisted,
          scopeContext,
        };
      }
    }

    const locations = await listRegisterLocations(actorUserId, scopeContext);
    if (locations.length > 0) {
      const firstLocation = locations[0];
      await setDefaultRegId(
        actorUserId,
        firstLocation.register.registerId,
        scopeKey,
      );
      setActiveRegId(firstLocation.register.registerId, scopeKey);
      return {
        actorUserId,
        ownerId: firstLocation.ownerId,
        registerId: firstLocation.register.registerId,
        scopeContext,
      };
    }

    clearActiveRegId(scopeKey);
    throw new RegisterServiceError(
      'REGISTER_NOT_FOUND',
      'No register found. Please create a register first.',
    );
  }

  return {
    async createRegister(name, linkedProjectId = null, options = {}) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const scopeContext = await resolveScopeContext(
          options.scopeContext,
          actorUserId,
        );
        const scopeKey = getRegisterScopeKey(scopeContext);
        const register = await registerRepo.createRegister(
          actorUserId,
          name,
          linkedProjectId,
          {
            workspaceId:
              scopeContext.kind === 'workspace'
                ? scopeContext.workspaceId
                : null,
          },
        );
        await setDefaultRegId(actorUserId, register.registerId, scopeKey);
        setActiveRegId(register.registerId, scopeKey);
        if (scopeContext.kind === 'workspace') {
          await linkRegisterToWorkspace({
            orgId: scopeContext.workspaceId!,
            registerId: register.registerId,
          });
        }
        return register;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async listRegisters(scopeContext) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          scopeContext,
          actorUserId,
        );
        const locations = await listRegisterLocations(
          actorUserId,
          resolvedScopeContext,
        );
        return locations.map((location) => location.register);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getFirstRegister(scopeContext) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          scopeContext,
          actorUserId,
        );
        const locations = await listRegisterLocations(
          actorUserId,
          resolvedScopeContext,
        );
        return locations[0]?.register ?? null;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async setActiveRegister(registerId, scopeContext) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          scopeContext,
          actorUserId,
        );
        return await setActiveRegisterInternal(
          actorUserId,
          registerId,
          resolvedScopeContext,
        );
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateRegisterProfile(registerId, profile, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        await requireRegister(scope.ownerId, registerId);
        await registerRepo.updateRegister(scope.ownerId, registerId, profile);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async setRegisterEntitlement(registerId, entitlement, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        const register = await requireRegister(scope.ownerId, registerId);
        const nextRegister: Register = {
          ...register,
          plan: getEntitlementAccessPlan(entitlement),
          entitlement,
        };
        await registerRepo.updateRegister(scope.ownerId, registerId, {
          plan: getEntitlementAccessPlan(entitlement),
          entitlement,
        });
        return nextRegister;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getRegisterDeletionPreview(registerId, scopeContext) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          scopeContext,
          actorUserId,
        );
        const { register, fallbackRegister, impact } = await loadDeleteContext(
          actorUserId,
          registerId,
          resolvedScopeContext,
        );

        return {
          registerId: register.registerId,
          displayName: getRegisterDisplayName(register),
          strategy: 'SOFT_DELETE',
          canDelete: Boolean(fallbackRegister?.register),
          blockedReason: fallbackRegister?.register ? undefined : 'LAST_REGISTER',
          fallbackRegisterId: fallbackRegister?.register.registerId ?? null,
          fallbackRegisterName: fallbackRegister?.register
            ? getRegisterDisplayName(fallbackRegister.register)
            : null,
          impact,
          restoreAvailable: true,
        };
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async deleteRegister(input) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          input.scopeContext,
          actorUserId,
        );
        const { location, register, fallbackRegister, useCases, impact } =
          await loadDeleteContext(
            actorUserId,
            input.registerId,
            resolvedScopeContext,
          );

        if (!fallbackRegister?.register) {
          throw new RegisterServiceError(
            'REGISTER_DELETE_FORBIDDEN',
            'The last remaining register cannot be deleted.',
          );
        }

        const expectedName = getRegisterDisplayName(register);
        if (input.confirmationName.trim() !== expectedName) {
          throw new RegisterServiceError(
            'REGISTER_CONFIRMATION_MISMATCH',
            'Register name confirmation did not match.',
          );
        }

        const timestamp = now().toISOString();
        const publicUseCases = useCases.filter(
          (card) => card.isPublicVisible && Boolean(card.publicHashId),
        );

        for (const card of publicUseCases) {
          await publicIndexRepo.unpublishFromIndex(card.publicHashId!);
        }

        const deactivatedAccessCodeCount =
          await accessCodeRepo.deactivateCodesForRegister(
            location.ownerId,
            register.registerId,
            timestamp,
          );

        const deletionState: RegisterDeletionState = {
          strategy: 'SOFT_DELETE',
          deletedAt: timestamp,
          deletedBy: actorUserId,
          totalUseCaseCount: impact.totalUseCaseCount,
          activeUseCaseCount: impact.activeUseCaseCount,
          publicUseCaseCount: impact.publicUseCaseCount,
          totalAccessCodeCount: impact.totalAccessCodeCount,
          deactivatedAccessCodeCount,
          supplierRequestLinkDisabled: true,
        };

        await registerRepo.softDeleteRegister(
          location.ownerId,
          register.registerId,
          deletionState,
        );

        const scopeKey = getRegisterScopeKey(resolvedScopeContext);
        const activeRegisterId = getActiveRegId(scopeKey);
        const defaultRegisterId = await getDefaultRegId(actorUserId, scopeKey);
        if (
          activeRegisterId === register.registerId ||
          defaultRegisterId === register.registerId
        ) {
          await setActiveRegisterInternal(
            actorUserId,
            fallbackRegister.register.registerId,
            resolvedScopeContext,
          );
        }

        return {
          deletedRegisterId: register.registerId,
          fallbackRegisterId: fallbackRegister.register.registerId,
          fallbackRegisterName: getRegisterDisplayName(fallbackRegister.register),
          strategy: 'SOFT_DELETE',
          impact,
        };
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async restoreRegister(registerId, scopeContext) {
      try {
        const actorUserId = await resolveUserIdOrThrow();
        const resolvedScopeContext = await resolveScopeContext(
          scopeContext,
          actorUserId,
        );
        const location = await findRegisterLocationForScope(
          actorUserId,
          registerId,
          resolvedScopeContext,
          { includeDeleted: true },
        );

        if (!location) {
          throw new RegisterServiceError(
            'REGISTER_NOT_FOUND',
            `Register '${registerId}' was not found.`,
          );
        }

        const register = await requireRegister(location.ownerId, registerId, {
          includeDeleted: true,
        });

        if (register.isDeleted !== true) {
          return register;
        }

        const restored = await registerRepo.restoreRegister(
          location.ownerId,
          registerId,
        );
        await accessCodeRepo.restoreCodesForRegister(location.ownerId, registerId);
        await republishRegisterPublicEntries({
          userId: location.ownerId,
          registerId: restored.registerId,
        });
        return restored;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async createUseCaseFromCapture(input, options = {}) {
      try {
        const scope = await resolveScope(
          options.registerId,
          options.scopeContext,
        );
        const storageScope = toStorageScope(scope);
        const useCaseId = options.useCaseId ?? generateUseCaseId();
        const cardDraft = prepareUseCaseForStorage(input, {
          useCaseId,
          now: now(),
        });
        const card = parseUseCaseCard({
          ...cardDraft,
          origin:
            options.origin ??
            createUseCaseOrigin({
              source: options.capturedViaCode
                ? 'access_code'
                : options.externalIntake?.sourceType === 'supplier_request'
                  ? 'supplier_request'
                  : options.externalIntake?.sourceType === 'manual_import'
                    ? 'import'
                    : 'manual',
              submittedByName: options.capturedByName ?? null,
              submittedByEmail:
                options.externalIntake?.submittedByEmail ?? null,
              sourceRequestId:
                options.externalIntake?.submissionId ??
                options.externalIntake?.requestTokenId ??
                options.externalIntake?.accessCodeId ??
                null,
              capturedByUserId: options.capturedBy ?? scope.actorUserId,
            }),
          capturedBy: options.capturedBy ?? scope.actorUserId,
          capturedByName: options.capturedByName,
          capturedViaCode: options.capturedViaCode,
          accessCodeLabel: options.accessCodeLabel,
          externalIntake: options.externalIntake ?? null,
        });
        return useCaseRepo.create(storageScope, card);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getUseCase(registerId, useCaseId, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        return useCaseRepo.getById(toStorageScope(scope), useCaseId);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async listUseCases(registerId, filters = {}, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        return useCaseRepo.list(toStorageScope(scope), filters);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateUseCase(useCaseId, updates, scopeContext) {
      try {
        const scope = await resolveScope(undefined, scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(storageScope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            'Use case not found.',
          );
        }

        const nowIso = now().toISOString();
        const safeUpdates = sanitizeUseCaseUpdates(updates);
        const merged: UseCaseCard = {
          ...existing,
          ...safeUpdates,
          responsibility: {
            ...existing.responsibility,
            ...(safeUpdates.responsibility || {}),
          },
          governanceAssessment: {
            ...existing.governanceAssessment,
            core: existing.governanceAssessment?.core || {},
            flex: existing.governanceAssessment?.flex || {},
            ...(safeUpdates.governanceAssessment || {}),
          },
          updatedAt: nowIso,
        };

        const parsed = parseUseCaseCard(merged);
        const updated = appendManualEdit(existing, parsed, {
          editedAt: nowIso,
          editedBy: scope.actorUserId,
        });
        return await useCaseRepo.save(storageScope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateUseCaseStatusManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? 'HUMAN');
      } catch (error) {
        throw new RegisterServiceError(
          'AUTOMATION_FORBIDDEN',
          'Automated governance decisions are prohibited.',
          { cause: error },
        );
      }

      try {
        const scope = await resolveScope(input.registerId, input.scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(
          storageScope,
          input.useCaseId,
        );
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${input.useCaseId}' was not found.`,
          );
        }

        if (!isStatusTransitionAllowed(existing.status, input.nextStatus)) {
          throw new RegisterServiceError(
            'INVALID_STATUS_TRANSITION',
            `Transition from ${existing.status} to ${input.nextStatus} is not allowed.`,
          );
        }

        if (existing.status === input.nextStatus) return existing;

        if (input.nextStatus === 'UNREVIEWED') {
          throw new RegisterServiceError(
            'INVALID_STATUS_TRANSITION',
            'UNREVIEWED can only be set during initial capture creation.',
          );
        }

        const timestamp = now().toISOString();
        const actorId = input.reviewedBy || scope.actorUserId;
        const reviewEvent: ReviewEvent = {
          reviewId: reviewIdGenerator(),
          reviewedAt: timestamp,
          reviewedBy: actorId,
          nextStatus: input.nextStatus,
          notes: input.reason,
        };

        const statusChange: StatusChange = {
          from: existing.status,
          to: input.nextStatus,
          changedAt: timestamp,
          changedBy: actorId,
          changedByName: actorId,
          reason: input.reason,
        };

        const updated = parseUseCaseCard({
          ...existing,
          status: input.nextStatus,
          updatedAt: timestamp,
          reviews: [...existing.reviews, reviewEvent],
          statusHistory: [...(existing.statusHistory || []), statusChange],
        });

        return useCaseRepo.save(storageScope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateProofMetaManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? 'HUMAN');
      } catch (error) {
        throw new RegisterServiceError(
          'AUTOMATION_FORBIDDEN',
          'Automated governance decisions are prohibited.',
          { cause: error },
        );
      }

      try {
        const scope = await resolveScope(input.registerId, input.scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(
          storageScope,
          input.useCaseId,
        );
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${input.useCaseId}' was not found.`,
          );
        }

        if (existing.status !== 'PROOF_READY') {
          throw new RegisterServiceError(
            'INVALID_STATUS_TRANSITION',
            'Proof metadata can only be updated in status PROOF_READY.',
          );
        }

        const timestamp = now().toISOString();
        const updated = parseUseCaseCard({
          ...existing,
          updatedAt: timestamp,
          proof: {
            verifyUrl: input.verifyUrl.trim(),
            generatedAt: timestamp,
            verification: {
              isReal: input.isReal,
              isCurrent: input.isCurrent,
              scope: input.scope.trim(),
            },
          },
        });

        return useCaseRepo.save(storageScope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateAssessmentManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? 'HUMAN');
      } catch (error) {
        throw new RegisterServiceError(
          'AUTOMATION_FORBIDDEN',
          'Automated governance decisions are prohibited.',
          { cause: error },
        );
      }

      try {
        const scope = await resolveScope(input.registerId, input.scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(
          storageScope,
          input.useCaseId,
        );
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${input.useCaseId}' was not found.`,
          );
        }

        const timestamp = now().toISOString();

        // Merge the existing flex with the new flex (if provided)
        const updatedFlex = {
          ...(existing.governanceAssessment?.flex || {}),
          ...(input.flex || {}),
        };

        const updated = parseUseCaseCard({
          ...existing,
          updatedAt: timestamp,
          governanceAssessment: {
            core: input.core,
            flex: updatedFlex,
          },
        });

        return useCaseRepo.save(
          storageScope,
          appendManualEdit(existing, updated, {
            editedAt: timestamp,
            editedBy: scope.actorUserId,
            summary: 'Governance-Angaben aktualisiert',
          }),
        );
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async setPublicVisibility(input) {
      try {
        const scope = await resolveScope(input.registerId, input.scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(
          storageScope,
          input.useCaseId,
        );
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${input.useCaseId}' was not found.`,
          );
        }

        if (existing.cardVersion !== '1.1') {
          throw new RegisterServiceError(
            'VALIDATION_FAILED',
            'Public visibility requires a v1.1 use case card.',
          );
        }

        const timestamp = now().toISOString();
        const updated = parseUseCaseCard({
          ...existing,
          isPublicVisible: input.isPublicVisible,
          updatedAt: timestamp,
        });
        const updatedWithEdit = appendManualEdit(existing, updated, {
          editedAt: timestamp,
          editedBy: scope.actorUserId,
          summary: input.isPublicVisible
            ? 'Sichtbarkeit auf öffentlich gesetzt'
            : 'Sichtbarkeit auf privat gesetzt',
        });

        // Save private card
        const saved = await useCaseRepo.save(storageScope, updatedWithEdit);

        // Dual-Write: Public Index
        if (input.isPublicVisible && saved.publicHashId) {
          const indexEntry = await buildPublicIndexEntry(
            storageScope,
            saved,
            input.resolvedToolName,
          );
          if (indexEntry) {
            await publicIndexRepo.publishToIndex(indexEntry);
          }
        } else if (!input.isPublicVisible && saved.publicHashId) {
          await publicIndexRepo.unpublishFromIndex(saved.publicHashId);
        }

        return saved;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async sealUseCaseManual(input) {
      try {
        const scope = await resolveScope(input.registerId, input.scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(
          storageScope,
          input.useCaseId,
        );
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${input.useCaseId}' was not found.`,
          );
        }

        const timestamp = now().toISOString();
        const sealHash =
          typeof crypto !== 'undefined' &&
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `seal-${Date.now()}`;

        const updated = parseUseCaseCard({
          ...existing,
          sealedAt: timestamp,
          sealedBy: input.officerId,
          sealedByName: input.officerName,
          sealHash: sealHash,
          updatedAt: timestamp,
        });

        return useCaseRepo.save(storageScope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async softDeleteUseCase(registerId, useCaseId, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(storageScope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${useCaseId}' was not found.`,
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isDeleted: true,
          updatedAt: now().toISOString(),
        });

        await useCaseRepo.save(storageScope, updated);

        // Remove from public index if it was visible
        if (existing.isPublicVisible && existing.publicHashId) {
          await publicIndexRepo.unpublishFromIndex(existing.publicHashId);
          await useCaseRepo.save(
            storageScope,
            parseUseCaseCard({ ...updated, isPublicVisible: false }),
          );
        }
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async restoreUseCase(registerId, useCaseId, scopeContext) {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        const storageScope = toStorageScope(scope);
        const existing = await useCaseRepo.getById(storageScope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            'USE_CASE_NOT_FOUND',
            `Use case '${useCaseId}' was not found.`,
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isDeleted: false,
          updatedAt: now().toISOString(),
        });

        return useCaseRepo.save(storageScope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getRegisterMetrics(
      registerId?: string,
      scopeContext?: RegisterScopeContext | null,
    ): Promise<RegisterMetrics> {
      try {
        const scope = await resolveScope(registerId, scopeContext);
        const activeUseCases = await useCaseRepo.list(toStorageScope(scope), {
          includeDeleted: false,
        });

        let publicCount = 0;
        let prohibited = 0;
        let high = 0;
        let limited = 0;
        let minimal = 0;
        let unassessed = 0;
        let actionItemsCount = 0;

        activeUseCases.forEach((uc) => {
          if (uc.isPublicVisible) publicCount++;

          const cat = uc.governanceAssessment?.core?.aiActCategory;
          if (cat === 'Verboten') prohibited++;
          else if (cat === 'Hochrisiko') high++;
          else if (cat === 'Transparenzpflichten') limited++;
          else if (cat === 'Minimales Risiko') minimal++;
          else unassessed++;

          // A simple rule for action items: if it's high risk but lacks oversight
          if (
            cat === 'Hochrisiko' &&
            (!uc.governanceAssessment?.core?.oversightDefined ||
              !uc.governanceAssessment?.core?.reviewCycleDefined)
          ) {
            actionItemsCount++;
          } else if (!cat) {
            actionItemsCount++; // Unassessed implies action required
          }
        });

        // Simple maturity calculation based on assessed KIs vs total active
        const assessedCount = activeUseCases.length - unassessed;
        const maturityScore =
          activeUseCases.length > 0
            ? Math.round((assessedCount / activeUseCases.length) * 100)
            : 100;

        return {
          totalUseCases: activeUseCases.length,
          activeUseCases: activeUseCases.length,
          publicUseCases: publicCount,
          riskDistribution: {
            prohibited,
            high,
            limited,
            minimal,
            unassessed,
          },
          maturityScore,
          actionItemsCount,
        };
      } catch (error) {
        throw mapServiceError(error);
      }
    },
  };
}

export const registerService = createRegisterService();
