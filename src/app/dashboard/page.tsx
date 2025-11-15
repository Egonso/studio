
"use client";

import { AppHeader } from "@/components/app-header";
import { Dashboard } from "@/components/dashboard";
import type { ComplianceItem } from "@/lib/types";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deriveComplianceState, recalculateComplianceStatus } from "@/lib/compliance-logic";
import { useAuth } from "@/context/auth-context";
import { getAssessmentAnswers, getChecklistState, saveChecklistState, setActiveProjectId, getActiveProjectId } from "@/lib/data-service";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


function DashboardPageContent() {
    const [initialComplianceData, setInitialComplianceData] = useState<ComplianceItem[] | null>(null);
    const [checklistState, setChecklistState] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [projectName, setProjectName] = useState('');
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    
    const projectId = searchParams.get('projectId');

    const loadData = useCallback(async (currentProjectId: string) => {
        if (!user) return;
        setIsLoading(true);

        setActiveProjectId(currentProjectId);

        const projectDocRef = doc(db, `users/${user.uid}/projects`, currentProjectId);
        const projectSnap = await getDoc(projectDocRef);
        if (projectSnap.exists()) {
            setProjectName(projectSnap.data().projectName);
        } else {
            router.push('/projects');
            return;
        }

        const answers = await getAssessmentAnswers();
        if (!answers || Object.keys(answers).length === 0) {
            router.push(`/assessment?projectId=${currentProjectId}`);
            return;
        }

        const savedChecklistState = await getChecklistState();
        const derivedData = deriveComplianceState(answers);
        setInitialComplianceData(derivedData);

        if (savedChecklistState) {
            setChecklistState(savedChecklistState);
        }
        setIsLoading(false);
    }, [router, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (projectId) {
            loadData(projectId);
        } else {
            const activeProjectId = getActiveProjectId();
            if (activeProjectId) {
                router.push(`/dashboard?projectId=${activeProjectId}`);
            } else {
                router.push('/projects');
            }
        }
    }, [router, user, authLoading, projectId, loadData]);

    const complianceData = useMemo(() => {
        if (!initialComplianceData) return null;
        
        return initialComplianceData.map(item => 
            recalculateComplianceStatus(item, checklistState[item.id])
        );

    }, [initialComplianceData, checklistState]);

    useEffect(() => {
        if (user && !isLoading && Object.keys(checklistState).length > 0) {
            saveChecklistState(checklistState);
        }
    }, [checklistState, user, isLoading]);

    if (isLoading || !complianceData || authLoading) {
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
                    complianceItems={complianceData}
                    checklistState={checklistState}
                    setChecklistState={setChecklistState}
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
