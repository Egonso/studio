"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/app-header";
import { getFullProject, getActiveProjectId, setActiveProjectId } from "@/lib/data-service";
import { AimsWizard } from "@/components/aims-wizard";
import { AimsDashboardView, type ChecklistState } from "@/components/aims-dashboard-view";
import { useToast } from "@/hooks/use-toast";
import { deriveComplianceState } from "@/lib/compliance-logic";
import type { ComplianceItem } from "@/lib/types";

export function AiManagementPageLoading() {
    return (
        <div className="flex h-screen w-full flex-col">
            <AppHeader />
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
    );
}

export function AiManagementPageClient() {
    const [isLoading, setIsLoading] = useState(true);
    const [projectName, setProjectName] = useState("");
    const [projectData, setProjectData] = useState<any>(null);
    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});

    const [viewMode, setViewMode] = useState<"wizard" | "dashboard">("wizard");
    const [initialWizardStep, setInitialWizardStep] = useState(1);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const projectId = searchParams.get("projectId");

    const loadData = useCallback(async (currentProjectId: string) => {
        if (!user) return;

        setIsLoading(true);
        setActiveProjectId(currentProjectId);

        const fullProjectData = await getFullProject();

        if (fullProjectData) {
            setProjectName(fullProjectData.projectName || "");
            setProjectData(fullProjectData);

            const answers = fullProjectData.assessmentAnswers;
            if (answers && Object.keys(answers).length > 0) {
                const derivedData = deriveComplianceState(answers);
                setComplianceItems(derivedData);

                if (fullProjectData.checklistState) {
                    const loadedState: ChecklistState = {};
                    derivedData.forEach((item) => {
                        loadedState[item.id] =
                            (fullProjectData.checklistState as Record<string, any>)[item.id] || {
                                loading: false,
                                error: null,
                                data: null,
                                checkedTasks: {},
                            };
                    });
                    setChecklistState(loadedState);
                }
            }

            const progress = fullProjectData.aimsProgress || {};
            const completedSteps = Object.values(progress).filter((value) => value === true).length;
            const totalSteps = 6;

            if (completedSteps === totalSteps) {
                setViewMode("dashboard");
            } else {
                setViewMode("wizard");

                let resumeStep = 1;
                if (!progress.step1_complete) resumeStep = 1;
                else if (!progress.step2_complete) resumeStep = 2;
                else if (!progress.step3_complete) resumeStep = 3;
                else if (!progress.step4_complete) resumeStep = 4;
                else if (!progress.step5_complete) resumeStep = 5;
                else if (!progress.step6_complete) resumeStep = 6;
                else resumeStep = 6;

                setInitialWizardStep(resumeStep);

                if (completedSteps === 0) {
                    toast({
                        title: "ISO 42001 Setup starten",
                        description:
                            "In ca. 10–20 Minuten richten Sie Ihr KI-Managementsystem ein. Alle Eingaben werden automatisch dokumentiert.",
                        duration: 6000,
                    });
                } else {
                    toast({
                        title: "Willkommen zurück",
                        description: `Sie sind bei Schritt ${resumeStep} von 6. Wir machen hier weiter.`,
                        duration: 5000,
                    });
                }
            }
        } else {
            console.warn("No project data found");
        }

        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        const activeProjectId = projectId || getActiveProjectId();
        if (activeProjectId) {
            if (activeProjectId !== projectId) {
                router.push(`/ai-management?projectId=${activeProjectId}`);
                return;
            }

            loadData(activeProjectId);
            return;
        }

        router.push("/my-register");
    }, [authLoading, loadData, projectId, router, user]);

    const handleWizardCallback = () => {
        const currentProjectId = projectId || getActiveProjectId();
        if (!currentProjectId) return;
        loadData(currentProjectId);
    };

    const handleRestartWizard = () => {
        setInitialWizardStep(1);
        setViewMode("wizard");
        toast({
            title: "Wizard Neustart",
            description: "Sie können nun Ihre Angaben überarbeiten.",
        });
    };

    if (isLoading || authLoading) {
        return <AiManagementPageLoading />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader />
            {viewMode === "wizard" ? (
                <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
                    <AimsWizard initialStep={initialWizardStep} onComplete={handleWizardCallback} />
                </div>
            ) : (
                <AimsDashboardView
                    projectName={projectName}
                    complianceItems={complianceItems}
                    checklistState={checklistState}
                    setChecklistState={setChecklistState}
                    aimsData={projectData?.aimsData || {}}
                    aimsProgress={projectData?.aimsProgress || {}}
                    onRestartWizard={handleRestartWizard}
                />
            )}
        </div>
    );
}
