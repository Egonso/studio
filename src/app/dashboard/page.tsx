
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
    const [isoComplianceData, setIsoComplianceData] = useState<FullComplianceInfo[] | null>(null);
    const [portfolioComplianceData, setPortfolioComplianceData] = useState<FullComplianceInfo[] | null>(null);
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

            const savedChecklistState = fullProjectData.checklistState || {};

            // 1. AI Act Pillar
            const derivedData = deriveComplianceState(answers);
            const enrichedData: FullComplianceInfo[] = derivedData.map(item => ({
                ...item,
                checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
            }));
            setFullComplianceData(enrichedData);

            setFullComplianceData(enrichedData);

            // 2. ISO Pillar (Uses aimsData logic but also needs checklistState)
            // Note: Dashboard component has its own 'getIsoCategories' helper, but we need to mirror it here for state initialization
            const getInitialIso = () => {
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
                return aimsItems.map(item => ({
                    ...item,
                    checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
                }));
            };
            setIsoComplianceData(getInitialIso());

            // 3. Portfolio Pillar
            const getInitialPortfolio = () => {
                const portfolioItems = [
                    { id: 'portfolio-strategy', title: 'Strategie & Vision', description: 'Definition der langfristigen KI-Ziele und Ausrichtung.', status: 'At Risk' as const, details: 'Initialphase' },
                    { id: 'portfolio-usecases', title: 'Use Case Bewertung', description: 'Identifikation und Priorisierung von KI-Anwendungsfällen.', status: 'At Risk' as const, details: 'In Evaluierung' },
                    { id: 'portfolio-roi', title: 'ROI & Wertbeitrag', description: 'Analyse des wirtschaftlichen Nutzens.', status: 'At Risk' as const, details: 'Noch nicht berechnet' },
                    { id: 'portfolio-tech', title: 'Technologie & Infrastruktur', description: 'Bewertung der technischen Machbarkeit.', status: 'At Risk' as const, details: 'In Prüfung' },
                ];
                return portfolioItems.map(item => ({
                    ...item,
                    checklistState: savedChecklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} }
                }));
            };
            setPortfolioComplianceData(getInitialPortfolio());

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


    const updateChecklistStateInDb = useCallback(async () => {
        if (!user || isLoading || !fullComplianceData || !isoComplianceData || !portfolioComplianceData) return;

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
    }, [user, isLoading, fullComplianceData, isoComplianceData, portfolioComplianceData]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateChecklistStateInDb();
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [fullComplianceData, isoComplianceData, portfolioComplianceData, updateChecklistStateInDb]);


    if (isLoading || !fullComplianceData || !isoComplianceData || !portfolioComplianceData || authLoading) {
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
