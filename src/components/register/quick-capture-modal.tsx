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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registerService } from "@/lib/register-first/register-service";
import { createStaticToolRegistryService } from "@/lib/register-first/tool-registry-service";
import type { CaptureUsageContext, DataCategory, OrgSettings } from "@/lib/register-first/types";
import { USAGE_CONTEXT_OPTIONS, USAGE_CONTEXT_LABELS } from "@/lib/register-first/types";
import type { ToolRegistryEntry } from "@/lib/register-first/tool-registry-types";
import { applyOrgDefaults } from "@/lib/register-first/inheritance";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCaptured?: (useCaseId?: string) => void;
}

interface QuickDraft {
    purpose: string;
    ownerName: string;
    toolId: string;
    toolFreeText: string;
    usageContexts: CaptureUsageContext[];
    dataCategory: DataCategory;
    description: string;
}

const EMPTY_DRAFT: QuickDraft = {
    purpose: "",
    ownerName: "",
    toolId: "__placeholder__",
    toolFreeText: "",
    usageContexts: [],
    dataCategory: "NONE",
    description: "",
};

// ── Tool Registry ────────────────────────────────────────────────────────────

const toolRegistry = createStaticToolRegistryService();

/** Toggle an item in an array (add if absent, remove if present) */
function toggleMultiSelect<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

// ── Component ────────────────────────────────────────────────────────────────

export function QuickCaptureModal({ open, onOpenChange, onCaptured }: QuickCaptureModalProps) {
    const [draft, setDraft] = useState<QuickDraft>({ ...EMPTY_DRAFT });
    const [isSaving, setIsSaving] = useState(false);
    const [toolOptions, setToolOptions] = useState<{ value: string; label: string }[]>([]);
    const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
    const [inheritanceApplied, setInheritanceApplied] = useState(false);
    const { allowed: canInherit } = useCapability("extendedOrgSettings");
    const { toast } = useToast();

    useEffect(() => {
        toolRegistry.listActiveTools().then((tools: ToolRegistryEntry[]) => {
            setToolOptions(tools.map((t) => ({ value: t.toolId, label: t.productName })));
        }).catch(() => { });
    }, []);

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

    const canSave = draft.purpose.trim().length > 0 && draft.ownerName.trim().length >= 2 && draft.toolId.length > 0 && draft.toolId !== "__placeholder__";

    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);

        try {
            const card = await registerService.createUseCaseFromCapture({
                purpose: draft.purpose.trim(),
                toolId: draft.toolId === "other" ? "other" : draft.toolId,
                toolFreeText: draft.toolId === "other" ? draft.toolFreeText.trim() : undefined,
                usageContexts: draft.usageContexts.length > 0 ? draft.usageContexts : ["INTERNAL_ONLY"],
                dataCategory: draft.dataCategory,
                isCurrentlyResponsible: false,
                responsibleParty: draft.ownerName.trim(),
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

            setDraft({ ...EMPTY_DRAFT });
            onCaptured?.(card.useCaseId);
            onOpenChange(false);
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Use Case konnte nicht gespeichert werden.",
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
                className="sm:max-w-[480px]"
                onKeyDown={handleKeyDown}
                aria-describedby="qc-dialog-desc"
                aria-labelledby="qc-dialog-title"
            >
                <DialogHeader>
                    <DialogTitle id="qc-dialog-title" className="text-lg">Quick Capture</DialogTitle>
                    <DialogDescription id="qc-dialog-desc">
                        Erfasse nur das Minimum. Du kannst später ergänzen.
                    </DialogDescription>
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

                    {/* 2. Owner (required) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="qc-owner">
                            Verantwortlich <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="qc-owner"
                            placeholder="Name eingeben"
                            value={draft.ownerName}
                            onChange={(e) => patch({ ownerName: e.target.value })}
                        />
                    </div>

                    {/* 3. Tool (required) */}
                    <div className="space-y-1.5">
                        <Label>
                            Tool <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={draft.toolId}
                            onValueChange={(v) => {
                                if (v === "__placeholder__") return;
                                patch({ toolId: v });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tool auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__placeholder__" className="hidden">
                                    Tool auswählen
                                </SelectItem>
                                {toolOptions.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                                <SelectItem value="other">Anderes Tool…</SelectItem>
                            </SelectContent>
                        </Select>
                        {draft.toolId === "other" && (
                            <Input
                                placeholder="Tool-Name eingeben"
                                value={draft.toolFreeText}
                                onChange={(e) => patch({ toolFreeText: e.target.value })}
                                className="mt-1.5"
                            />
                        )}
                    </div>

                    {/* 4. Wirkungsbereich (multi-select checkboxes) */}
                    <div className="space-y-2">
                        <Label>Wirkungsbereich</Label>
                        <div className="space-y-2">
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

                    {/* 5. Data Category */}
                    <div className="space-y-1.5">
                        <Label>Datenkategorie</Label>
                        <Select
                            value={draft.dataCategory}
                            onValueChange={(v) => patch({ dataCategory: v as DataCategory })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">Keine besonderen Daten</SelectItem>
                                <SelectItem value="INTERNAL">Interne Daten</SelectItem>
                                <SelectItem value="PERSONAL">Personenbezogene Daten</SelectItem>
                                <SelectItem value="SENSITIVE">Sensible Daten</SelectItem>
                            </SelectContent>
                        </Select>
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
                        <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘↵</kbd> Speichern
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={() => void handleSave()} disabled={!canSave || isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Speichern
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
