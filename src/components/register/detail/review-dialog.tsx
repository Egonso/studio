"use client";

/**
 * ReviewDialog – Formale Prüfung eines Einsatzfalls dokumentieren.
 *
 * Design:
 *   - shadcn Dialog mit Select (Status) + Textarea (Notizen)
 *   - Reviewer auto-filled from useAuth().user.email
 *   - Calls addReview() from review-service (pure business logic)
 *   - Then persists via registerService.updateUseCase()
 *   - Disclaimer: Governance-Entscheidung ist manuell, kein Auto-Urteil
 *
 * Sprint: GN-E Review-UI
 */

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

import type { UseCaseCard, RegisterUseCaseStatus } from "@/lib/register-first/types";
import { addReview } from "@/lib/register-first/review-service";
import { registerService } from "@/lib/register-first/register-service";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";

// ── Types ───────────────────────────────────────────────────────────────────

/** Statuses the user can pick in the review dialog (never UNREVIEWED). */
type ReviewTargetStatus = Exclude<RegisterUseCaseStatus, "UNREVIEWED">;

const REVIEW_TARGET_STATUSES: { value: ReviewTargetStatus; label: string }[] = [
    { value: "REVIEWED", label: registerUseCaseStatusLabels.REVIEWED },
    { value: "PROOF_READY", label: registerUseCaseStatusLabels.PROOF_READY },
    { value: "REVIEW_RECOMMENDED", label: registerUseCaseStatusLabels.REVIEW_RECOMMENDED },
];

interface ReviewDialogProps {
    /** The use case being reviewed */
    card: UseCaseCard;
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to close the dialog */
    onOpenChange: (open: boolean) => void;
    /** Callback after a review was successfully persisted */
    onReviewAdded: (updatedCard: UseCaseCard) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ReviewDialog({
    card,
    open,
    onOpenChange,
    onReviewAdded,
}: ReviewDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [nextStatus, setNextStatus] = useState<ReviewTargetStatus>("REVIEWED");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const reviewerEmail = user?.email ?? "unbekannt";

    const handleSubmit = useCallback(async () => {
        setIsSaving(true);
        try {
            // 1. Pure business logic: validate + create event + append
            const updatedCard = addReview(card, {
                reviewedBy: reviewerEmail,
                nextStatus,
                notes: notes.trim() || undefined,
                actor: "HUMAN",
            });

            // 2. Persist to Firestore
            await registerService.updateUseCase(card.useCaseId, {
                status: updatedCard.status,
                reviews: updatedCard.reviews,
                statusHistory: updatedCard.statusHistory,
                updatedAt: updatedCard.updatedAt,
                governanceAssessment: updatedCard.governanceAssessment,
            });

            // 3. Notify parent
            onReviewAdded(updatedCard);

            // 4. Reset form & close
            setNotes("");
            setNextStatus("REVIEWED");
            onOpenChange(false);

            toast({
                title: "Review dokumentiert",
                description: `Status: ${registerUseCaseStatusLabels[updatedCard.status]}`,
            });
        } catch (err) {
            console.error("Review submission failed:", err);
            toast({
                variant: "destructive",
                title: "Fehler",
                description:
                    err instanceof Error
                        ? err.message
                        : "Review konnte nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    }, [card, reviewerEmail, nextStatus, notes, onReviewAdded, onOpenChange, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Formale Prüfung dokumentieren</DialogTitle>
                    <DialogDescription>
                        Eine formale Prüfung dokumentiert den aktuellen Governance-Status.
                        Sie stellt keine automatische Bewertung dar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Reviewer (auto-filled, read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="reviewer" className="text-sm font-medium">
                            Prüfer:in
                        </Label>
                        <div
                            id="reviewer"
                            className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                        >
                            {reviewerEmail}
                        </div>
                    </div>

                    {/* Target Status */}
                    <div className="space-y-2">
                        <Label htmlFor="review-status" className="text-sm font-medium">
                            Neuer Status
                        </Label>
                        <Select
                            value={nextStatus}
                            onValueChange={(val) => setNextStatus(val as ReviewTargetStatus)}
                        >
                            <SelectTrigger id="review-status">
                                <SelectValue placeholder="Status auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {REVIEW_TARGET_STATUSES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="review-notes" className="text-sm font-medium">
                            Notizen <span className="font-normal text-muted-foreground">(optional, max. 500 Zeichen)</span>
                        </Label>
                        <Textarea
                            id="review-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                            placeholder="z.B. ISO 42001 Konformität geprüft, alle Maßnahmen umgesetzt."
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {notes.length}/500
                        </p>
                    </div>

                    {/* Disclaimer */}
                    <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                        Diese Dokumentation erfasst den IST-Zustand der menschlichen Prüfung.
                        Sie ersetzt keine rechtliche Beratung und stellt keine Compliance-Bestätigung dar.
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Review dokumentieren
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
