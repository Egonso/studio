/**
 * Register Service – Standalone Business Logic for User-Scoped Registers.
 *
 * Uses the SAME shared pure functions as the Legacy registerFirstService
 * (schema.ts, status-flow.ts, id-generation.ts, use-case-builder.ts)
 * but operates on RegisterScope { userId, registerId } instead of
 * RegisterUseCaseScope { userId, projectId }.
 */
import { ZodError } from "zod";
import {
  assertManualGovernanceDecision,
  parseUseCaseCard,
} from "./schema";
import { isStatusTransitionAllowed } from "./status-flow";
import { prepareUseCaseForStorage } from "./use-case-builder";
import {
  createFirestoreRegisterRepository,
  createFirestoreRegisterUseCaseRepo,
  createFirestorePublicIndexRepo,
  type RegisterRepository,
  type RegisterUseCaseRepository,
  type PublicIndexRepository,
  type RegisterScope,
  type RegisterUseCaseFilters,
} from "./register-repository";
import {
  getActiveRegisterId,
  setActiveRegisterId,
  getDefaultRegisterId,
  setDefaultRegisterId,
} from "./register-settings-client";
import type {
  GovernanceDecisionActor,
  PublicUseCaseIndexEntry,
  Register,
  RegisterUseCaseStatus,
  ReviewEvent,
  StatusChange,
  UseCaseCard,
  RegisterMetrics,
} from "./types";

// ── Error Types ─────────────────────────────────────────────────────────────

export type RegisterServiceErrorCode =
  | "UNAUTHENTICATED"
  | "REGISTER_NOT_FOUND"
  | "USE_CASE_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "AUTOMATION_FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PERSISTENCE_FAILED";

