"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RegisterStatusBadge } from "@/components/register/status-badge";
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
    } catch (err) {
      setError("Statuswechsel fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
    }
  };

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status-Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aktueller Status</span>
              <RegisterStatusBadge status={card.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Zulässige Statusänderungen:</span>
              <ul className="mt-1 space-y-0.5 ml-3">
                {nextStatuses.map((s) => (
                  <li key={s}>– {registerUseCaseStatusLabels[s]}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status ändern</label>
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
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Begründung der Statusänderung (optional)</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Begründung eingeben..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(true)}
                disabled={!selectedStatus || isUpdating}
              >
                {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Statusänderung dokumentieren
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>

          {/* Review Hints */}
          {card.reviewHints.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Review-Hinweise</span>
              <ul className="space-y-1">
                {card.reviewHints.map((hint, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    &bull; {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

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
