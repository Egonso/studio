"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { registerService } from "@/lib/register-first/register-service";
import { ToolAutocomplete } from "@/components/tool-autocomplete";
import type { CaptureUsageContext, DataCategory, DecisionInfluence, OrgSettings } from "@/lib/register-first/types";
import {
    USAGE_CONTEXT_OPTIONS,
    USAGE_CONTEXT_LABELS,
    DATA_CATEGORY_MAIN_OPTIONS,
    DATA_CATEGORY_SPECIAL_OPTIONS,
    DATA_CATEGORY_LABELS,
    DECISION_INFLUENCE_OPTIONS,
    DECISION_INFLUENCE_LABELS,
} from "@/lib/register-first/types";
import { applyOrgDefaults } from "@/lib/register-first/inheritance";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCaptured?: (useCaseId?: string) => void;
    mode?: "register" | "guest";
    renderInline?: boolean;
    initialDraft?: Partial<QuickDraft>;
}

interface QuickDraft {
    purpose: string;
    ownerRole: string;
    contactPersonName: string;
    toolId: string;
    toolFreeText: string;
    usageContexts: CaptureUsageContext[];
    dataCategories: DataCategory[];
    decisionInfluence: DecisionInfluence | null;
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
        toolId: initialDraft?.toolId ?? "__placeholder__",
        toolFreeText: initialDraft?.toolFreeText ?? "",
        usageContexts: [...(initialDraft?.usageContexts ?? [])],
        dataCategories: [...(initialDraft?.dataCategories ?? [])],
        decisionInfluence: initialDraft?.decisionInfluence ?? null,
        description: initialDraft?.description?.slice(0, 160) ?? "",
    };
}

/** Toggle an item in an array (add if absent, remove if present) */
function toggleMultiSelect<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

// ── DataCategory mutual exclusion logic ──────────────────────────────────────

