"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { UseCaseHeader } from "@/components/register/detail/use-case-header";
import { UseCaseMetadataSection } from "@/components/register/detail/use-case-metadata-section";
import { ReviewSection } from "@/components/register/detail/review-section";
import { AuditTrailSection } from "@/components/register/detail/audit-trail-section";
import {
  isControlFocusTarget,
  type ControlFocusTarget,
} from "@/lib/control/deep-link";
import { registerService } from "@/lib/register-first/register-service";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";

export default function UseCaseDetailPage() {
  const params = useParams<{ useCaseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [card, setCard] = useState<UseCaseCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFocus, setActiveFocus] = useState<ControlFocusTarget | null>(null);
  const [invalidFocus, setInvalidFocus] = useState<string | null>(null);

  const useCaseId = params.useCaseId;
  const focusParam = searchParams.get("focus");

  const loadUseCase = useCallback(async () => {
    if (!useCaseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerService.getUseCase(undefined, useCaseId);
      if (!result) {
        setError("Einsatzfall nicht gefunden.");
      } else {
        setCard(result);
      }
    } catch (err) {
      if (isServiceError(err, "UNAUTHENTICATED")) {
        router.push("/login");
        return;
      }
      if (isServiceError(err, "REGISTER_NOT_FOUND")) {
        setError("Kein Register gefunden. Bitte erstelle zuerst ein Register.");
      } else {
        setError("Einsatzfall konnte nicht geladen werden.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [useCaseId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user) {
      void loadUseCase();
    }
  }, [authLoading, user, loadUseCase, router]);

  useEffect(() => {
    if (!card) return;

    if (!focusParam) {
      setActiveFocus(null);
      setInvalidFocus(null);
      return;
    }

    if (!isControlFocusTarget(focusParam)) {
      setActiveFocus(null);
      setInvalidFocus(focusParam);
      return;
    }

    setInvalidFocus(null);
    setActiveFocus(focusParam);

    const focusTargetId = getFocusTargetId(focusParam);
    const frameId = window.requestAnimationFrame(() => {
      const element = document.getElementById(focusTargetId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const timeoutId = window.setTimeout(() => {
      setActiveFocus((current) => (current === focusParam ? null : current));
    }, 2600);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [card, focusParam]);

  const handleStatusChange = async (nextStatus: RegisterUseCaseStatus, reason?: string) => {
    if (!card) return;
    await registerService.updateUseCaseStatusManual({
      useCaseId: card.useCaseId,
      nextStatus,
      reason,
      actor: "HUMAN",
    });
    await loadUseCase();
  };

  const handleSaveMetadata = async (updates: Partial<UseCaseCard>) => {
    if (!card) return;
    try {
      await registerService.updateUseCase(card.useCaseId, updates);
      await loadUseCase();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save metadata", err);
      // We don't necessarily want to replace the whole page with an error, 
      // but if we do, setting error works:
      setError("Fehler beim Speichern der Änderungen.");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="border-l-2 border-red-300 pl-3 text-sm text-red-700">
            <p className="font-medium">Fehler</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-[1024px] space-y-10">
        <UseCaseHeader
          card={card}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((prev) => !prev)}
          onRefresh={loadUseCase}
        />

        {invalidFocus && (
          <div className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600">
            <p className="font-medium">Hinweis</p>
            <p>
              Der Focus-Parameter "{invalidFocus}" ist nicht gueltig und wurde ignoriert.
            </p>
          </div>
        )}

        <UseCaseMetadataSection
          card={card}
          isEditing={isEditing}
          onSave={handleSaveMetadata}
          focusTarget={activeFocus}
        />

        <div
          id="usecase-focus-review"
          className={activeFocus === "review" ? focusHighlightClassName : undefined}
        >
          <ReviewSection card={card} onStatusChange={handleStatusChange} />
        </div>
        <div
          id="usecase-focus-audit"
          className={activeFocus === "audit" ? focusHighlightClassName : undefined}
        >
          <AuditTrailSection card={card} />
        </div>
      </div>
    </div>
  );
}

const focusHighlightClassName = "border-l-2 border-slate-300 pl-3";

function getFocusTargetId(focus: ControlFocusTarget): string {
  if (focus === "owner") return "usecase-focus-owner";
  if (focus === "oversight") return "usecase-focus-oversight";
  if (focus === "policy") return "usecase-focus-policy";
  if (focus === "audit") return "usecase-focus-audit";
  return "usecase-focus-review";
}

function isServiceError(err: unknown, code: string): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    String((err as { code: unknown }).code) === code
  );
}
