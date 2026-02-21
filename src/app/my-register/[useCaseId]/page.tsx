"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { UseCaseHeader } from "@/components/register/detail/use-case-header";
import { UseCaseMetadataSection } from "@/components/register/detail/use-case-metadata-section";
import { ReviewSection } from "@/components/register/detail/review-section";
import { AuditTrailSection } from "@/components/register/detail/audit-trail-section";
import { registerService } from "@/lib/register-first/register-service";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";

export default function UseCaseDetailPage() {
  const params = useParams<{ useCaseId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [card, setCard] = useState<UseCaseCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const useCaseId = params.useCaseId;

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
    // For now, reload after status-level updates. Metadata editing
    // requires a dedicated service method (future sprint).
    // This is a placeholder that demonstrates the pattern.
    await loadUseCase();
    setIsEditing(false);
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 pt-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <UseCaseHeader
          card={card}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((prev) => !prev)}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left column: Metadata */}
          <div className="space-y-6">
            <UseCaseMetadataSection
              card={card}
              isEditing={isEditing}
              onSave={handleSaveMetadata}
            />
          </div>

          {/* Right column: Review + Audit */}
          <div className="space-y-6">
            <ReviewSection card={card} onStatusChange={handleStatusChange} />
            <AuditTrailSection card={card} />
          </div>
        </div>
      </div>
    </div>
  );
}

function isServiceError(err: unknown, code: string): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    String((err as { code: unknown }).code) === code
  );
}
