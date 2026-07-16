"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import {
    trackCoverageAssistSaved,
} from "@/lib/analytics/coverage-assist-events";
import { trackProductFunnelEvent } from "@/lib/analytics/product-funnel-client";
import type { CaptureAssistContext } from "@/lib/coverage-assist/types";
import type {
    CaptureUsageContext,
    DataCategory,
    DecisionInfluence,
    OrgSettings,
    OrderedUseCaseSystem,
    UseCaseWorkflow,
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
    assistContext?: CaptureAssistContext | null;
    onStartDraftAssist?: () => void;
    showSuccessReceipt?: boolean;
    captureSource?: "training_completion" | "training_landing" | "register_landing" | "invite";
    analyticsSessionId?: string | null;
    captureMode?: "direct" | "description_assist" | "coverage_assist";
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
    systems: OrderedUseCaseSystem[];
    workflow?: UseCaseWorkflow;
    usageContexts: CaptureUsageContext[];
    dataCategories: DataCategory[];
    decisionInfluence: DecisionInfluence | null;
    description: string;
    assistContext?: CaptureAssistContext | null;
}

interface CaptureSuccessReceipt {
    storage: "local" | "register";
    useCaseId?: string;
    location: string;
    reviewer: string;
}

function createInitialDraft(
    initialDraft?: (Partial<QuickDraft> & { ownerName?: string })
): QuickDraft {
    const derivedSystems =
        initialDraft?.systems && initialDraft.systems.length > 0
            ? [...initialDraft.systems]
            : initialDraft?.toolId && initialDraft.toolId !== TOOL_PLACEHOLDER_ID
                ? [
                    {
                        entryId: "initial_primary",
                        position: 1,
                        toolId: initialDraft.toolId,
                        toolFreeText:
                            initialDraft.toolId === "other"
                                ? initialDraft.toolFreeText
                                : undefined,
                    },
                ]
                : [];

    return {
        purpose: initialDraft?.purpose?.slice(0, 160) ?? "",
        ownerRole: initialDraft?.ownerRole ?? initialDraft?.ownerName ?? "",
        contactPersonName: initialDraft?.contactPersonName ?? "",
        toolId: initialDraft?.toolId ?? TOOL_PLACEHOLDER_ID,
        toolFreeText: initialDraft?.toolFreeText ?? "",
        systems: derivedSystems,
        workflowConnectionMode: initialDraft?.workflowConnectionMode ?? null,
        workflowSummary: initialDraft?.workflowSummary ?? "",
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
    assistContext = null,
    onStartDraftAssist,
    showSuccessReceipt = false,
    captureSource,
    analyticsSessionId,
    captureMode,
}: QuickCaptureModalProps) {
    const multisystemEnabled = registerFirstFlags.multisystemCapture;
    const isGuestMode = mode === "guest";
    const [draft, setDraft] = useState<QuickDraft>(() => createInitialDraft(initialDraft));
    const [fieldErrors, setFieldErrors] = useState<SharedCaptureFieldErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
    const [inheritanceApplied, setInheritanceApplied] = useState(false);
    const [activeRegisterName, setActiveRegisterName] = useState("aktiven Register");
    const [reviewerName, setReviewerName] = useState("Registerverantwortung");
    const [successReceipt, setSuccessReceipt] = useState<CaptureSuccessReceipt | null>(null);
    const trackedOpenRef = useRef(false);
    const { allowed: canInheritRaw } = useCapability("extendedOrgSettings");
    const canInherit = canInheritRaw && !isGuestMode;
    const { toast } = useToast();
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    useEffect(() => {
        if (open) {
            setDraft(createInitialDraft(initialDraft));
            setFieldErrors({});
            setSuccessReceipt(null);
            trackedOpenRef.current = false;
        }
    }, [initialDraft, open]);

    useEffect(() => {
        if (!open || trackedOpenRef.current) return;
        trackedOpenRef.current = true;
        const mode = captureMode ?? (assistContext?.assist === "coverage"
            ? "coverage_assist"
            : "direct");
        void trackProductFunnelEvent({
            eventName: "capture_started",
            payload: {
                mode,
                ...(captureSource ? { source: captureSource } : {}),
            },
            context: {
                source: "capture",
                ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
            },
        });
    }, [analyticsSessionId, assistContext?.assist, captureMode, captureSource, open]);

    // Load orgSettings from active register for inheritance
    useEffect(() => {
        Promise.all([
            registerService.listRegisters(),
            registerService.getActiveRegister().catch(() => null),
        ]).then(([regs, activeRegister]) => {
            const register = activeRegister ?? regs[0] ?? null;
            if (register) {
                setActiveRegisterName(
                    register.organisationName || register.name || "aktiven Register",
                );
                const settings = register.orgSettings ?? null;
                setReviewerName(
                    settings?.raci?.reviewOwner?.name?.trim() ||
                    settings?.contactPerson?.name?.trim() ||
                    "Registerverantwortung",
                );
            }
            if (canInherit && register?.orgSettings) {
                setOrgSettings(register.orgSettings);
                const merged = applyOrgDefaults(register.orgSettings);
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
        setFieldErrors(
            validateSharedCaptureFields(draft, {
                multisystemEnabled,
            }).errors
        );
    }, [draft, hasFieldErrors, multisystemEnabled]);

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
        const validation = validateSharedCaptureFields(draft, {
            multisystemEnabled,
        });
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            focusCaptureField(validation.firstInvalidField);
            void trackProductFunnelEvent({
                eventName: "capture_validation_failed",
                payload: {
                    fields: Object.keys(validation.errors) as Array<"purpose" | "ownerRole">,
                },
                context: {
                    source: "capture",
                    ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
                },
            });
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
                    systems: validation.normalized.orderedSystems,
                    workflow: validation.normalized.workflow,
                    usageContexts: validation.normalized.usageContexts,
                    dataCategories: validation.normalized.dataCategories ?? [],
                    decisionInfluence: validation.normalized.decisionInfluence ?? null,
                    description: draft.description.trim(),
                    assistContext,
                };

                const key = "kiregister_guest_captures";
                const existingRaw = window.localStorage.getItem(key);
                const existing = existingRaw ? (JSON.parse(existingRaw) as GuestCaptureEntry[]) : [];
                window.localStorage.setItem(key, JSON.stringify([guestEntry, ...existing]));

                toast({
                    title: "Lokal gespeichert",
                    description: "Gast-Eintrag wurde lokal im Browser gespeichert.",
                });

                if (assistContext?.assist === "coverage" && assistContext.source) {
                    trackCoverageAssistSaved({
                        source: assistContext.source,
                        toolId:
                            assistContext.detectedToolId ??
                            validation.normalized.toolId ??
                            "",
                        selectionMode: assistContext.selectionMode ?? null,
                        seedSuggestionId: assistContext.seedSuggestionId ?? null,
                        libraryVersion: assistContext.libraryVersion ?? null,
                    });
                }

                void Promise.all([
                    trackProductFunnelEvent({
                        eventName: "capture_completed",
                        payload: {
                            storage: "local",
                            ...(captureSource ? { source: captureSource } : {}),
                        },
                        context: {
                            source: "capture",
                            ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
                        },
                    }),
                    trackProductFunnelEvent({
                        eventName: "first_real_use_case_completed",
                        payload: { storage: "local" },
                        context: {
                            source: "capture",
                            ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
                        },
                    }),
                ]);

                setDraft(createInitialDraft(initialDraft));
                if (showSuccessReceipt) {
                    setSuccessReceipt({
                        storage: "local",
                        location: "in diesem Browser",
                        reviewer: "noch nicht zugeordnet",
                    });
                    return;
                }
                onCaptured?.();
                onOpenChange(false);
                return;
            }

            const card = await registerService.createUseCaseFromCapture({
                purpose: validation.normalized.purpose,
                toolId: validation.normalized.toolId,
                toolFreeText: validation.normalized.toolFreeText,
                workflow: validation.normalized.workflow,
                usageContexts: validation.normalized.usageContexts,
                dataCategories: validation.normalized.dataCategories,
                decisionInfluence: validation.normalized.decisionInfluence,
                isCurrentlyResponsible: false,
                responsibleParty: validation.normalized.ownerRole,
                contactPersonName: validation.normalized.contactPersonName,
                decisionImpact: "UNSURE",
            }, {
                assistContext,
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

            if (assistContext?.assist === "coverage" && assistContext.source) {
                trackCoverageAssistSaved({
                    source: assistContext.source,
                    toolId: assistContext.detectedToolId ?? card.toolId ?? "",
                    selectionMode: assistContext.selectionMode ?? null,
                    seedSuggestionId: assistContext.seedSuggestionId ?? null,
                    libraryVersion: assistContext.libraryVersion ?? null,
                });
            }

            void Promise.all([
                trackProductFunnelEvent({
                    eventName: "capture_completed",
                    payload: {
                        storage: "register",
                        ...(captureSource ? { source: captureSource } : {}),
                    },
                    context: {
                        source: "capture",
                        ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
                    },
                }),
                trackProductFunnelEvent({
                    eventName: "first_real_use_case_completed",
                    payload: { storage: "register" },
                    context: {
                        source: "capture",
                        ...(analyticsSessionId ? { anonymousSessionId: analyticsSessionId } : {}),
                    },
                }),
            ]);

            setDraft(createInitialDraft(initialDraft));
            if (showSuccessReceipt) {
                setSuccessReceipt({
                    storage: "register",
                    useCaseId: card.useCaseId,
                    location: activeRegisterName,
                    reviewer: reviewerName,
                });
                return;
            }
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
                    className={`max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[560px] ${renderInline ? "top-4 sm:top-8 translate-y-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4" : ""}`}
                    hideOverlay={renderInline}
                    fallbackTitle={null}
                    fallbackDescription={null}
                    closeLabel="Schließen"
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
                >
                    <DialogHeader className="border-b border-slate-200 px-6 pb-4 pt-6 pr-12">
                        <DialogTitle className="text-lg">
                            {successReceipt ? "Erfassung abgeschlossen" : "KI-Einsatzfall erfassen"}
                        </DialogTitle>
                        <DialogDescription>
                            {successReceipt
                                ? "Der Speicherort und die nächste Zuständigkeit sind eindeutig dokumentiert."
                                : "Erfassen Sie zuerst nur das Minimum. Details können Sie später ergänzen."}
                        </DialogDescription>
                        {isGuestMode && !successReceipt && (
                            <p className="text-xs text-muted-foreground">
                                Gastmodus: Einträge werden lokal in diesem Browser gespeichert.
                            </p>
                        )}
                    </DialogHeader>

                    {successReceipt ? (
                        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                                <div>
                                    <p className="font-medium text-slate-950">
                                        {successReceipt.storage === "local"
                                            ? "In diesem Browser gespeichert"
                                            : `Im Register „${successReceipt.location}“ gespeichert`}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Zuständig für den nächsten Prüfschritt: {successReceipt.reviewer}.
                                        Der Eintrag bleibt bis zur menschlichen Prüfung im Status
                                        „Formale Prüfung ausstehend“.
                                    </p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-5">
                                <p className="text-xs leading-5 text-slate-600">
                                    Der Use Case Pass bündelt später Angaben, Status und Nachweise.
                                    Er ist kein automatisches Rechtsurteil.
                                </p>
                            </div>
                        </div>
                    ) : (
                    <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-5">
                        {onStartDraftAssist ? (
                            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Sie kennen die Details noch nicht? Eine kurze Beschreibung reicht für einen vorbefüllten Entwurf.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={onStartDraftAssist}
                                >
                                    Mit Beschreibung starten
                                </Button>
                            </div>
                        ) : null}
                        {hasFieldErrors && (
                            <div
                                role="alert"
                                aria-live="assertive"
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                            >
                                Bitte ergänzen Sie die markierten Pflichtfelder. Das erste fehlende Feld ist bereits fokussiert.
                            </div>
                        )}
                        <QuickCaptureFields
                            draft={draft}
                            onChange={patch}
                            autoFocusPurpose
                            showDescription
                            errors={fieldErrors}
                        />
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
                    )}

                    {/* Actions */}
                    {successReceipt ? (
                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {successReceipt.storage === "local"
                                    ? "Zur Startseite"
                                    : "Im Register bleiben"}
                            </Button>
                            {successReceipt.storage === "register" && successReceipt.useCaseId ? (
                                <Button onClick={() => onCaptured?.(successReceipt.useCaseId)}>
                                    Eintrag öffnen
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        window.location.assign("/?mode=login&returnTo=%2Fmy-register");
                                    }}
                                >
                                    Anmelden und zuordnen
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] text-muted-foreground">
                            <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘↵</kbd>{" "}
                            {isGuestMode ? "Lokal speichern" : "Speichern"}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isGuestMode ? "Lokal speichern" : "Speichern"}
                            </Button>
                        </div>
                    </div>
                    )}
                </DialogContent>
            ) : null}
        </Dialog>
    );
}
