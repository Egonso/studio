import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, CheckCircle2, ArrowRight, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateWizardStatus } from "@/lib/data-service";
import { useState } from "react";
import { getNextRecommendation } from "@/lib/recommendation/nextStep";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { ProjectCreationWizard } from "@/components/wizard/project-creation-wizard";

interface GuidanceFrameProps {
    projectId: string;
    wizardStatus: 'not_started' | 'in_progress' | 'completed' | 'no_projects';
    projectName: string;
    policiesGenerated?: boolean;
    isoWizardStarted?: boolean;
}

export function DashboardGuidanceFrame({
    projectId,
    wizardStatus,
    projectName,
    policiesGenerated = false,
    isoWizardStarted = false
}: GuidanceFrameProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Special handling for "No Projects" state
    if (wizardStatus === 'no_projects') {
        return (
            <Card className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 mb-8 overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col items-center text-center gap-6 py-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Willkommen beim AI Act Compass
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                Starten Sie jetzt Ihre erste Bewertung. Wir führen Sie Schritt für Schritt durch den Prozess der EU AI Act Compliance.
                            </p>
                        </div>

                        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="text-base py-6 px-8 shadow-md hover:shadow-lg transition-all">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Erstes Projekt anlegen
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Neues Projekt erstellen</DialogTitle>
                                    <DialogDescription>
                                        Geben Sie die Basisdaten Ihres KI-Systems ein, um die Bewertung zu starten.
                                    </DialogDescription>
                                </DialogHeader>
                                <ProjectCreationWizard
                                    variant="card"
                                    onComplete={(newProjectId) => {
                                        setIsWizardOpen(false);
                                        router.push(`/dashboard?projectId=${newProjectId}`);
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const recommendation = getNextRecommendation({
        aiActBaseWizardCompleted: wizardStatus === 'completed',
        policiesGenerated,
        isoWizardStarted,
        projectName
    });

    const handlePrimaryAction = async () => {
        setIsLoading(true);
        // Special legacy handling for Base Wizard state transition
        if (recommendation.key === 'AI_ACT_BASE' && wizardStatus === 'not_started') {
            try {
                await updateWizardStatus('in_progress');
            } catch (e) {
                console.error("Failed to update status", e);
            }
        }

        // Add projectId to href if needed (simple append if not present)
        let targetHref = recommendation.primaryHref;
        if (!targetHref.includes('projectId=')) {
            const separator = targetHref.includes('?') ? '&' : '?';
            targetHref = `${targetHref}${separator}projectId=${projectId}`;
        }

        router.push(targetHref);
        setIsLoading(false);
    };

    return (
        <Card className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 mb-8 overflow-hidden">
            <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                    {/* Header Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                                {recommendation.headline}
                            </h2>
                            {/* Tertiary Option: Create New Project */}
                            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Neues Projekt anlegen
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Neues Projekt erstellen</DialogTitle>
                                        <DialogDescription>
                                            Starten Sie eine neue Bewertung für ein weiteres KI-System.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ProjectCreationWizard
                                        variant="card"
                                        onComplete={(newProjectId) => {
                                            setIsWizardOpen(false);
                                            // Force navigation to new project
                                            window.location.href = `/dashboard?projectId=${newProjectId}`;
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        {recommendation.acknowledgement ? (
                            <p className="text-slate-600 dark:text-slate-400 max-w-3xl whitespace-pre-line">
                                {recommendation.acknowledgement}
                            </p>
                        ) : (
                            // Default Lead for Base State
                            <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                                Basierend auf den Mindestanforderungen des EU AI Acts, typischen Prüfpfaden und bewährter Audit-Praxis.
                            </p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-5 gap-8 items-start mt-2">
                        {/* Primary Action Section - Spans 3 columns */}
                        <div className="md:col-span-3 space-y-6">
                            <div className="bg-white dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                                    Nächster empfohlener Schritt:
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            {recommendation.primaryTitle}
                                        </h3>
                                        <p className="text-xs font-medium text-primary mt-1">
                                            {recommendation.primaryMeta}
                                        </p>
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {recommendation.primaryWhy}
                                    </p>

                                    <Button
                                        size="lg"
                                        className="w-full md:w-auto text-base py-6 px-8 shadow-md hover:shadow-lg transition-all"
                                        onClick={handlePrimaryAction}
                                        disabled={isLoading}
                                    >
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        {recommendation.primaryCtaLabel}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Steps Section - Spans 2 columns */}
                        <div className="md:col-span-2 space-y-6 pt-2">
                            {recommendation.secondary && recommendation.secondary.length > 0 ? (
                                <>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                                        Weitere Optionen - in speziellen Fällen sinnvoll
                                    </h4>
                                    <div className="space-y-4">
                                        {recommendation.secondary.map((item, idx) => (
                                            <Link
                                                key={idx}
                                                href={`${item.href}${item.href.includes('?') ? '&' : '?'}projectId=${projectId}`}
                                                className="group block p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm group-hover:text-primary transition-colors">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <p className="text-sm text-slate-500 italic">
                                        In dieser Phase konzentrieren wir uns voll auf die Basisdokumentation. Weitere Optionen werden freigeschaltet, sobald diese Grundlage steht.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
