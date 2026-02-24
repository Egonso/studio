"use client";

import { useState } from "react";
import { ArrowLeft, Lock, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import { FeatureGateDialog } from "@/components/feature-gate-dialog";
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
import { RegisterStatusBadge } from "@/components/register/status-badge";
import type { UseCaseCard } from "@/lib/register-first/types";

interface UseCaseHeaderProps {
  card: UseCaseCard;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete?: () => Promise<void>;
}

export function UseCaseHeader({ card, isEditing, onToggleEdit, onDelete }: UseCaseHeaderProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFeatureGate, setShowFeatureGate] = useState(false);
  const { allowed: canEdit } = useCapability('editUseCase');

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      router.push("/my-register");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditClick = () => {
    if (canEdit) {
      onToggleEdit();
    } else {
      setShowFeatureGate(true);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => router.push("/my-register")}
          >
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-xl font-semibold leading-tight">{card.purpose}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <RegisterStatusBadge status={card.status} />
              <Badge
                variant={card.isPublicVisible ? "default" : "secondary"}
                className="text-[10px]"
              >
                {card.isPublicVisible ? "Oeffentlich" : "Privat"}
              </Badge>
              {card.cardVersion && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  v{card.cardVersion}
                </Badge>
              )}
              {card.globalUseCaseId && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {card.globalUseCaseId}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={handleEditClick}
            >
              {isEditing ? (
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Abbrechen
                </>
              ) : canEdit ? (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Einsatzfall bearbeiten
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Einsatzfall bearbeiten
                </>
              )}
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Loeschen
              </Button>
            )}
          </div>
        </div>
      </div>

      <FeatureGateDialog feature="editUseCase" open={showFeatureGate} onOpenChange={setShowFeatureGate} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einsatzfall loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rueckgaengig gemacht werden. Der Einsatzfall
              wird unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Loeschen..." : "Endgueltig loeschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
