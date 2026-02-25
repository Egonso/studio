"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileJson, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function UseCaseHeader({ card, isEditing, onToggleEdit, onDelete }: UseCaseHeaderProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleExportJSON = () => {
    const exportData = {
      useCaseId: card.useCaseId,
      globalUseCaseId: card.globalUseCaseId,
      purpose: card.purpose,
      toolId: card.toolId,
      toolFreeText: card.toolFreeText,
      status: card.status,
      cardVersion: card.cardVersion,
      dataCategory: card.dataCategory,
      usageContexts: card.usageContexts,
      decisionInfluence: card.decisionInfluence,
      responsibility: card.responsibility,
      governanceAssessment: card.governanceAssessment,
      isPublicVisible: card.isPublicVisible,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      reviews: card.reviews,
    };
    const json = JSON.stringify(exportData, null, 2);
    const filename = `use-case-pass-${card.globalUseCaseId || card.useCaseId}.json`;
    downloadFile(json, filename, "application/json;charset=utf-8");
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
              <Badge variant="secondary" className="text-[10px]">
                {card.isPublicVisible ? "Oeffentlich" : "Privat"}
              </Badge>
              {card.cardVersion && (
                <span className="text-[10px] text-muted-foreground">
                  v{card.cardVersion}
                </span>
              )}
              {card.globalUseCaseId && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {card.globalUseCaseId}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Use-Case Pass Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              title="Use-Case Pass als PDF exportieren"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              title="Use-Case Pass als JSON exportieren"
            >
              <FileJson className="mr-1.5 h-3.5 w-3.5" />
              JSON
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={onToggleEdit}
            >
              {isEditing ? (
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Abbrechen
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Einsatzfall bearbeiten
                </>
              )}
            </Button>
            {onDelete && (
              <Button
                variant="outline"
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
