"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/app-header";
import { getFullProject, getActiveProjectId, setActiveProjectId, type AimsProgress } from "@/lib/data-service";
import { AimsWizard } from "@/components/aims-wizard";
import { AimsDashboardView, type ChecklistState } from "@/components/aims-dashboard-view";
import { useToast } from "@/hooks/use-toast";
import { deriveComplianceState } from "@/lib/compliance-logic";
import type { ComplianceItem } from "@/lib/types";

function AiManagementPageContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [projectName, setProjectName] = useState('');
    const [projectData, setProjectData] = useState<any>(null);
    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});

    // Controller States
    const [viewMode, setViewMode] = useState<'wizard' | 'dashboard'>('wizard');
    const [initialWizardStep, setInitialWizardStep] = useState(1);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const projectId = searchParams.get('projectId');

    // --- Data Loading & Logic ---

    const loadData = useCallback(async (currentProjectId: string) => {
        if (!user) return;
        setIsLoading(true);
        setActiveProjectId(currentProjectId);
        const fullProjectData = await getFullProject();

        if (fullProjectData) {
            setProjectName(fullProjectData.projectName || '');
            setProjectData(fullProjectData);

            // Derive Compliance Items for Dashboard View
            const answers = fullProjectData.assessmentAnswers;
            if (answers && Object.keys(answers).length > 0) {
                const derivedData = deriveComplianceState(answers);
                setComplianceItems(derivedData);
                if (fullProjectData.checklistState) {
                    const loadedState: ChecklistState = {};
                    derivedData.forEach(item => {
                        loadedState[item.id] = fullProjectData.checklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} };
                    });
                    setChecklistState(loadedState);
                }
            }

            // --- CONTROLLER LOGIC ---
            const progress = fullProjectData.aimsProgress || {};
            const completedSteps = Object.values(progress).filter(v => v === true).length;
            const totalSteps = 6;

            // CASE C: Fully Completed -> Show Dashboard
            if (completedSteps === totalSteps) {
                setViewMode('dashboard');
            } else {
                // CASE A & B: Incomplete -> Show Wizard
                setViewMode('wizard');

                // Determine Resume Step
                let resumeStep = 1;
                if (!progress.step1_complete) resumeStep = 1;
                else if (!progress.step2_complete) resumeStep = 2;
                else if (!progress.step3_complete) resumeStep = 3;
                else if (!progress.step4_complete) resumeStep = 4;
                else if (!progress.step5_complete) resumeStep = 5;
                else if (!progress.step6_complete) resumeStep = 6;
                else resumeStep = 6; // Safety fallback

                setInitialWizardStep(resumeStep);

                // Show Toasts based on State
                if (completedSteps === 0) {
                    toast({
                        title: "ISO 42001 Setup starten",
                        description: "In ca. 10–20 Minuten richten Sie Ihr KI-Managementsystem ein. Alle Eingaben werden automatisch dokumentiert.",
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
            router.push('/login');
            return;
        }

        const activeProjectId = projectId || getActiveProjectId();

        if (activeProjectId) {
            if (activeProjectId !== projectId) {
                router.push(`/ai-management?projectId=${activeProjectId}`);
            } else {
                loadData(activeProjectId);
            }
        } else {
            router.push('/projects');
        }
    }, [router, user, authLoading, projectId, loadData]);

    const handleWizardCallback = () => {
        // Called when user finishes wizard or wants to see dashboard
        // Ideally reload data to verify completion or just switch view
        loadData(projectId || getActiveProjectId()!);
    }

    const handleRestartWizard = () => {
        setInitialWizardStep(1);
        setViewMode('wizard');
        toast({
            title: "Wizard Neustart",
            description: "Sie können nun Ihre Angaben überarbeiten.",
        });
    }

    if (isLoading || authLoading) {
        return (
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            {viewMode === 'wizard' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                    <AimsWizard
                        initialStep={initialWizardStep}
                        onComplete={handleWizardCallback}
                    />
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

export default function AiManagementPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <AiManagementPageContent />
        </Suspense>
    );
}
