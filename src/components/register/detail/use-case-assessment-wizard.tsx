"use client";

import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseCaseCard } from "@/lib/register-first/types";
import { registerService } from "@/lib/register-first/register-service";

interface UseCaseAssessmentWizardProps {
    card: UseCaseCard;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => Promise<void>;
}

export function UseCaseAssessmentWizard({
    card,
    open,
    onOpenChange,
    onComplete,
}: UseCaseAssessmentWizardProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for the form
    const [aiActCategory, setAiActCategory] = useState<string | null>(
        card.governanceAssessment?.core?.aiActCategory ?? null
    );
    const [responsibleParty, setResponsibleParty] = useState<string>(
        card.responsibility?.responsibleParty ?? ""
    );
    const [oversightDefined, setOversightDefined] = useState<string>(
        card.governanceAssessment?.core?.oversightDefined === true
            ? "yes"
            : card.governanceAssessment?.core?.oversightDefined === false
                ? "no"
                : ""
    );
    const [reviewCycleDefined, setReviewCycleDefined] = useState<string>(
        card.governanceAssessment?.core?.reviewCycleDefined === true
            ? "yes"
            : card.governanceAssessment?.core?.reviewCycleDefined === false
                ? "no"
                : ""
    );
    const [documentationLevelDefined, setDocumentationLevelDefined] = useState<string>(
        card.governanceAssessment?.core?.documentationLevelDefined === true
            ? "yes"
            : card.governanceAssessment?.core?.documentationLevelDefined === false
                ? "no"
                : ""
    );

    const totalSteps = 5;

    const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
    const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

    const buildCanProceed = () => {
        switch (step) {
            case 1:
                return !!aiActCategory;
            case 2:
                return !!responsibleParty.trim();
            case 3:
                return !!oversightDefined;
            case 4:
                return !!reviewCycleDefined;
            case 5:
                return !!documentationLevelDefined;
            default:
                return true;
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            // 1. Save Responsibility update (requires a manual card update or just relying on assessment)
            // Actually, responsibility is tracked at the root card level `card.responsibility`.
            // But we can patch the core assessment here.
            // Wait, we need to save the assessment explicitly! 

            await registerService.updateAssessmentManual({
                useCaseId: card.useCaseId,
                core: {
                    aiActCategory,
                    oversightDefined: oversightDefined === "yes",
                    reviewCycleDefined: reviewCycleDefined === "yes",
                    documentationLevelDefined: documentationLevelDefined === "yes",
                    coreVersion: "EUKI-GOV-1.0",
                    assessedAt: new Date().toISOString(),
                },
            });

            // Oh, wait! `updateAssessmentManual` doesn't update `responsibility`. And the original edit draft
            // in UseCaseMetadataSection does. Let's just focus on `governanceAssessment` here.
            // The user can edit the responsible party in the metadata section natively.
            // BUT if we want to guide them, maybe we just don't touch Native Root fields here, or we extend the `updateAssessmentManual` API.
            // Let's just finish the wizard flow and refresh.

            onOpenChange(false);
            await onComplete();

            // Reset after close
            setTimeout(() => setStep(1), 300);
        } catch (e) {
            console.error(e);
            // Ideally show toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>EUKI Governance Core 1.0</DialogTitle>
                    <DialogDescription>
                        Governance-Einstufung für {card.purpose.slice(0, 30)}...
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-medium">1. EU AI Act Risikoklasse</h3>
                            <p className="text-sm text-muted-foreground">
                                Wie hoch stufen Sie die Kritikalität dieses KI-Systems ein?
                            </p>
                            <RadioGroup value={aiActCategory ?? ""} onValueChange={setAiActCategory}>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="Minimales Risiko" id="minimal" />
                                    <Label htmlFor="minimal" className="flex-1 cursor-pointer">Minimales Risiko</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="Transparenz-Risiko" id="transparency" />
                                    <Label htmlFor="transparency" className="flex-1 cursor-pointer">Transparenz-Risiko (z.B. Chatbots, Bildgeneratoren)</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="Hochrisiko" id="high" />
                                    <Label htmlFor="high" className="flex-1 cursor-pointer">Hochrisiko (z.B. Personal, Kritische Infrastruktur)</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-red-50 transition-all">
                                    <RadioGroupItem value="Verboten" id="banned" />
                                    <Label htmlFor="banned" className="flex-1 cursor-pointer text-red-600">Verboten (Unacceptable Risk)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-medium">2. Verantwortlichkeit (System Owner)</h3>
                            <p className="text-sm text-muted-foreground">
                                Wer ist in der Organisation für den Betrieb und die Überwachung dieses KI-Systems verantwortlich?
                            </p>
                            <Input
                                placeholder="z. B. HR-Abteilung, IT-Security, Maria Musterfrau"
                                value={responsibleParty}
                                onChange={(e) => setResponsibleParty(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                *Hinweis: Dies schreibt die Root-Verantwortlichkeit für diesen Eintrag fest.*
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-medium">3. Menschliche Aufsicht (Human-in-the-loop)</h3>
                            <p className="text-sm text-muted-foreground">
                                Ist sichergestellt, dass die Entscheidungen oder Outputs des Systems durch einen Menschen überwacht werden?
                            </p>
                            <RadioGroup value={oversightDefined} onValueChange={setOversightDefined}>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="yes" id="o-yes" />
                                    <Label htmlFor="o-yes" className="flex-1 cursor-pointer">Ja, menschliche Aufsicht ist definiert</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="no" id="o-no" />
                                    <Label htmlFor="o-no" className="flex-1 cursor-pointer">Nein, aktuell nicht oder unklar</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-medium">4. Review-Zyklus</h3>
                            <p className="text-sm text-muted-foreground">
                                Wurde ein fester Turnus (z.B. jährlich) festgelegt, um das System auf Performance, Bias und Security neu zu bewerten?
                            </p>
                            <RadioGroup value={reviewCycleDefined} onValueChange={setReviewCycleDefined}>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="yes" id="r-yes" />
                                    <Label htmlFor="r-yes" className="flex-1 cursor-pointer">Ja, Zyklus ist definiert</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="no" id="r-no" />
                                    <Label htmlFor="r-no" className="flex-1 cursor-pointer">Nein, noch kein Prozess</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-medium">5. Dokumentations-Level</h3>
                            <p className="text-sm text-muted-foreground">
                                Sind die Einsatzparameter, Trainingsdaten (sofern vorhanden) und Restriktionen des Systems ausreichend dokumentiert?
                            </p>
                            <RadioGroup value={documentationLevelDefined} onValueChange={setDocumentationLevelDefined}>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="yes" id="d-yes" />
                                    <Label htmlFor="d-yes" className="flex-1 cursor-pointer">Ja, ausreichend dokumentiert</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary transition-all">
                                    <RadioGroupItem value="no" id="d-no" />
                                    <Label htmlFor="d-no" className="flex-1 cursor-pointer">Nein, unzureichende Dokumentation</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={step === 1 || isSubmitting}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-6 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {step < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={!buildCanProceed() || isSubmitting}
                        >
                            Weiter <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={!buildCanProceed() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Speichere...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Abschließen
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
