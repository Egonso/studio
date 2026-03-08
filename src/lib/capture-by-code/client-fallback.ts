import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { registerService } from "@/lib/register-first/register-service";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
  RegisterAccessCode,
  UseCaseCard,
} from "@/lib/register-first/types";
import { normalizeCaptureByCodeSelections } from "./selections";

export interface OwnerCaptureFallbackInfo {
  code: string;
  registerId: string;
  label: string | null;
  organisationName: string | null;
}

export interface OwnerCaptureSubmissionInput {
  code: string;
  registerId: string;
  accessCodeLabel?: string | null;
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  usageContext?: CaptureUsageContext;
  usageContexts?: CaptureUsageContext[];
  dataCategory?: DataCategory;
  dataCategories?: DataCategory[];
  decisionInfluence?: DecisionInfluence;
  ownerRole: string;
  contactPersonName?: string;
  organisation?: string;
}

interface ResolveOwnedCaptureCodeDeps {
  getCurrentUserId: () => Promise<string | null>;
  getCodeDoc: (code: string) => Promise<RegisterAccessCode | null>;
  getRegisterSummary: (
    ownerId: string,
    registerId: string
  ) => Promise<{ organisationName?: string | null; name?: string | null } | null>;
  now?: () => Date;
}

interface SubmitOwnedCaptureCodeDeps {
  createUseCase: (
    input: unknown,
    options: {
      registerId: string;
      capturedViaCode: true;
      accessCodeLabel?: string;
      capturedByName?: string;
    }
  ) => Promise<UseCaseCard>;
  incrementUsageCount: (code: string) => Promise<void>;
}

function isCodeExpired(expiresAt: string | null | undefined, now: Date): boolean {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < now;
}

export async function resolveOwnedCaptureCode(
  code: string,
  deps: ResolveOwnedCaptureCodeDeps
): Promise<OwnerCaptureFallbackInfo | null> {
  const ownerId = await deps.getCurrentUserId();
  if (!ownerId) return null;

  const codeDoc = await deps.getCodeDoc(code);
  if (!codeDoc) return null;
  if (codeDoc.ownerId !== ownerId) return null;
  if (!codeDoc.isActive) return null;
  if (isCodeExpired(codeDoc.expiresAt, deps.now?.() ?? new Date())) return null;

  const register = await deps.getRegisterSummary(ownerId, codeDoc.registerId);

  return {
    code,
    registerId: codeDoc.registerId,
    label: codeDoc.label ?? null,
    organisationName: register?.organisationName ?? register?.name ?? null,
  };
}

export async function resolveOwnedCaptureCodeFallback(
  code: string
): Promise<OwnerCaptureFallbackInfo | null> {
  try {
    const auth = await getFirebaseAuth();
    const db = await getFirebaseDb();
    const { doc, getDoc } = await import("firebase/firestore");

    return resolveOwnedCaptureCode(code, {
      getCurrentUserId: async () => auth.currentUser?.uid ?? null,
      getCodeDoc: async (candidateCode) => {
        const snapshot = await getDoc(doc(db, "registerAccessCodes", candidateCode));
        return snapshot.exists() ? (snapshot.data() as RegisterAccessCode) : null;
      },
      getRegisterSummary: async (ownerId, registerId) => {
        const snapshot = await getDoc(doc(db, "users", ownerId, "registers", registerId));
        return snapshot.exists()
          ? (snapshot.data() as { organisationName?: string | null; name?: string | null })
          : null;
      },
    });
  } catch {
    return null;
  }
}

export async function submitOwnedCaptureCode(
  input: OwnerCaptureSubmissionInput,
  deps: SubmitOwnedCaptureCodeDeps
): Promise<UseCaseCard> {
  const normalizedSelections = normalizeCaptureByCodeSelections({
    usageContext: input.usageContext,
    usageContexts: input.usageContexts,
    dataCategory: input.dataCategory,
    dataCategories: input.dataCategories,
    decisionInfluence: input.decisionInfluence,
  });

  const card = await deps.createUseCase(
    {
      purpose: input.purpose.trim(),
      usageContexts: normalizedSelections.usageContexts,
      isCurrentlyResponsible: false,
      responsibleParty: input.ownerRole.trim(),
      contactPersonName: input.contactPersonName?.trim() || undefined,
      decisionImpact: "UNSURE",
      decisionInfluence: normalizedSelections.decisionInfluence,
      toolId: input.toolId || undefined,
      toolFreeText: input.toolFreeText?.trim() || undefined,
      dataCategory: normalizedSelections.dataCategory,
      dataCategories: normalizedSelections.dataCategories,
      organisation: input.organisation?.trim() || undefined,
    },
    {
      registerId: input.registerId,
      capturedViaCode: true,
      accessCodeLabel: input.accessCodeLabel ?? undefined,
      capturedByName: input.contactPersonName?.trim() || undefined,
    }
  );

  await deps.incrementUsageCount(input.code);
  return card;
}

export async function submitOwnedCaptureCodeFallback(
  input: OwnerCaptureSubmissionInput
): Promise<UseCaseCard> {
  const db = await getFirebaseDb();
  const { doc, updateDoc, increment } = await import("firebase/firestore");

  return submitOwnedCaptureCode(input, {
    createUseCase: (payload, options) =>
      registerService.createUseCaseFromCapture(payload, options),
    incrementUsageCount: async (code) => {
      await updateDoc(doc(db, "registerAccessCodes", code), {
        usageCount: increment(1),
      });
    },
  });
}
