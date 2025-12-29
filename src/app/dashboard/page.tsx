
"use client";

import { AppHeader } from "@/components/app-header";
import { Dashboard, type FullComplianceInfo } from "@/components/dashboard";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deriveComplianceState } from "@/lib/compliance-logic";
import { useAuth } from "@/context/auth-context";
import { getFullProject, saveChecklistState, setActiveProjectId, getActiveProjectId } from "@/lib/data-service";
import { Loader2 } from "lucide-react";

function DashboardPageContent() {
    const [fullComplianceData, setFullComplianceData] = useState<FullComplianceInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [projectName, setProjectName] = useState('');
    const [projectData, setProjectData] = useState<any>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const projectId = searchParams.get('projectId');

    const loadData = useCallback(async (currentProjectId: string) => {
        if (!user) return;
        setIsLoading(true);

        setActiveProjectId(currentProjectId);

        const fullProjectData = await getFullProject();

        if (fullProjectData) {
            setProjectName(fullProjectData.projectName || '');
            setProjectData(fullProjectData);

            const answers = fullProjectData.assessmentAnswers;
            if (!answers || Object.keys(answers).length === 0) {
                router.push(`/assessment?projectId=${currentProjectId}`);
                return;
            }

            const derivedData = deriveComplianceState(answers);
            const savedChecklistState = fullProjectData.checklistState || {};

            const enrichedData: FullComplianceInfo[] = derivedData.map(item => ({
                ...item,
                checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
            }));

            setFullComplianceData(enrichedData);

            setFullComplianceData(enrichedData);

        } else {
            console.warn("No project data found, redirecting to projects page.");
            router.push('/projects');
            return;
        }

        setIsLoading(false);
    }, [router, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const activeProjectId = projectId || getActiveProjectId();

        if (activeProjectId) {
            if (activeProjectId !== projectId) {
                // Ensure URL reflects the active project
                router.push(`/dashboard?projectId=${activeProjectId}`);
            } else {
                loadData(activeProjectId);
            }
        } else {
            router.push('/projects');
        }
    }, [router, user, authLoading, projectId, loadData]);


    const updateChecklistStateInDb = useCallback(async (data: FullComplianceInfo[]) => {
        if (!user || isLoading) return;

        const checklistStateToSave = data.reduce((acc, item) => {
            if (item.checklistState) {
                acc[item.id] = {
                    data: item.checklistState.data,
                    checkedTasks: item.checklistState.checkedTasks
                };
            }
            return acc;
        }, {} as any);

        if (Object.keys(checklistStateToSave).length > 0) {
            await saveChecklistState(checklistStateToSave);
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (fullComplianceData) {
            updateChecklistStateInDb(fullComplianceData);
        }
    }, [fullComplianceData, updateChecklistStateInDb]);


    if (isLoading || !fullComplianceData || authLoading) {
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
            <main className="flex-1">
                <Dashboard
                    projectName={projectName}
                    complianceData={fullComplianceData}
                    setComplianceData={setFullComplianceData}
                    aimsData={projectData?.aimsData || {}}
                    aimsData={projectData?.aimsData || {}}
                    aimsProgress={projectData?.aimsProgress || {}}
                    wizardStatus={projectData?.wizardStatus || 'not_started'}
                />
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <DashboardPageContent />
        </Suspense>
    );
}
