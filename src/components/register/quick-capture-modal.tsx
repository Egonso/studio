"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { registerService } from "@/lib/register-first/register-service";
import type {
    CaptureUsageContext,
    DataCategory,
    DecisionInfluence,
    OrgSettings,
} from "@/lib/register-first/types";
import { applyOrgDefaults } from "@/lib/register-first/inheritance";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import {
    SHARED_CAPTURE_FIELD_IDS,
    validateSharedCaptureFields,
    type SharedCaptureFieldErrors,
    type SharedCaptureFieldName,
} from "@/lib/register-first/shared-capture-fields";
import {
    QuickCaptureFields,
    TOOL_PLACEHOLDER_ID,
    type QuickCaptureFieldsDraft,
} from "./quick-capture-fields";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCaptured?: (useCaseId?: string) => void;
    mode?: "register" | "guest";
    renderInline?: boolean;
    initialDraft?: Partial<QuickDraft>;
}

interface QuickDraft extends QuickCaptureFieldsDraft {
    description: string;
}

interface GuestCaptureEntry {
    id: string;
    capturedAt: string;
    purpose: string;
    ownerRole: string;
    contactPersonName?: string;
    tool: string;
    usageContexts: CaptureUsageContext[];
    dataCategories: DataCategory[];
    decisionInfluence: DecisionInfluence | null;
    description: string;
}

function createInitialDraft(
    initialDraft?: (Partial<QuickDraft> & { ownerName?: string })
): QuickDraft {
    return {
        purpose: initialDraft?.purpose?.slice(0, 160) ?? "",
        ownerRole: initialDraft?.ownerRole ?? initialDraft?.ownerName ?? "",
        contactPersonName: initialDraft?.contactPersonName ?? "",
        toolId: initialDraft?.toolId ?? TOOL_PLACEHOLDER_ID,
        toolFreeText: initialDraft?.toolFreeText ?? "",
        usageContexts: [...(initialDraft?.usageContexts ?? [])],
        dataCategories: [...(initialDraft?.dataCategories ?? [])],
        decisionInfluence: initialDraft?.decisionInfluence ?? null,
        description: initialDraft?.description?.slice(0, 160) ?? "",
    };
}

// ── Component ────────────────────────────────────────────────────────────────

