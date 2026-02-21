"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Aktueller Status:</span>
            <RegisterStatusBadge status={card.status} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Moegliche Uebergaenge:</span>
            {nextStatuses.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">
                {registerUseCaseStatusLabels[s]}
              </Badge>
            ))}
          </div>

          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <RegisterStatusBadge status={card.status} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as RegisterUseCaseStatus)}
              >
                <SelectTrigger className="h-8 w-[220px] text-xs">
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

            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optionaler Kommentar zur Statusaenderung..."
              rows={2}
              className="text-sm"
            />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={!selectedStatus || isUpdating}
              >
                {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Status setzen
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
