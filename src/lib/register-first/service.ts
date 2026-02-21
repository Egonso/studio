import { ZodError } from "zod";
import {
  assertManualGovernanceDecision,
  parseUseCaseCard,
} from "./schema";
import {
  createFirestoreRegisterUseCaseRepository,
  type RegisterUseCaseFilters,
  type RegisterUseCaseRepository,
  type RegisterUseCaseScope,
} from "./repository";
import { isStatusTransitionAllowed } from "./status-flow";
import { prepareUseCaseForStorage } from "./use-case-builder";
import type {
  GovernanceDecisionActor,
  RegisterUseCaseStatus,
  ReviewEvent,
  UseCaseCard,
} from "./types";

export type RegisterFirstServiceErrorCode =
  | "UNAUTHENTICATED"
  | "PROJECT_CONTEXT_MISSING"
  | "USE_CASE_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "AUTOMATION_FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PERSISTENCE_FAILED";

export class RegisterFirstServiceError extends Error {
  public readonly code: RegisterFirstServiceErrorCode;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(
    code: RegisterFirstServiceErrorCode,
    message: string,
    options?: { details?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "RegisterFirstServiceError";
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

type ResolveUserId = () => Promise<string | null>;
type ResolveProjectId = (projectId?: string) => Promise<string | null>;
type IdGenerator = () => string;
type Clock = () => Date;

export interface CreateUseCaseFromCaptureOptions {
  projectId?: string;
  useCaseId?: string;
}

export interface UpdateUseCaseStatusManualInput {
  projectId?: string;
  useCaseId: string;
  nextStatus: RegisterUseCaseStatus;
  reason?: string;
  actor?: GovernanceDecisionActor;
  reviewedBy?: string;
}

export interface UpdateProofMetaManualInput {
  projectId?: string;
  useCaseId: string;
  verifyUrl: string;
  isReal: boolean;
  isCurrent: boolean;
  scope: string;
  actor?: GovernanceDecisionActor;
}

export interface SetPublicVisibilityInput {
  projectId?: string;
  useCaseId: string;
  isPublicVisible: boolean;
}

export interface RegisterFirstService {
  createUseCaseFromCapture(
    input: unknown,
    options?: CreateUseCaseFromCaptureOptions
  ): Promise<UseCaseCard>;
  listUseCases(projectId?: string, filters?: RegisterUseCaseFilters): Promise<UseCaseCard[]>;
  updateUseCaseStatusManual(input: UpdateUseCaseStatusManualInput): Promise<UseCaseCard>;
  updateProofMetaManual(input: UpdateProofMetaManualInput): Promise<UseCaseCard>;
  setPublicVisibility(input: SetPublicVisibilityInput): Promise<UseCaseCard>;
}

interface RegisterFirstServiceDependencies {
  repository?: RegisterUseCaseRepository;
  resolveUserId?: ResolveUserId;
  resolveProjectId?: ResolveProjectId;
  now?: Clock;
  useCaseIdGenerator?: IdGenerator;
  reviewIdGenerator?: IdGenerator;
}

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

async function defaultResolveProjectId(projectId?: string): Promise<string | null> {
  if (projectId) {
    return projectId;
  }
  const { getActiveProjectId } = await import("@/lib/data-service");
  return getActiveProjectId();
}

function mapServiceError(error: unknown): RegisterFirstServiceError {
  if (error instanceof RegisterFirstServiceError) {
    return error;
  }
  if (error instanceof ZodError) {
    return new RegisterFirstServiceError(
      "VALIDATION_FAILED",
      "Register First payload validation failed.",
      { details: error.flatten(), cause: error }
    );
  }
  return new RegisterFirstServiceError(
    "PERSISTENCE_FAILED",
    "Register First operation failed.",
    { cause: error }
  );
}

export function createRegisterFirstService(
  dependencies: RegisterFirstServiceDependencies = {}
): RegisterFirstService {
  const repository = dependencies.repository ?? createFirestoreRegisterUseCaseRepository();
  const resolveUserId = dependencies.resolveUserId ?? defaultResolveUserId;
  const resolveProjectId = dependencies.resolveProjectId ?? defaultResolveProjectId;
  const now = dependencies.now ?? (() => new Date());
  const useCaseIdGenerator =
    dependencies.useCaseIdGenerator ?? createDefaultIdGenerator("uc");
  const reviewIdGenerator =
    dependencies.reviewIdGenerator ?? createDefaultIdGenerator("review");

  async function resolveScope(projectId?: string): Promise<RegisterUseCaseScope> {
    const userId = await resolveUserId();
    if (!userId) {
      throw new RegisterFirstServiceError(
        "UNAUTHENTICATED",
        "A signed-in user is required for Register First operations."
      );
    }

    const resolvedProjectId = await resolveProjectId(projectId);
    if (!resolvedProjectId) {
      throw new RegisterFirstServiceError(
        "PROJECT_CONTEXT_MISSING",
        "Project context is required for Register First operations."
      );
    }

    return {
      userId,
      projectId: resolvedProjectId,
    };
  }

  return {
    async createUseCaseFromCapture(input, options = {}) {
      try {
        const scope = await resolveScope(options.projectId);
        const useCaseId = options.useCaseId ?? useCaseIdGenerator();
        const card = prepareUseCaseForStorage(input, {
          useCaseId,
          now: now(),
        });
        return repository.create(scope, card);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async listUseCases(projectId, filters = {}) {
      try {
        const scope = await resolveScope(projectId);
        return repository.list(scope, filters);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateUseCaseStatusManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? "HUMAN");
      } catch (error) {
        throw new RegisterFirstServiceError(
          "AUTOMATION_FORBIDDEN",
          "Automated governance decisions are prohibited in Register First.",
          { cause: error }
        );
      }

      try {
        const scope = await resolveScope(input.projectId);
        const existing = await repository.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterFirstServiceError(
            "USE_CASE_NOT_FOUND",
            `Register use case '${input.useCaseId}' was not found.`
          );
        }

        if (!isStatusTransitionAllowed(existing.status, input.nextStatus)) {
          throw new RegisterFirstServiceError(
            "INVALID_STATUS_TRANSITION",
            `Transition from ${existing.status} to ${input.nextStatus} is not allowed.`
          );
        }

        if (existing.status === input.nextStatus) {
          return existing;
        }

        if (input.nextStatus === "UNREVIEWED") {
          throw new RegisterFirstServiceError(
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

        const updated = parseUseCaseCard({
          ...existing,
          status: input.nextStatus,
          updatedAt: now().toISOString(),
          reviews: [...existing.reviews, reviewEvent],
        });

        return repository.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async updateProofMetaManual(input) {
      try {
        assertManualGovernanceDecision(input.actor ?? "HUMAN");
      } catch (error) {
        throw new RegisterFirstServiceError(
          "AUTOMATION_FORBIDDEN",
          "Automated governance decisions are prohibited in Register First.",
          { cause: error }
        );
      }

      try {
        const scope = await resolveScope(input.projectId);
        const existing = await repository.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterFirstServiceError(
            "USE_CASE_NOT_FOUND",
            `Register use case '${input.useCaseId}' was not found.`
          );
        }

        if (existing.status !== "PROOF_READY") {
          throw new RegisterFirstServiceError(
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

        return repository.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },

    async setPublicVisibility(input) {
      try {
        const scope = await resolveScope(input.projectId);
        const existing = await repository.getById(scope, input.useCaseId);
        if (!existing) {
          throw new RegisterFirstServiceError(
            "USE_CASE_NOT_FOUND",
            `Register use case '${input.useCaseId}' was not found.`
          );
        }

        if (existing.cardVersion !== "1.1") {
          throw new RegisterFirstServiceError(
            "VALIDATION_FAILED",
            "Public visibility requires a v1.1 use case card."
          );
        }

        const updated = parseUseCaseCard({
          ...existing,
          isPublicVisible: input.isPublicVisible,
          updatedAt: now().toISOString(),
        });

        return repository.save(scope, updated);
      } catch (error) {
        throw mapServiceError(error);
      }
    },
  };
}

export const registerFirstService = createRegisterFirstService();
