"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Check,
    ChevronRight,
    FileText,
    Loader2,
    Lock,
    Settings2,
    Eye,
    Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
    PolicyDocument,
    PolicyLevel,
    PolicySection,
    PolicyContext,
    PolicyOrgSnapshot,
} from "@/lib/policy-engine/types";
import {
    POLICY_LEVEL_LABELS,
} from "@/lib/policy-engine/types";
import { assemblePolicy } from "@/lib/policy-engine/assembler";
import { PolicyPreview } from "./policy-preview";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

interface PolicyBuilderWizardProps {
    context: PolicyContext | null;
    /** Available sections from the assembler (PE-2). Falls back to empty. */
    assembledSections?: PolicySection[];
    /** Org snapshot for creating the policy */
    orgSnapshot: PolicyOrgSnapshot;
    /** Feature gate: can user access Level 3? */
    canAccessLevel3?: boolean;
    /** Called when wizard finishes (save clicked) */
    onSave: (doc: Omit<PolicyDocument, "policyId" | "metadata">) => Promise<void>;
    /** Cancel / close wizard */
    onCancel?: () => void;
}

// ── Step Definitions ──────────────────────────────────────────────────────────

const STEPS = [
    { icon: FileText, label: "Level wählen" },
    { icon: Settings2, label: "Daten prüfen" },
    { icon: Eye, label: "Vorschau" },
    { icon: Save, label: "Speichern" },
] as const;

const LEVEL_DETAILS: Record<
    PolicyLevel,
    { title: string; pages: string; description: string; sections: string[] }
