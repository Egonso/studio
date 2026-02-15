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
import type { CaptureUsageContext, DataCategory } from "@/lib/register-first/types";
import type { ToolRegistryEntry } from "@/lib/register-first/tool-registry-types";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCaptured?: () => void;
}

interface QuickDraft {
    purpose: string;
    toolId: string;
    toolFreeText: string;
    usageContext: CaptureUsageContext;
    dataCategory: DataCategory;
    description: string;
}

const EMPTY_DRAFT: QuickDraft = {
    purpose: "",
    toolId: "",
    toolFreeText: "",
    usageContext: "INTERNAL_ONLY",
    dataCategory: "NONE",
    description: "",
};

// ── Tool Registry ────────────────────────────────────────────────────────────

const toolRegistry = createStaticToolRegistryService();

// ── Component ────────────────────────────────────────────────────────────────

export function QuickCaptureModal({ open, onOpenChange, onCaptured }: QuickCaptureModalProps) {
    const [draft, setDraft] = useState<QuickDraft>({ ...EMPTY_DRAFT });
    const [isSaving, setIsSaving] = useState(false);
    const [toolOptions, setToolOptions] = useState<{ value: string; label: string }[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        toolRegistry.listActiveTools().then((tools: ToolRegistryEntry[]) => {
            setToolOptions(tools.map((t) => ({ value: t.toolId, label: t.productName })));
        }).catch(() => { });
    }, []);

    const canSave = draft.purpose.trim().length > 0 && draft.toolId.length > 0;

    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);

        try {
            const card = await registerService.createUseCaseFromCapture({
                purpose: draft.purpose.trim(),
                toolId: draft.toolId === "other" ? "other" : draft.toolId,
                toolFreeText: draft.toolId === "other" ? draft.toolFreeText.trim() : undefined,
                usageContexts: [draft.usageContext],
                dataCategory: draft.dataCategory,
                isCurrentlyResponsible: true,
                decisionImpact: "UNSURE",
            });

            toast({
                title: "Registereintrag erstellt",
                description: `„${card.purpose}" – Status: Formale Prüfung ausstehend`,
            });

            setDraft({ ...EMPTY_DRAFT });
            onCaptured?.();
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
            >
                <DialogHeader>
                    <DialogTitle className="text-lg">Quick Capture</DialogTitle>
                    <DialogDescription>
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

                    {/* 2. Tool (required) */}
                    <div className="space-y-1.5">
                        <Label>
                            Tool <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={draft.toolId}
                            onValueChange={(v) => patch({ toolId: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tool auswählen" />
                            </SelectTrigger>
                            <SelectContent>
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

                    {/* 3. Usage Context */}
                    <div className="space-y-1.5">
                        <Label>Wirkungskontext</Label>
                        <Select
                            value={draft.usageContext}
                            onValueChange={(v) => patch({ usageContext: v as CaptureUsageContext })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL_ONLY">Nur intern</SelectItem>
                                <SelectItem value="CUSTOMER_FACING">Für Kund:innen</SelectItem>
                                <SelectItem value="EMPLOYEE_FACING">Für Mitarbeitende</SelectItem>
                                <SelectItem value="EXTERNAL_PUBLIC">Extern / öffentlich</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Data Category */}
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

                    {/* 5. Description (optional) */}
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
