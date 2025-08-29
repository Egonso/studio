
"use client";

import { AppHeader } from "@/components/app-header";
import { Dashboard, type ChecklistState } from "@/components/dashboard";
import type { ComplianceItem } from "@/lib/types";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deriveComplianceState, recalculateComplianceStatus } from "@/lib/compliance-logic";
import { useAuth } from "@/context/auth-context";
import { getAssessmentAnswers, getChecklistState, saveChecklistState } from "@/lib/data-service";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const [initialComplianceData, setInitialComplianceData] = useState<ComplianceItem[] | null>(null);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { user, loading } = useAuth();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const answers = await getAssessmentAnswers();
        if (!answers) {
            router.push('/assessment');
            return;
        }
        const savedChecklistState = await getChecklistState();

        const derivedData = deriveComplianceState(answers);
        setInitialComplianceData(derivedData);
        if (savedChecklistState) {
            setChecklistState(savedChecklistState);
        }
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadData();
        }
    }, [router, user, loading, loadData]);

    const complianceData = useMemo(() => {
        if (!initialComplianceData) return null;
        
        return initialComplianceData.map(item => 
            recalculateComplianceStatus(item, checklistState[item.id])
        );

    }, [initialComplianceData, checklistState]);

    useEffect(() => {
        if (user && !isLoading) {
            saveChecklistState(checklistState);
        }
    }, [checklistState, user, isLoading]);

    if (isLoading || !complianceData || loading) {
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
                    complianceItems={complianceData}
                    checklistState={checklistState}
                    setChecklistState={setChecklistState}
                />
            </main>
        </div>
    );
}
