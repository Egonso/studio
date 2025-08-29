
"use client";

import { AppHeader } from "@/components/app-header";
import { Dashboard, type ChecklistState } from "@/components/dashboard";
import type { ComplianceItem } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deriveComplianceState, recalculateComplianceStatus } from "@/lib/compliance-logic";


export default function DashboardPage() {
    const [initialComplianceData, setInitialComplianceData] = useState<ComplianceItem[] | null>(null);
    const [checklistState, setChecklistState] = useState<ChecklistState>(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('checklistState');
            return savedState ? JSON.parse(savedState) : {};
        }
        return {};
    });
    const router = useRouter();

    useEffect(() => {
        const storedAnswers = localStorage.getItem('assessmentAnswers');
        if (!storedAnswers) {
            router.push('/assessment');
            return;
        }

        const answers = JSON.parse(storedAnswers);
        const derivedData = deriveComplianceState(answers);
        setInitialComplianceData(derivedData);

    }, [router]);
    
    // This recalculates the compliance data whenever the checklist state changes.
    const complianceData = useMemo(() => {
        if (!initialComplianceData) return null;
        
        return initialComplianceData.map(item => 
            recalculateComplianceStatus(item, checklistState[item.id])
        );

    }, [initialComplianceData, checklistState]);


    useEffect(() => {
        localStorage.setItem('checklistState', JSON.stringify(checklistState));
    }, [checklistState]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        {complianceData ? (
             <Dashboard 
                complianceItems={complianceData}
                checklistState={checklistState}
                setChecklistState={setChecklistState}
             />
        ) : (
            <div className="flex items-center justify-center h-full p-8">
                <p>Lade Compliance-Status...</p>
            </div>
        )}
      </main>
    </div>
  );
}