export class RegisterServiceError extends Error {
  public readonly code: RegisterServiceErrorCode;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(
    code: RegisterServiceErrorCode,
    message: string,
    options?: { details?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "RegisterServiceError";
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

// ── Service Interface ───────────────────────────────────────────────────────

export interface CreateUseCaseOptions {
  registerId?: string;
  useCaseId?: string;
  capturedBy?: string;
  capturedByName?: string;
  capturedViaCode?: boolean;
  accessCodeLabel?: string;
}

export interface UpdateStatusInput {
  registerId?: string;
  useCaseId: string;
  nextStatus: RegisterUseCaseStatus;
  reason?: string;
  actor?: GovernanceDecisionActor;
  reviewedBy?: string;
}

export interface UpdateProofInput {
  registerId?: string;
  useCaseId: string;
  verifyUrl: string;
  isReal: boolean;
  isCurrent: boolean;
  scope: string;
  actor?: GovernanceDecisionActor;
}

export interface UpdateAssessmentInput {
  registerId?: string;
  useCaseId: string;
  actor?: GovernanceDecisionActor;
  core: NonNullable<UseCaseCard["governanceAssessment"]>["core"];
  flex?: NonNullable<UseCaseCard["governanceAssessment"]>["flex"];
}

export interface SetVisibilityInput {
  registerId?: string;
  useCaseId: string;
  isPublicVisible: boolean;
  /** Resolved tool name for the public index entry */
  resolvedToolName?: string;
}

export interface RegisterService {
  createRegister(name: string, linkedProjectId?: string | null): Promise<Register>;
  listRegisters(): Promise<Register[]>;
  getFirstRegister(): Promise<Register | null>;
  updateRegisterProfile(
    registerId: string,
    profile: Partial<Pick<Register, "organisationName" | "organisationUnit" | "publicOrganisationDisclosure" | "companyProfile">>
  ): Promise<void>;
  createUseCaseFromCapture(
    input: unknown,
    options?: CreateUseCaseOptions
  ): Promise<UseCaseCard>;
  getUseCase(registerId: string | undefined, useCaseId: string): Promise<UseCaseCard | null>;
  listUseCases(
    registerId?: string,
    filters?: RegisterUseCaseFilters
  ): Promise<UseCaseCard[]>;
  updateUseCase(
    useCaseId: string,
    updates: Partial<UseCaseCard>
  ): Promise<UseCaseCard>;
  updateUseCaseStatusManual(input: UpdateStatusInput): Promise<UseCaseCard>;
  updateProofMetaManual(input: UpdateProofInput): Promise<UseCaseCard>;
  updateAssessmentManual(input: UpdateAssessmentInput): Promise<UseCaseCard>;
  setPublicVisibility(input: SetVisibilityInput): Promise<UseCaseCard>;
  softDeleteUseCase(registerId: string | undefined, useCaseId: string): Promise<void>;
  restoreUseCase(registerId: string | undefined, useCaseId: string): Promise<UseCaseCard>;
  getRegisterMetrics(registerId?: string): Promise<RegisterMetrics>;
}

// ── Dependencies ────────────────────────────────────────────────────────────

type ResolveUserId = () => Promise<string | null>;
type IdGenerator = () => string;
type Clock = () => Date;

interface RegisterServiceDependencies {
  registerRepo?: RegisterRepository;
  useCaseRepo?: RegisterUseCaseRepository;
  publicIndexRepo?: PublicIndexRepository;
  resolveUserId?: ResolveUserId;
  now?: Clock;
  useCaseIdGenerator?: IdGenerator;
  reviewIdGenerator?: IdGenerator;
  // For tests: override settings resolution
  getDefaultRegisterIdFn?: (userId: string) => Promise<string | null>;
  setDefaultRegisterIdFn?: (userId: string, registerId: string) => Promise<void>;
  getActiveRegisterIdFn?: () => string | null;
  setActiveRegisterIdFn?: (id: string) => void;
}

// ── Factory ─────────────────────────────────────────────────────────────────

function createDefaultIdGenerator(prefix: string): IdGenerator {
  return () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  };
}

async function defaultResolveUserId(): Promise<string | null> {
  const { getFirebaseAuth } = await import("@/lib/firebase");
  const auth = await getFirebaseAuth();
  return auth.currentUser?.uid || null;
}

function mapServiceError(error: unknown): RegisterServiceError {
  if (error instanceof RegisterServiceError) return error;
  if (error instanceof ZodError) {
    return new RegisterServiceError(
      "VALIDATION_FAILED",
      "Register payload validation failed.",
      { details: error.flatten(), cause: error }
    );
  }
  return new RegisterServiceError(
    "PERSISTENCE_FAILED",
    "Register operation failed.",
    { cause: error }
  );
}

export function createRegisterService(
  dependencies: RegisterServiceDependencies = {}
): RegisterService {
  const registerRepo = dependencies.registerRepo ?? createFirestoreRegisterRepository();
  const useCaseRepo = dependencies.useCaseRepo ?? createFirestoreRegisterUseCaseRepo();
  const publicIndexRepo = dependencies.publicIndexRepo ?? createFirestorePublicIndexRepo();
  const resolveUserId = dependencies.resolveUserId ?? defaultResolveUserId;
  const now = dependencies.now ?? (() => new Date());
  const useCaseIdGenerator = dependencies.useCaseIdGenerator ?? createDefaultIdGenerator("uc");
  const reviewIdGenerator = dependencies.reviewIdGenerator ?? createDefaultIdGenerator("review");

  // Settings resolution (injectable for tests)
  const getDefaultRegId = dependencies.getDefaultRegisterIdFn ?? getDefaultRegisterId;
  const setDefaultRegId = dependencies.setDefaultRegisterIdFn ?? setDefaultRegisterId;
  const getActiveRegId = dependencies.getActiveRegisterIdFn ?? getActiveRegisterId;
  const setActiveRegId = dependencies.setActiveRegisterIdFn ?? setActiveRegisterId;

  async function resolveUserIdOrThrow(): Promise<string> {
    const userId = await resolveUserId();
    if (!userId) {
      throw new RegisterServiceError(
        "UNAUTHENTICATED",
        "A signed-in user is required for Register operations."
      );
    }
    return userId;
  }

  /**
   * Resolve register scope WITHOUT auto-creating a register.
   * Throws REGISTER_NOT_FOUND if no register can be resolved.
   */
  async function resolveScope(registerId?: string): Promise<RegisterScope> {
    const userId = await resolveUserIdOrThrow();

    // 1. Explicit registerId
    if (registerId) {
      return { userId, registerId };
    }

    // 2. sessionStorage cache
    const cached = getActiveRegId();
    if (cached) {
      return { userId, registerId: cached };
    }

    // 3. Firestore persisted default
    const persisted = await getDefaultRegId(userId);
    if (persisted) {
      setActiveRegId(persisted); // warm cache
      return { userId, registerId: persisted };
    }

    // 4. No register found – do NOT auto-create
    throw new RegisterServiceError(
      "REGISTER_NOT_FOUND",
      "No register found. Please create a register first."
    );
  }

  return {
    async createRegister(name, linkedProjectId = null) {
      try {
        const userId = await resolveUserIdOrThrow();
        const register = await registerRepo.createRegister(
          userId,
          name,
          linkedProjectId
        );
        // Set as default
        await setDefaultRegId(userId, register.registerId);
        return register;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async listRegisters() {
      try {
        const userId = await resolveUserIdOrThrow();
        return registerRepo.listRegisters(userId);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getFirstRegister() {
      try {
        const userId = await resolveUserIdOrThrow();
        const registers = await registerRepo.listRegisters(userId);
        return registers.length > 0 ? registers[0] : null;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateRegisterProfile(registerId, profile) {
      try {
        const userId = await resolveUserIdOrThrow();
        await registerRepo.updateRegister(userId, registerId, profile);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async createUseCaseFromCapture(input, options = {}) {
      try {
        const scope = await resolveScope(options.registerId);
        const useCaseId = options.useCaseId ?? useCaseIdGenerator();
        const cardDraft = prepareUseCaseForStorage(input, {
          useCaseId,
          now: now(),
        });
        const card = parseUseCaseCard({
          ...cardDraft,
          capturedBy: options.capturedBy ?? scope.userId,
          capturedByName: options.capturedByName,
          capturedViaCode: options.capturedViaCode,
          accessCodeLabel: options.accessCodeLabel,
        });
        return useCaseRepo.create(scope, card);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getUseCase(registerId, useCaseId) {
      try {
        const scope = await resolveScope(registerId);
        return useCaseRepo.getById(scope, useCaseId);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async listUseCases(registerId, filters = {}) {
      try {
        const scope = await resolveScope(registerId);
        return useCaseRepo.list(scope, filters);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateUseCase(useCaseId, updates) {
      try {
        const scope = await resolveScope();
        const existing = await useCaseRepo.getById(scope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError("USE_CASE_NOT_FOUND", "Use case not found.");
        }

        const nowIso = now().toISOString();
        const merged: UseCaseCard = {
          ...existing,
          ...updates,
          responsibility: {
            ...existing.responsibility,
            ...(updates.responsibility || {})
          },
          governanceAssessment: {
            ...existing.governanceAssessment,
            core: existing.governanceAssessment?.core || {},
            flex: existing.governanceAssessment?.flex || {},
            ...(updates.governanceAssessment || {})
          },
          updatedAt: nowIso
        };

        const parsed = parseUseCaseCard(merged);
        return await useCaseRepo.save(scope, parsed);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateUseCaseStatusManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? "HUMAN");
      } catch (error) {
        throw new RegisterServiceError(
          "AUTOMATION_FORBIDDEN",
          "Automated governance decisions are prohibited.",
          { cause: error }
        );
      }

      try {
        const scope = await resolveScope(input.registerId);
        const existing = await useCaseRepo.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${input.useCaseId}' was not found.`
          );
        }

        if (!isStatusTransitionAllowed(existing.status, input.nextStatus)) {
          throw new RegisterServiceError(
            "INVALID_STATUS_TRANSITION",
            `Transition from ${existing.status} to ${input.nextStatus} is not allowed.`
          );
        }

        if (existing.status === input.nextStatus) return existing;

        if (input.nextStatus === "UNREVIEWED") {
          throw new RegisterServiceError(
            "INVALID_STATUS_TRANSITION",
            "UNREVIEWED can only be set during initial capture creation."
          );
        }

        const reviewEvent: ReviewEvent = {
          reviewId: reviewIdGenerator(),
          reviewedAt: now().toISOString(),
          reviewedBy: input.reviewedBy || scope.userId,
          nextStatus: input.nextStatus,
          notes: input.reason,
        };

        const statusChange: StatusChange = {
          from: existing.status,
          to: input.nextStatus,
          changedAt: now().toISOString(),
          changedBy: input.reviewedBy || scope.userId,
          changedByName: "Admin",
          reason: input.reason,
        };

        const updated = parseUseCaseCard({
          ...existing,
          status: input.nextStatus,
          updatedAt: now().toISOString(),
          reviews: [...existing.reviews, reviewEvent],
          statusHistory: [...(existing.statusHistory || []), statusChange],
        });

        return useCaseRepo.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateProofMetaManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? "HUMAN");
      } catch (error) {
        throw new RegisterServiceError(
          "AUTOMATION_FORBIDDEN",
          "Automated governance decisions are prohibited.",
          { cause: error }
        );
      }

      try {
        const scope = await resolveScope(input.registerId);
        const existing = await useCaseRepo.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${input.useCaseId}' was not found.`
          );
        }

        if (existing.status !== "PROOF_READY") {
          throw new RegisterServiceError(
            "INVALID_STATUS_TRANSITION",
            "Proof metadata can only be updated in status PROOF_READY."
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

        return useCaseRepo.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateAssessmentManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? "HUMAN");
      } catch (error) {
        throw new RegisterServiceError(
          "AUTOMATION_FORBIDDEN",
          "Automated governance decisions are prohibited.",
          { cause: error }
        );
      }

      try {
        const scope = await resolveScope(input.registerId);
        const existing = await useCaseRepo.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${input.useCaseId}' was not found.`
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

        return useCaseRepo.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async setPublicVisibility(input) {
      try {
        const scope = await resolveScope(input.registerId);
        const existing = await useCaseRepo.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${input.useCaseId}' was not found.`
          );
        }

        if (existing.cardVersion !== "1.1") {
          throw new RegisterServiceError(
            "VALIDATION_FAILED",
            "Public visibility requires a v1.1 use case card."
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isPublicVisible: input.isPublicVisible,
          updatedAt: now().toISOString(),
        });

        // Save private card
        const saved = await useCaseRepo.save(scope, updated);

        // Dual-Write: Public Index
        if (input.isPublicVisible && saved.publicHashId) {
          // Fetch register to check org disclosure
          const reg = await registerRepo.getRegister(scope.userId, scope.registerId);
          const orgName =
            reg?.publicOrganisationDisclosure && reg?.organisationName
              ? reg.organisationName
              : null;

          const indexEntry: PublicUseCaseIndexEntry = {
            publicHashId: saved.publicHashId,
            globalUseCaseId: saved.globalUseCaseId ?? "",
            formatVersion: saved.formatVersion ?? "v1.1",
            purpose: saved.purpose,
            toolName: input.resolvedToolName ?? saved.toolFreeText ?? saved.toolId ?? "",
            dataCategory: saved.dataCategory ?? "INTERNAL",
            status: saved.status,
            createdAt: saved.createdAt,
            ownerId: scope.userId,
            verification: saved.proof?.verification ?? null,
            organisationName: orgName,
          };
          await publicIndexRepo.publishToIndex(indexEntry);
        } else if (!input.isPublicVisible && saved.publicHashId) {
          await publicIndexRepo.unpublishFromIndex(saved.publicHashId);
        }

        return saved;
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async softDeleteUseCase(registerId, useCaseId) {
      try {
        const scope = await resolveScope(registerId);
        const existing = await useCaseRepo.getById(scope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${useCaseId}' was not found.`
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isDeleted: true,
          updatedAt: now().toISOString(),
        });

        await useCaseRepo.save(scope, updated);

        // Remove from public index if it was visible
        if (existing.isPublicVisible && existing.publicHashId) {
          await publicIndexRepo.unpublishFromIndex(existing.publicHashId);
          await useCaseRepo.save(scope, parseUseCaseCard({ ...updated, isPublicVisible: false }));
        }
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async restoreUseCase(registerId, useCaseId) {
      try {
        const scope = await resolveScope(registerId);
        const existing = await useCaseRepo.getById(scope, useCaseId);
        if (!existing) {
          throw new RegisterServiceError(
            "USE_CASE_NOT_FOUND",
            `Use case '${useCaseId}' was not found.`
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isDeleted: false,
          updatedAt: now().toISOString(),
        });

        return useCaseRepo.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async getRegisterMetrics(registerId?: string): Promise<RegisterMetrics> {
      try {
        const scope = await resolveScope(registerId);
        const activeUseCases = await useCaseRepo.list(scope, { includeDeleted: false });

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
          if (cat === "Verboten") prohibited++;
          else if (cat === "Hochrisiko") high++;
          else if (cat === "Transparenzpflichten") limited++;
          else if (cat === "Minimales Risiko") minimal++;
          else unassessed++;

          // A simple rule for action items: if it's high risk but lacks oversight
          if (cat === "Hochrisiko" && (!uc.governanceAssessment?.core?.oversightDefined || !uc.governanceAssessment?.core?.reviewCycleDefined)) {
            actionItemsCount++;
          } else if (!cat) {
            actionItemsCount++; // Unassessed implies action required
          }
        });

        // Simple maturity calculation based on assessed KIs vs total active
        const assessedCount = activeUseCases.length - unassessed;
        let maturityScore = activeUseCases.length > 0 ? Math.round((assessedCount / activeUseCases.length) * 100) : 100;

        return {
          totalUseCases: activeUseCases.length,
          activeUseCases: activeUseCases.length,
          publicUseCases: publicCount,
          riskDistribution: {
            prohibited,
            high,
            limited,
            minimal,
            unassessed
          },
          maturityScore,
          actionItemsCount
        };
      } catch (error) {
        throw mapServiceError(error);
      }
    }
  };
}

export const registerService = createRegisterService();
