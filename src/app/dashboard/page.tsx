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
import { registerService } from "@/lib/register-first/register-service";

function DashboardPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('projectId');

    // State 1: Global Loading (checking projects existence)
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);

    // State 2: User Context (Has projects?)
    const [hasProjects, setHasProjects] = useState<boolean>(false);

    // State 3: Project Data (Only used if hasProjects === true)
    const [fullComplianceData, setFullComplianceData] = useState<FullComplianceInfo[] | null>(null);
    const [isoComplianceData, setIsoComplianceData] = useState<FullComplianceInfo[] | null>(null);
    const [portfolioComplianceData, setPortfolioComplianceData] = useState<FullComplianceInfo[] | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectData, setProjectData] = useState<any>(null);

    // State 3b: Register-First data
    const [useCaseCount, setUseCaseCount] = useState(0);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);
    const [lastEntry, setLastEntry] = useState<{ name: string; date: string } | null>(null);
    const [allUseCases, setAllUseCases] = useState<import("@/lib/register-first/types").UseCaseCard[]>([]);
    const [currentRegister, setCurrentRegister] = useState<import("@/lib/register-first/types").Register | null>(null);
    const [isUseCaseLoading, setIsUseCaseLoading] = useState(false);

    // State 4: User Certification Status
    const { data: userStatus, loading: userStatusLoading } = useUserStatus(user?.email);

    // Initial Bootstrap: Check User Projects
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const bootstrapUser = async () => {
            try {
                const projects = await getUserProjects();

                if (projects.length === 0) {
                    setHasProjects(false);
                    setIsGlobalLoading(false);
                    return;
                }

                setHasProjects(true);

                // Determine Active Project ID
                // 1. URL Param
                // 2. Local Storage (Last Active)
                // 3. Fallback: First project in list
                let targetId = projectIdParam || getActiveProjectId();

                // Verify targetId exists in user's projects (security/integrity)
                const projectExists = projects.find((p: any) => p.id === targetId);

                if (!targetId || !projectExists) {
                    targetId = projects[0].id; // Fallback to first project
                }

                if (targetId) {
                    await loadProjectData(targetId);
                }

                // Load Register-First data (independent of project)
                await loadUseCaseData();

            } catch (error) {
                console.error("Dashboard bootstrap failed:", error);
                // Fallback to empty state on error to allow retry/recovery
                setHasProjects(false);
            } finally {
                setIsGlobalLoading(false);
            }
        };

        bootstrapUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]); // Intentionally running once on mount/auth-ready

    // Helper: Load Project Data
    const loadProjectData = useCallback(async (currentProjectId: string) => {
        setActiveProjectId(currentProjectId);

        // Ensure URL reflects active project without reloading
        window.history.replaceState(null, '', `/dashboard?projectId=${currentProjectId}`);

        const fullProjectData = await getFullProject();

        if (fullProjectData) {
            setProjectName(fullProjectData.projectName || '');
            setProjectData(fullProjectData);

            const answers = fullProjectData.assessmentAnswers;
            const savedChecklistState = (fullProjectData.checklistState || {}) as Record<string, any>;

            // 1. AI Act Pillar
            if (answers && Object.keys(answers).length > 0) {
                const derivedData = deriveComplianceState(answers);
                setFullComplianceData(derivedData.map(item => ({
                    ...item,
                    checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
                })));
            } else {
                // Fallback if no assessment answers yet
                setFullComplianceData([]);
            }

            // 2. ISO Pillar
            const getStatus = (completed: boolean | undefined, hasData: boolean): 'Compliant' | 'At Risk' | 'Non-Compliant' => {
                if (completed && hasData) return 'Compliant';
                if (completed || hasData) return 'At Risk';
                return 'Non-Compliant';
            };
            const aimsItems = [
                { id: 'iso-context', title: 'Kontext & Stakeholder', description: 'Verstehen der Organisation und der Bedürfnisse der Stakeholder.', status: getStatus(fullProjectData.aimsProgress?.step1_complete, !!(fullProjectData.aimsData as any)?.scope), details: (fullProjectData.aimsData as any)?.scope ? `Scope definiert.` : 'Noch nicht bewertet.' },
                { id: 'iso-leadership', title: 'Leadership & AI Policy', description: 'Festlegung von KI-Richtlinien und Verantwortlichkeiten.', status: getStatus(fullProjectData.aimsProgress?.step2_complete, !!(fullProjectData.aimsData as any)?.policy && (fullProjectData.aimsData as any).policy.length > 20), details: (fullProjectData.aimsData as any)?.policy ? 'Policy vorhanden.' : 'Noch nicht bewertet.' },
                { id: 'iso-planning', title: 'Planung & Risikoanalyse', description: 'Planung von Maßnahmen zum Umgang mit Risiken und Chancen.', status: getStatus(fullProjectData.aimsProgress?.step3_complete, (fullProjectData.aimsData as any)?.risks?.some((r: any) => r.description)), details: (fullProjectData.aimsData as any)?.risks?.length > 0 ? `${(fullProjectData.aimsData as any).risks.length} Risiken dokumentiert.` : 'Noch nicht bewertet.' },
                { id: 'iso-operation', title: 'Operation / AI Lifecycle', description: 'Steuerung des KI-System-Lebenszyklus.', status: getStatus(fullProjectData.aimsProgress?.step4_complete, (fullProjectData.aimsData as any)?.raci?.some((r: any) => r.task)), details: (fullProjectData.aimsData as any)?.raci?.length > 0 ? `${(fullProjectData.aimsData as any).raci.length} Verantwortlichkeiten definiert.` : 'Noch nicht bewertet.' },
                { id: 'iso-monitoring', title: 'Monitoring, KPIs & Performance', description: 'Überwachung, Messung, Analyse und Bewertung der Leistung.', status: getStatus(fullProjectData.aimsProgress?.step5_complete, !!(fullProjectData.aimsData as any)?.kpis), details: (fullProjectData.aimsData as any)?.kpis ? 'KPIs definiert.' : 'Noch nicht bewertet.' },
                { id: 'iso-improvement', title: 'Improvement / Korrekturmaßnahmen', description: 'Kontinuierliche Verbesserung des KI-Managementsystems.', status: getStatus(fullProjectData.aimsProgress?.step6_complete, !!(fullProjectData.aimsData as any)?.improvementProcess), details: (fullProjectData.aimsData as any)?.improvementProcess ? 'Verbesserungsprozess definiert.' : 'Noch nicht bewertet.' },
            ];
            setIsoComplianceData(aimsItems.map(item => ({
                ...item,
                checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
            })));

            // 3. Portfolio Pillar
            const portfolioItems = [
                { id: 'portfolio-strategy', title: 'Strategie & Vision', description: 'Definition der langfristigen KI-Ziele und Ausrichtung.', status: 'At Risk' as const, details: 'Initialphase' },
                { id: 'portfolio-usecases', title: 'Use Case Bewertung', description: 'Identifikation und Priorisierung von KI-Anwendungsfällen.', status: 'At Risk' as const, details: 'In Evaluierung' },
                { id: 'portfolio-roi', title: 'ROI & Wertbeitrag', description: 'Analyse des wirtschaftlichen Nutzens.', status: 'At Risk' as const, details: 'Noch nicht berechnet' },
                { id: 'portfolio-tech', title: 'Technologie & Infrastruktur', description: 'Bewertung der technischen Machbarkeit.', status: 'At Risk' as const, details: 'In Prüfung' },
            ];
            setPortfolioComplianceData(portfolioItems.map(item => ({
                ...item,
                checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
            })));
        }
    }, [setProjectName, setProjectData, setFullComplianceData, setIsoComplianceData, setPortfolioComplianceData]);

    // Helper: Load UseCase data from Register
    const loadUseCaseData = useCallback(async () => {
        setIsUseCaseLoading(true);
        try {
            // Load register metadata
            const reg = await registerService.getFirstRegister();
            setCurrentRegister(reg);

            const useCases = await registerService.listUseCases();
            setAllUseCases(useCases);
            setUseCaseCount(useCases.length);

            // Count pending reviews: UNREVIEWED or REVIEW_RECOMMENDED
            const pending = useCases.filter(
                (uc) => uc.status === "UNREVIEWED" || uc.status === "REVIEW_RECOMMENDED"
            ).length;
            setPendingReviewCount(pending);

            // Determine last entry (most recently updated)
            if (useCases.length > 0) {
                // Sort by updatedAt desc (assuming updatedAt is ISO string or timestamp)
                const sorted = [...useCases].sort((a, b) => {
                    const dateA = new Date(a.updatedAt || 0).getTime();
                    const dateB = new Date(b.updatedAt || 0).getTime();
                    return dateB - dateA;
                });
                const latest = sorted[0];
                const displayName = latest.toolFreeText || latest.toolId || latest.purpose || 'Unbenannt';
                setLastEntry({
                    name: displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName,
                    date: new Date(latest.updatedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    })
                });
            } else {
                setLastEntry(null);
            }
        } catch {
            // No register exists yet or other error – default to 0
            setAllUseCases([]);
            setCurrentRegister(null);
            setUseCaseCount(0);
            setPendingReviewCount(0);
            setLastEntry(null);
        } finally {
            setIsUseCaseLoading(false);
        }
    }, []);


    // Auto-Save Effect
    const updateChecklistStateInDb = useCallback(async () => {
        if (!user || isGlobalLoading || !fullComplianceData || !isoComplianceData || !portfolioComplianceData) return;
        const allData = [...fullComplianceData, ...isoComplianceData, ...portfolioComplianceData];
        const checklistStateToSave = allData.reduce((acc, item) => {
            if (item.checklistState && (item.checklistState.data || Object.keys(item.checklistState.checkedTasks).length > 0)) {
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
    }, [user, isGlobalLoading, fullComplianceData, isoComplianceData, portfolioComplianceData]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateChecklistStateInDb();
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [fullComplianceData, isoComplianceData, portfolioComplianceData, updateChecklistStateInDb]);


    // Render
    if (authLoading || isGlobalLoading) {
        return (
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    // Branch: Dashboard Overview (Loading data for dashboard)
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
                            useCaseCount={useCaseCount}
                            pendingReviewCount={pendingReviewCount}
                            lastEntry={lastEntry}
                            onUseCaseCaptured={loadUseCaseData}
                            register={currentRegister}
                            allUseCases={allUseCases}
                            isUseCaseLoading={isUseCaseLoading}
                            onRefreshUseCases={loadUseCaseData}
                        />
                    </main>
                </div>
            );
        }

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
                    trustPortalConfig={projectData?.trustPortal}
                    onTrustPortalUpdate={(newConfig) => setProjectData((prev: any) => ({ ...prev, trustPortal: newConfig }))}
                    useCaseCount={useCaseCount}
                    pendingReviewCount={pendingReviewCount}
                    lastEntry={lastEntry}
                    onUseCaseCaptured={loadUseCaseData}
                    register={currentRegister}
                    allUseCases={allUseCases}
                    isUseCaseLoading={isUseCaseLoading}
                    onRefreshUseCases={loadUseCaseData}
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