export function QuickCaptureModal({
    open,
    onOpenChange,
    onCaptured,
    mode = "register",
    renderInline = false,
    initialDraft,
}: QuickCaptureModalProps) {
    const isGuestMode = mode === "guest";
    const [draft, setDraft] = useState<QuickDraft>(() => createInitialDraft(initialDraft));
    const [fieldErrors, setFieldErrors] = useState<SharedCaptureFieldErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
    const [inheritanceApplied, setInheritanceApplied] = useState(false);
    const { allowed: canInheritRaw } = useCapability("extendedOrgSettings");
    const canInherit = canInheritRaw && !isGuestMode;
    const { toast } = useToast();
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    useEffect(() => {
        if (open) {
            setDraft(createInitialDraft(initialDraft));
            setFieldErrors({});
        }
    }, [initialDraft, open]);

    // Load orgSettings from active register for inheritance
    useEffect(() => {
        if (!canInherit) return;
        registerService.listRegisters().then((regs) => {
            if (regs.length > 0 && regs[0].orgSettings) {
                setOrgSettings(regs[0].orgSettings);
                const merged = applyOrgDefaults(regs[0].orgSettings);
                const hasDefaults = merged.reviewCycle !== "unknown" ||
                    merged.policyLinks.length > 0 ||
                    merged.incidentProcessDefined ||
                    merged.oversightDefined;
                setInheritanceApplied(hasDefaults);
            }
        }).catch(() => { });
    }, [canInherit]);

    useEffect(() => {
        if (!hasFieldErrors) return;
        setFieldErrors(validateSharedCaptureFields(draft).errors);
    }, [draft, hasFieldErrors]);

    const focusCaptureField = (fieldName: SharedCaptureFieldName | null) => {
        if (!fieldName) return;
        const fieldId = SHARED_CAPTURE_FIELD_IDS[fieldName];
        window.requestAnimationFrame(() => {
            const element = document.getElementById(fieldId);
            if (!element) return;
            element.scrollIntoView({ block: "center", behavior: "smooth" });
            if (element instanceof HTMLElement) {
                element.focus();
            }
        });
    };

    const handleSave = async () => {
        const validation = validateSharedCaptureFields(draft);
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            focusCaptureField(validation.firstInvalidField);
            return;
        }

        setFieldErrors({});
        setIsSaving(true);

        try {
            if (isGuestMode) {
                const guestEntry: GuestCaptureEntry = {
                    id: `guest_${Date.now()}`,
                    capturedAt: new Date().toISOString(),
                    purpose: validation.normalized.purpose,
                    ownerRole: validation.normalized.ownerRole,
                    contactPersonName: validation.normalized.contactPersonName,
                    tool:
                        validation.normalized.toolId === "other"
                            ? validation.normalized.toolFreeText ?? ""
                            : validation.normalized.toolId ?? "",
                    usageContexts: validation.normalized.usageContexts,
                    dataCategories: validation.normalized.dataCategories ?? [],
                    decisionInfluence: validation.normalized.decisionInfluence ?? null,
                    description: draft.description.trim(),
                };

                const key = "kiregister_guest_captures";
                const existingRaw = window.localStorage.getItem(key);
                const existing = existingRaw ? (JSON.parse(existingRaw) as GuestCaptureEntry[]) : [];
                window.localStorage.setItem(key, JSON.stringify([guestEntry, ...existing]));

                toast({
                    title: "Lokal gespeichert",
                    description: "Gast-Eintrag wurde lokal im Browser gespeichert.",
                });

                setDraft(createInitialDraft(initialDraft));
                onCaptured?.();
                onOpenChange(false);
                return;
            }

            const card = await registerService.createUseCaseFromCapture({
                purpose: validation.normalized.purpose,
                toolId: validation.normalized.toolId,
                toolFreeText: validation.normalized.toolFreeText,
                usageContexts: validation.normalized.usageContexts,
                dataCategories: validation.normalized.dataCategories,
                decisionInfluence: validation.normalized.decisionInfluence,
                isCurrentlyResponsible: false,
                responsibleParty: validation.normalized.ownerRole,
                contactPersonName: validation.normalized.contactPersonName,
                decisionImpact: "UNSURE",
            });

            // Apply org defaults + provenance if inheritance is active
            if (canInherit && orgSettings && inheritanceApplied) {
                const merged = applyOrgDefaults(orgSettings);
                await registerService.updateUseCase(card.useCaseId, {
                    governanceAssessment: {
                        core: {
                            ...card.governanceAssessment?.core,
                            oversightDefined: merged.oversightDefined,
                        },
                        flex: {
                            ...card.governanceAssessment?.flex,
                            policyLinks: merged.policyLinks,
                            incidentProcessDefined: merged.incidentProcessDefined,
                            iso: {
                                ...card.governanceAssessment?.flex?.iso,
                                reviewCycle: merged.reviewCycle,
                                oversightModel: card.governanceAssessment?.flex?.iso?.oversightModel ?? "unknown",
                                documentationLevel: card.governanceAssessment?.flex?.iso?.documentationLevel ?? "unknown",
                                lifecycleStatus: card.governanceAssessment?.flex?.iso?.lifecycleStatus ?? "unknown",
                            },
                        },
                    },
                    fieldProvenance: merged.provenance,
                });
            }

            toast({
                title: "Registereintrag erstellt",
                description: inheritanceApplied
                    ? `„${card.purpose}" – Organisations-Vorgaben übernommen`
                    : `„${card.purpose}" – Status: Formale Prüfung ausstehend`,
            });

            setDraft(createInitialDraft(initialDraft));
            onCaptured?.(card.useCaseId);
            onOpenChange(false);
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: isGuestMode
                    ? "Gast-Eintrag konnte nicht lokal gespeichert werden."
                    : "Use Case konnte nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void handleSave();
        }
    };

    const patch = (p: Partial<QuickDraft>) => setDraft((d) => ({ ...d, ...p }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open ? (
                <DialogContent
                    className={`sm:max-w-[480px] max-h-[90vh] overflow-y-auto ${renderInline ? "top-6 sm:top-8 translate-y-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4" : ""}`}
                    hideOverlay={renderInline}
                    onPointerDownOutside={(event) => {
                        if (renderInline) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (renderInline) {
                            event.preventDefault();
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    aria-describedby="qc-dialog-desc"
                    aria-labelledby="qc-dialog-title"
                >
                    <DialogHeader>
                        <DialogTitle id="qc-dialog-title" className="text-lg">Quick Capture</DialogTitle>
                        <DialogDescription id="qc-dialog-desc">
                            Erfasse nur das Minimum. Du kannst später ergänzen.
                        </DialogDescription>
                        {isGuestMode && (
                            <p className="text-xs text-muted-foreground">
                                Gastmodus: Einträge werden lokal in diesem Browser gespeichert.
                            </p>
                        )}
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <QuickCaptureFields
                            draft={draft}
                            onChange={patch}
                            autoFocusPurpose
                            showDescription
                            errors={fieldErrors}
                        />
                        {hasFieldErrors && (
                            <div
                                role="status"
                                aria-live="polite"
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-foreground"
                            >
                                Bitte ergänze die markierten Pflichtfelder, bevor du speicherst.
                            </div>
                        )}
                        {/* Inheritance Hint */}
                        {canInherit && inheritanceApplied && (
                            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                <p className="text-xs text-slate-700 font-medium">
                                    Basierend auf Organisations-Vorgaben
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Review-Zyklus, Richtlinien und Aufsichtsmodell werden aus den Organisationseinstellungen übernommen.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">
                            <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘↵</kbd>{" "}
                            {isGuestMode ? "Lokal speichern" : "Speichern"}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isGuestMode ? "Lokal speichern" : "Speichern"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            ) : null}
        </Dialog>
    );
}