> = {
    1: {
        title: "Commitment",
        pages: "~1 Seite",
        description:
            "Einfaches AI-Commitment Statement für KMU. Ideal als schneller Einstieg.",
        sections: [
            "AI-Commitment Statement",
            "Grundregeln für KI-Nutzung",
            "Unterschriftsblock",
        ],
    },
    2: {
        title: "Framework",
        pages: "3–5 Seiten",
        description:
            "Vollständiges KI-Framework mit Rollen, Risikomanagement und Schulungspflichten.",
        sections: [
            "Alles aus Level 1",
            "Rollen & Verantwortlichkeiten",
            "Risikobasierter Einsatz",
            "Vorfallmanagement",
            "Schulung & Qualifizierung",
            "Monitoring & Audit",
        ],
    },
    3: {
        title: "Erweitert",
        pages: "8–10 Seiten",
        description:
            "Erweiterte Policy mit Data Governance, Hochrisiko-Abschnitten und Logging.",
        sections: [
            "Alles aus Level 1 + 2",
            "Data Governance (bei personenbez. Daten)",
            "Hochrisiko-Systeme (bei AI Act Hochrisiko)",
            "Transparenzpflichten",
            "Validierung & Test",
            "Logging & Alarmierung",
            "HR-Recruitment (bei Bewerber-Use Cases)",
        ],
    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAutoFilledFields(
    orgSnapshot: PolicyOrgSnapshot,
): { label: string; value: string; filled: boolean }[] {
    return [
        {
            label: "Firmenname",
            value: orgSnapshot.organisationName || "",
            filled: Boolean(orgSnapshot.organisationName),
        },
        {
            label: "Branche",
            value: orgSnapshot.industry || "",
            filled: Boolean(orgSnapshot.industry),
        },
        {
            label: "Ansprechpartner",
            value: orgSnapshot.contactPerson || "",
            filled: Boolean(orgSnapshot.contactPerson),
        },
    ];
}

// ── Component ───────────────────────────────────────────────────────────────

export function PolicyBuilderWizard({
    context,
    assembledSections = [],
    orgSnapshot,
    canAccessLevel3 = false,
    onSave,
    onCancel,
}: PolicyBuilderWizardProps) {
    const [step, setStep] = useState<WizardStep>(1);
    const [selectedLevel, setSelectedLevel] = useState<PolicyLevel | null>(null);
    const [localSections, setLocalSections] = useState<PolicySection[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const autoFields = useMemo(
        () => getAutoFilledFields(orgSnapshot),
        [orgSnapshot],
    );
    const filledCount = autoFields.filter((f) => f.filled).length;

    // ── Dynamic Assembly ───────────────────────────────────────────────────
    useEffect(() => {
        if (selectedLevel && context) {
            try {
                const assem = assemblePolicy({
                    ...context,
                    level: selectedLevel,
                });
                setLocalSections(assem);
            } catch (err) {
                console.error("Assembly failed", err);
            }
        }
    }, [selectedLevel, context]);

    const sections = localSections.length > 0 ? localSections : assembledSections;

    const next = () => setStep((s) => Math.min(s + 1, 4) as WizardStep);
    const back = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

    const handleSave = async () => {
        if (!selectedLevel) return;
        setIsSaving(true);
        setError(null);
        try {
            await onSave({
                registerId: context?.register?.registerId || "",
                level: selectedLevel,
                status: "draft",
                title: `KI-Richtlinie – ${POLICY_LEVEL_LABELS[selectedLevel]}`,
                sections,
                orgContextSnapshot: orgSnapshot,
            });
        } catch {
            setError("Fehler beim Speichern. Bitte versuchen Sie es erneut.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Smart Policy Engine</CardTitle>
                <CardDescription>
                    Schritt {step} von 4 — {STEPS[step - 1].label}
                </CardDescription>
                {/* Step indicator */}
                <div className="flex gap-1 pt-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = i + 1 === step;
                        const isDone = i + 1 < step;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className={`h-1 w-full rounded-full transition-colors ${isDone || isActive ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                                <div
                                    className={`flex items-center gap-1 text-[10px] ${isActive
                                        ? "text-primary font-medium"
                                        : isDone
                                            ? "text-primary/60"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    {isDone ? (
                                        <Check className="h-2.5 w-2.5" />
                                    ) : (
                                        <Icon className="h-2.5 w-2.5" />
                                    )}
                                    <span className="hidden sm:inline">{s.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Step 1: Level wählen ─────────────────────────────────────── */}
                {step === 1 && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Wählen Sie den Umfang Ihrer KI-Richtlinie. Sie können später
                            ein höheres Level erstellen.
                        </p>
                        <div className="grid gap-3">
                            {([1, 2, 3] as PolicyLevel[]).map((level) => {
                                const detail = LEVEL_DETAILS[level];
                                const isSelected = selectedLevel === level;
                                const isLocked = level === 3 && !canAccessLevel3;

                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => setSelectedLevel(level)}
                                        className={`relative flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${isSelected
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : isLocked
                                                ? "opacity-60 cursor-not-allowed border-muted"
                                                : "hover:border-foreground/30"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    Level {level}: {detail.title}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {detail.pages}
                                                </Badge>
                                            </div>
                                            {isLocked && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Lock className="h-3 w-3" />
                                                    <span>Pro-Plan</span>
                                                </div>
                                            )}
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {detail.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {detail.sections.map((s) => (
                                                <Badge
                                                    key={s}
                                                    variant="outline"
                                                    className="text-[10px]"
                                                >
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <Button
                            onClick={next}
                            disabled={!selectedLevel}
                            className="w-full mt-4"
                        >
                            Weiter
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </>
                )}

                {/* ── Step 2: Automatische Befüllung prüfen ────────────────────── */}
                {step === 2 && (
                    <>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                {filledCount} von {autoFields.length} Feldern befüllt
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            {autoFields.map((field) => (
                                <div
                                    key={field.label}
                                    className={`flex items-center justify-between rounded-md border p-3 text-sm ${field.filled
                                        ? "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800"
                                        : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                                        }`}
                                >
                                    <span className="font-medium">{field.label}</span>
                                    {field.filled ? (
                                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-400">
                                            <Check className="h-3.5 w-3.5" />
                                            {field.value}
                                        </span>
                                    ) : (
                                        <span className="text-amber-700 dark:text-amber-400">
                                            Bitte ergänzen
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Fehlende Felder können Sie in den Governance-Einstellungen
                            ergänzen. Die Richtlinie wird trotzdem erstellt.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={back} className="flex-1">
                                Zurück
                            </Button>
                            <Button onClick={next} className="flex-1">
                                Weiter
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}

                {/* ── Step 3: Preview ──────────────────────────────────────────── */}
                {step === 3 && (
                    <>
                        {sections.length > 0 ? (
                            <PolicyPreview sections={sections} />
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">
                                    Section-Inhalte werden durch den Assembler generiert
                                </p>
                                <p className="text-xs mt-1">
                                    Sobald PE-2 Sections zur Verfügung stehen, erscheint hier die
                                    vollständige Richtlinie.
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={back} className="flex-1">
                                Zurück
                            </Button>
                            <Button onClick={next} className="flex-1">
                                Weiter
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}

                {/* ── Step 4: Speichern ────────────────────────────────────────── */}
                {step === 4 && selectedLevel && (
                    <>
                        <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Level</span>
                                <span className="font-medium">
                                    {selectedLevel}: {LEVEL_DETAILS[selectedLevel].title}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Abschnitte</span>
                                <span className="font-medium">{sections.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Organisation</span>
                                <span className="font-medium">
                                    {orgSnapshot.organisationName || "–"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="secondary">Entwurf</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={back} className="flex-1">
                                Zurück
                            </Button>
                            <Button
                                onClick={() => void handleSave()}
                                disabled={isSaving}
                                className="flex-1"
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Als Entwurf speichern
                            </Button>
                        </div>
                        {onCancel && (
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="w-full text-muted-foreground"
                            >
                                Abbrechen
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