function applyDataCategoryLogic(categories: DataCategory[], toggled: DataCategory): DataCategory[] {
    let next = toggleMultiSelect(categories, toggled);

    // If checking NO_PERSONAL_DATA → remove all personal-related
    if (toggled === "NO_PERSONAL_DATA" && next.includes("NO_PERSONAL_DATA")) {
        next = next.filter(
            (c) => c !== "PERSONAL_DATA" && c !== "SPECIAL_PERSONAL" &&
                !DATA_CATEGORY_SPECIAL_OPTIONS.includes(c)
        );
    }

    // If checking PERSONAL_DATA or SPECIAL_PERSONAL or any sub → remove NO_PERSONAL_DATA
    if (
        toggled !== "NO_PERSONAL_DATA" &&
        (toggled === "PERSONAL_DATA" || toggled === "SPECIAL_PERSONAL" ||
            DATA_CATEGORY_SPECIAL_OPTIONS.includes(toggled)) &&
        next.includes(toggled)
    ) {
        next = next.filter((c) => c !== "NO_PERSONAL_DATA");
    }

    // If checking any SPECIAL sub-item → auto-check PERSONAL_DATA + SPECIAL_PERSONAL
    if (DATA_CATEGORY_SPECIAL_OPTIONS.includes(toggled) && next.includes(toggled)) {
        if (!next.includes("PERSONAL_DATA")) next = [...next, "PERSONAL_DATA"];
        if (!next.includes("SPECIAL_PERSONAL")) next = [...next, "SPECIAL_PERSONAL"];
    }

    // If checking SPECIAL_PERSONAL → auto-check PERSONAL_DATA
    if (toggled === "SPECIAL_PERSONAL" && next.includes("SPECIAL_PERSONAL")) {
        if (!next.includes("PERSONAL_DATA")) next = [...next, "PERSONAL_DATA"];
    }

    // If unchecking SPECIAL_PERSONAL → remove all sub-items
    if (toggled === "SPECIAL_PERSONAL" && !next.includes("SPECIAL_PERSONAL")) {
        next = next.filter((c) => !DATA_CATEGORY_SPECIAL_OPTIONS.includes(c));
    }

    // If unchecking PERSONAL_DATA → also uncheck SPECIAL_PERSONAL + sub-items
    if (toggled === "PERSONAL_DATA" && !next.includes("PERSONAL_DATA")) {
        next = next.filter(
            (c) => c !== "SPECIAL_PERSONAL" && !DATA_CATEGORY_SPECIAL_OPTIONS.includes(c)
        );
    }

    return next;
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
    const [isSaving, setIsSaving] = useState(false);
    const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
    const [inheritanceApplied, setInheritanceApplied] = useState(false);
    const { allowed: canInheritRaw } = useCapability("extendedOrgSettings");
    const canInherit = canInheritRaw && !isGuestMode;
    const { toast } = useToast();

    // Accordion state
    const [section1Open, setSection1Open] = useState(false);
    const [section2Open, setSection2Open] = useState(false);
    const [specialOpen, setSpecialOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setDraft(createInitialDraft(initialDraft));
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

    const canSave = draft.purpose.trim().length > 0 && draft.ownerRole.trim().length >= 2 && draft.toolId.length > 0 && draft.toolId !== "__placeholder__";

    // Count selections for badges
    const section1Count = draft.usageContexts.length + (draft.decisionInfluence ? 1 : 0);

    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);

        try {
            if (isGuestMode) {
                const guestEntry: GuestCaptureEntry = {
                    id: `guest_${Date.now()}`,
                    capturedAt: new Date().toISOString(),
                    purpose: draft.purpose.trim(),
                    ownerRole: draft.ownerRole.trim(),
                    contactPersonName: draft.contactPersonName.trim() || undefined,
                    tool: draft.toolId === "other" ? draft.toolFreeText.trim() : draft.toolId,
                    usageContexts: draft.usageContexts,
                    dataCategories: draft.dataCategories,
                    decisionInfluence: draft.decisionInfluence,
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
                setSection1Open(false);
                setSection2Open(false);
                setSpecialOpen(false);
                onCaptured?.();
                onOpenChange(false);
                return;
            }

            const card = await registerService.createUseCaseFromCapture({
                purpose: draft.purpose.trim(),
                toolId: draft.toolId === "other" ? "other" : draft.toolId,
                toolFreeText: draft.toolId === "other" ? draft.toolFreeText.trim() : undefined,
                usageContexts: draft.usageContexts.length > 0 ? draft.usageContexts : ["INTERNAL_ONLY"],
                dataCategories: draft.dataCategories.length > 0 ? draft.dataCategories : undefined,
                decisionInfluence: draft.decisionInfluence ?? undefined,
                isCurrentlyResponsible: false,
                responsibleParty: draft.ownerRole.trim(),
                contactPersonName: draft.contactPersonName.trim() || undefined,
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
            setSection1Open(false);
            setSection2Open(false);
            setSpecialOpen(false);
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
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSave) {
            e.preventDefault();
            void handleSave();
        }
    };

    const patch = (p: Partial<QuickDraft>) => setDraft((d) => ({ ...d, ...p }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                    {/* 1. Name (required) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="qc-purpose">
                            Use-Case Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="qc-purpose"
                            placeholder="z. B. Marketing Copy Generator"
                            value={draft.purpose}
                            onChange={(e) => patch({ purpose: e.target.value })}
                            autoFocus
                        />
                    </div>

                    {/* 2. Owner role (required) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="qc-owner">
                            Owner-Rolle (funktional) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="qc-owner"
                            placeholder="z. B. Head of Marketing / HR Lead / IT Security"
                            value={draft.ownerRole}
                            onChange={(e) => patch({ ownerRole: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Rolle oder Funktion erfassen, nicht den wechselnden Personennamen.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="qc-contact-person">Kontaktperson (optional)</Label>
                        <Input
                            id="qc-contact-person"
                            placeholder="z. B. Max Mustermann"
                            value={draft.contactPersonName}
                            onChange={(e) => patch({ contactPersonName: e.target.value })}
                        />
                    </div>

                    {/* 3. Tool (required) */}
                    <div className="space-y-1.5">
                        <Label>
                            System / Tool <span className="text-destructive">*</span>
                        </Label>
                        <ToolAutocomplete
                            value={draft.toolId === "other" || draft.toolId === "__placeholder__" ? draft.toolFreeText : draft.toolId}
                            onChange={(val, toolData) => {
                                if (toolData) {
                                    patch({
                                        toolId: toolData.name,
                                        toolFreeText: toolData.name,
                                        // Auto-fill purpose if empty
                                        purpose: draft.purpose || (toolData.category ? `Einsatz von ${toolData.name} für ${toolData.category}` : `Einsatz von ${toolData.name}`),
                                    });
                                } else {
                                    patch({ toolId: "other", toolFreeText: val });
                                }
                            }}
                        />
                    </div>

                    {/* ▼ Section 1: Wirkung & Betroffene (collapsible) */}
                    <div className="rounded-md border">
                        <button
                            type="button"
                            onClick={() => setSection1Open(!section1Open)}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                {section1Open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                Wirkung &amp; Betroffene
                            </span>
                            {section1Count > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                                    {section1Count} gewählt
                                </span>
                            )}
                        </button>

                        {section1Open && (
                            <div className="border-t px-3 py-3 space-y-4">
                                {/* Wirkungsbereich */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Wirkungsbereich (Mehrfachauswahl)</Label>
                                    <div className="space-y-1.5">
                                        {USAGE_CONTEXT_OPTIONS.map((option) => (
                                            <label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer text-sm"
                                            >
                                                <Checkbox
                                                    checked={draft.usageContexts.includes(option)}
                                                    onCheckedChange={() =>
                                                        patch({
                                                            usageContexts: toggleMultiSelect(
                                                                draft.usageContexts,
                                                                option,
                                                            ),
                                                        })
                                                    }
                                                />
                                                {USAGE_CONTEXT_LABELS[option]}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Einfluss auf Entscheidungen */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Einfluss auf Entscheidungen</Label>
                                    <div className="space-y-1.5">
                                        {DECISION_INFLUENCE_OPTIONS.map((option) => (
                                            <label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer text-sm"
                                            >
                                                <input
                                                    type="radio"
                                                    name="decisionInfluence"
                                                    checked={draft.decisionInfluence === option}
                                                    onChange={() => patch({ decisionInfluence: option })}
                                                    className="h-4 w-4 text-primary border-border"
                                                />
                                                {DECISION_INFLUENCE_LABELS[option]}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ▼ Section 2: Daten & Sensitivität (collapsible) */}
                    <div className="rounded-md border">
                        <button
                            type="button"
                            onClick={() => setSection2Open(!section2Open)}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                {section2Open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                Daten &amp; Sensitivität
                            </span>
                            {draft.dataCategories.length > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                                    {draft.dataCategories.filter((c) => DATA_CATEGORY_MAIN_OPTIONS.includes(c)).length} gewählt
                                </span>
                            )}
                        </button>

                        {section2Open && (
                            <div className="border-t px-3 py-3 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Datenkategorien (Mehrfachauswahl)</Label>

                                {DATA_CATEGORY_MAIN_OPTIONS.map((option) => (
                                    <div key={option}>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                                            <Checkbox
                                                checked={draft.dataCategories.includes(option)}
                                                onCheckedChange={() =>
                                                    patch({
                                                        dataCategories: applyDataCategoryLogic(
                                                            draft.dataCategories,
                                                            option,
                                                        ),
                                                    })
                                                }
                                            />
                                            <span className="flex-1">{DATA_CATEGORY_LABELS[option]}</span>
                                            {option === "SPECIAL_PERSONAL" && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSpecialOpen(!specialOpen);
                                                    }}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {specialOpen
                                                        ? <ChevronDown className="h-3.5 w-3.5" />
                                                        : <ChevronRight className="h-3.5 w-3.5" />
                                                    }
                                                </button>
                                            )}
                                        </label>

                                        {/* Expandable sub-options for SPECIAL_PERSONAL */}
                                        {option === "SPECIAL_PERSONAL" && specialOpen && (
                                            <div className="ml-6 mt-1 mb-2 space-y-1 rounded-md bg-muted/30 p-2">
                                                {DATA_CATEGORY_SPECIAL_OPTIONS.map((sub) => (
                                                    <label
                                                        key={sub}
                                                        className="flex items-center gap-2 cursor-pointer text-sm"
                                                    >
                                                        <Checkbox
                                                            checked={draft.dataCategories.includes(sub)}
                                                            onCheckedChange={() =>
                                                                patch({
                                                                    dataCategories: applyDataCategoryLogic(
                                                                        draft.dataCategories,
                                                                        sub,
                                                                    ),
                                                                })
                                                            }
                                                        />
                                                        {DATA_CATEGORY_LABELS[sub]}
                                                    </label>
                                                ))}
                                                <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
                                                    ℹ Art. 9 DSGVO umfasst auch: ethnische Herkunft, Gewerkschaftszugehörigkeit, genetische Daten, sexuelle Orientierung
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 6. Description (optional) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="qc-desc">Kurzbeschreibung</Label>
                        <Textarea
                            id="qc-desc"
                            placeholder="Optional, max. 160 Zeichen"
                            value={draft.description}
                            onChange={(e) => patch({ description: e.target.value.slice(0, 160) })}
                            rows={2}
                            maxLength={160}
                        />
                        <p className="text-right text-[10px] text-muted-foreground">
                            {draft.description.length}/160
                        </p>
                    </div>

                    {/* Inheritance Hint */}
                    {canInherit && inheritanceApplied && (
                        <div className="rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2">
                            <p className="text-xs text-blue-700 font-medium">
                                Basierend auf Organisations-Vorgaben
                            </p>
                            <p className="text-[11px] text-blue-600/80 mt-0.5">
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
                        <Button onClick={() => void handleSave()} disabled={!canSave || isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isGuestMode ? "Lokal speichern" : "Speichern"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
