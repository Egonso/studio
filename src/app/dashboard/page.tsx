"use client";

import { AppHeader } from "@/components/app-header";
import { Dashboard, type FullComplianceInfo } from "@/components/dashboard";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deriveComplianceState } from "@/lib/compliance-logic";
import { useAuth } from "@/context/auth-context";
import { getFullProject, saveChecklistState, setActiveProjectId, getActiveProjectId, getUserProjects } from "@/lib/data-service";
import { Loader2 } from "lucide-react";

import { useUserStatus } from "@/hooks/use-user-status";

// ...

function DashboardPageContent() {
    const { user, loading: authLoading } = useAuth();
    // ...

    // Fetch User Status (Exam/Certificate)
    const { data: userStatus, loading: userStatusLoading } = useUserStatus(user?.email);

    // ...

    // Render logic...

    // Empty State Branch
    if (!fullComplianceData || !isoComplianceData || !portfolioComplianceData) {
        if (hasProjects === false) {
            return (
                <div className="flex flex-col min-h-screen bg-background">
                    <AppHeader />
                    <main className="flex-1">
                        <Dashboard
                            projectName=""
                            complianceData={[]}
                            setComplianceData={() => { }}

                            // ... other props

                            isoComplianceData={[]}
                            setIsoComplianceData={() => { }}
                            portfolioComplianceData={[]}
                            setPortfolioComplianceData={() => { }}
                            aimsData={{}}
                            aimsProgress={{}}
                            wizardStatus="not_started"
                            hasProjects={false}
                            userStatus={userStatus}
                            userStatusLoading={userStatusLoading}
                        />
                    </main>
                </div>
            );
        }
        // Loading state...
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1">
                <Dashboard
                    projectName={projectName}
                    complianceData={fullComplianceData}
                    setComplianceData={setFullComplianceData}
                    isoComplianceData={isoComplianceData}
                    setIsoComplianceData={setIsoComplianceData}
                    portfolioComplianceData={portfolioComplianceData}
                    setPortfolioComplianceData={setPortfolioComplianceData}
                    aimsData={projectData?.aimsData || {}}
                    aimsProgress={projectData?.aimsProgress || {}}
                    wizardStatus={projectData?.wizardStatus || 'not_started'}
                    policiesGenerated={projectData?.policiesGenerated}
                    userStatus={userStatus}
                    userStatusLoading={userStatusLoading}
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
