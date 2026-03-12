"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  registerService,
  type DeleteRegisterResult,
  type RegisterDeletePreview,
  type RegisterServiceErrorCode,
} from "@/lib/register-first/register-service";
import type { Register } from "@/lib/register-first/types";

interface RegisterDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: Register | null;
  onDeleted?: (result: DeleteRegisterResult) => Promise<void> | void;
}

function mapErrorCode(error: unknown): RegisterServiceErrorCode | null {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code) as RegisterServiceErrorCode;
  }

  return null;
}

export function RegisterDeleteDialog({
  open,
  onOpenChange,
  register,
  onDeleted,
}: RegisterDeleteDialogProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<RegisterDeletePreview | null>(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !register) {
      setPreview(null);
      setConfirmationName("");
      setError(null);
      setIsLoading(false);
      setIsDeleting(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);
    setConfirmationName("");

    registerService
      .getRegisterDeletionPreview(register.registerId)
      .then((nextPreview) => {
        if (active) {
          setPreview(nextPreview);
        }
      })
      .catch(() => {
        if (active) {
          setError("Delete-Vorschau konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, register]);

  const confirmationMatches = useMemo(() => {
    if (!preview) return false;
    return confirmationName.trim() === preview.displayName;
  }, [confirmationName, preview]);

  const handleDelete = async () => {
    if (!register || !preview) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await registerService.deleteRegister({
        registerId: register.registerId,
        confirmationName,
      });
      await onDeleted?.(result);
      toast({
        title: "Register gelöscht",
        description: `${preview.displayName} wurde sicher deaktiviert.`,
      });
      onOpenChange(false);
    } catch (deleteError) {
      const code = mapErrorCode(deleteError);
      const message =
        code === "REGISTER_CONFIRMATION_MISMATCH"
          ? "Die Namensbestätigung stimmt nicht überein."
          : code === "REGISTER_DELETE_FORBIDDEN"
            ? "Das letzte verbleibende Register kann nicht gelöscht werden."
            : "Register konnte nicht gelöscht werden.";

      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Register löschen</DialogTitle>
          <DialogDescription>
            Dieser Flow nutzt bewusst keinen Hard Delete. Das Register wird
            per Soft Delete deaktiviert, externe Zugänge werden geschlossen und
            der Zustand bleibt für eine Wiederherstellung erhalten.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && preview && (
          <div className="space-y-4">
            <Alert variant={preview.canDelete ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {preview.canDelete
                  ? "Soft Delete mit Wiederherstellung"
                  : "Letztes Register bleibt erhalten"}
              </AlertTitle>
              <AlertDescription>
                {preview.canDelete
                  ? `Öffentliche Verify-Links, Supplier-Link und Access Codes werden sofort deaktiviert. Danach wird ${preview.fallbackRegisterName} als aktives Register weiterverwendet.`
                  : "Um eine unbeabsichtigte Komplettleerung zu verhindern, lässt der Service das letzte verbleibende Register nicht löschen."}
              </AlertDescription>
            </Alert>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Betroffene Use Cases
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {preview.impact.totalUseCaseCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {preview.impact.publicUseCaseCount} davon öffentlich sichtbar
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Zugangscodes
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {preview.impact.totalAccessCodeCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {preview.impact.activeAccessCodeCount} aktive Codes werden deaktiviert
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/20 p-4">
              <p className="text-sm font-medium">Exakte Namensbestätigung</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Geben Sie zur Bestätigung exakt den angezeigten Namen ein:
              </p>
              <p className="mt-2 rounded bg-background px-3 py-2 text-sm font-medium">
                {preview.displayName}
              </p>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="register-delete-confirmation">
                  Registername
                </Label>
                <Input
                  id="register-delete-confirmation"
                  value={confirmationName}
                  onChange={(event) => setConfirmationName(event.target.value)}
                  placeholder={preview.displayName}
                  autoComplete="off"
                  disabled={!preview.canDelete || isDeleting}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={!preview?.canDelete || !confirmationMatches || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Register sicher löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
