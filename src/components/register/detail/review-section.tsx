"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegisterStatusPill } from "@/components/register/detail/status-pill";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";
import {
  getNextManualStatuses,
  registerUseCaseStatusLabels,
} from "@/lib/register-first";

interface ReviewSectionProps {
  card: UseCaseCard;
  onStatusChange: (nextStatus: RegisterUseCaseStatus, reason?: string) => Promise<void>;
}

export function ReviewSection({ card, onStatusChange }: ReviewSectionProps) {
  const nextStatuses = getNextManualStatuses(card.status);
  const [selectedStatus, setSelectedStatus] = useState<RegisterUseCaseStatus | "">("");
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      await onStatusChange(selectedStatus as RegisterUseCaseStatus, reason || undefined);
      setSelectedStatus("");
      setReason("");
    } catch (_err) {
      setError("Statuswechsel fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <section className="border-t border-slate-200 pt-8">
        <h2 className="text-[18px] font-semibold tracking-tight">Prüfstatus</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Formale Statusdokumentation ist getrennt von der Bearbeitung der Stammdaten.
        </p>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Aktueller Status:</span>
            <RegisterStatusPill status={card.status} />
          </div>

          {nextStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Der aktuelle Status ist formal abgeschlossen.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Status ändern
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as RegisterUseCaseStatus)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Neuen Status waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {nextStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {registerUseCaseStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Begründung der Statusänderung (optional)
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Begründung eingeben..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedStatus || isUpdating}
                >
                  {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Statusänderung dokumentieren
                </Button>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
          )}

          {card.reviewHints.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-200 pt-4">
              <span className="text-xs text-muted-foreground">Review-Hinweise</span>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {card.reviewHints.map((hint, i) => (
                  <li key={i}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Statusaenderung bestaetigen</AlertDialogTitle>
            <AlertDialogDescription>
              Status von{" "}
              <strong>{registerUseCaseStatusLabels[card.status]}</strong> zu{" "}
              <strong>
                {selectedStatus
                  ? registerUseCaseStatusLabels[selectedStatus as RegisterUseCaseStatus]
                  : ""}
              </strong>{" "}
              aendern? Diese Aktion dokumentiert eine formale Entscheidung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirm()}
              disabled={isUpdating}
            >
              {isUpdating ? "Wird gesetzt..." : "Bestaetigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
