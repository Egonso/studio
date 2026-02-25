"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText, GanttChartSquare, Sparkles, Building, Shield, Check, X, FileClock, History, LineChart, Gauge, Briefcase, Edit } from "lucide-react";
import type { ComplianceItem } from "@/lib/types";
import { DashboardGuidanceFrame } from "./dashboard-guidance-frame";
import { getComplianceChecklist, type GetComplianceChecklistOutput } from "@/ai/flows/get-compliance-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCurrentTask, type AimsProgress } from "@/lib/data-service";
import { AimsExportDialog } from "./aims-export-dialog";
import { PortfolioExportDialog } from "./portfolio-export-dialog";
import { RegisterTile } from "./dashboard/register-tile";
import { QuickCaptureModal } from "./register/quick-capture-modal";
import { LensCard } from "./dashboard/lens-card";
import { UserCertificationStatus } from "./dashboard/user-certification-status";
import { TrustPortalTile } from "./dashboard/trust-portal-tile";
import type { UserStatus } from "@/hooks/use-user-status";
import type { TrustPortalConfig } from "@/lib/types";

export interface ChecklistState {
    loading: boolean;
    error: string | null;
    data: GetComplianceChecklistOutput | null;
    checkedTasks: Record<string, boolean>;
}

export interface FullComplianceInfo extends ComplianceItem {
    checklistState: ChecklistState;
}

interface DashboardProps {
    projectName: string;
    complianceData: FullComplianceInfo[];
    setComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
    isoComplianceData: FullComplianceInfo[];
    setIsoComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
    portfolioComplianceData: FullComplianceInfo[];
    setPortfolioComplianceData: React.Dispatch<React.SetStateAction<FullComplianceInfo[] | null>>;
    aimsData: any;
    aimsProgress: AimsProgress;
    wizardStatus: 'not_started' | 'in_progress' | 'completed';
    policiesGenerated?: boolean;
    hasProjects?: boolean;
    userStatus?: UserStatus | null;
    userStatusLoading?: boolean;
    trustPortalConfig?: TrustPortalConfig;
    onTrustPortalUpdate?: (config: TrustPortalConfig) => void;
    // Register-First data
    useCases?: import('@/lib/register-first/types').UseCaseCard[];
    useCaseCount?: number;
    pendingReviewCount?: number;
    onUseCaseCaptured?: () => void;
    /** Current user UID – forwarded to TrustPortalTile for live aggregation */
    ownerId?: string;
    metrics?: import('@/lib/register-first/types').RegisterMetrics;
    register?: import('@/lib/register-first/types').Register | null;
}

import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";

const statusConfig = {
    'Compliant': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-200', badgeVariant: 'default' as const, iconClassName: 'text-green-500' },
    'At Risk': { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-200', badgeVariant: 'warning' as const, iconClassName: 'text-yellow-500' },
    'Non-Compliant': { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-200', badgeVariant: 'destructive' as const, iconClassName: 'text-red-500' },
    'Not Started': { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200', badgeVariant: 'secondary' as const, iconClassName: 'text-slate-400' },
    'In Progress': { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-200', badgeVariant: 'secondary' as const, iconClassName: 'text-blue-500 animate-spin-slow' },
};

export function Dashboard({
    projectName,
    complianceData,
    setComplianceData,
    isoComplianceData,
    setIsoComplianceData,
    portfolioComplianceData,
    setPortfolioComplianceData,
    aimsData,
    aimsProgress,
    wizardStatus,
    policiesGenerated,
    hasProjects,
    userStatus,
    userStatusLoading = false,
    trustPortalConfig,
    onTrustPortalUpdate,
    useCases,
    useCaseCount = 0,
    pendingReviewCount = 0,
    onUseCaseCaptured,
    ownerId,
    metrics,
    register = null,
}: DashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [detailsView, setDetailsView] = useState<'none' | 'ai-act' | 'iso-42001' | 'portfolio'>('none');
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

    // AI Act: Wizard has real data?
    const wizardHasData = wizardStatus === 'completed' || wizardStatus === 'in_progress';

    // --- COMPLIANCE CALCULATIONS ---
    const finalComplianceItems = complianceData || [];
    const compliantCount = finalComplianceItems.filter(i => i.status === 'Compliant').length;
    const atRiskCount = finalComplianceItems.filter(i => i.status === 'At Risk').length;
    const nonCompliantCount = finalComplianceItems.filter(i => i.status === 'Non-Compliant').length;
    const criticalAlerts = finalComplianceItems.filter(i => i.status === 'Non-Compliant');

    const completedSteps = aimsProgress
        ? Object.values(aimsProgress).filter(v => v === true).length
        : 0;

    const auditability = (() => {
        if (completedSteps === 6) return { label: 'Audit-Bereit', color: 'bg-green-500' };
        if (completedSteps >= 3) return { label: 'In Vorbereitung', color: 'bg-yellow-500' };
        return { label: 'Nicht gestartet', color: 'bg-red-500' };
    })();

    const isoWizardCompleted = completedSteps === 6;

    // --- REGISTER-FIRST ANALYTICS LENSES ---
    const analytics = useDashboardAnalytics(useCases || [], register);

    // --- HANDLERS ---
    const handleAccordionChange = async (item: FullComplianceInfo, type: 'ai-act' | 'iso-42001' | 'portfolio' = 'ai-act') => {
        // Only fetch if no data yet and not loading
        if (item.checklistState.data || item.checklistState.loading) return;

        const updateState = (id: string, newState: Partial<ChecklistState>) => {
            if (type === 'ai-act') {
                setComplianceData(prev => prev ? prev.map(p => p.id === id ? { ...p, checklistState: { ...p.checklistState, ...newState } } : p) : null);
            } else if (type === 'iso-42001') {
                setIsoComplianceData(prev => prev ? prev.map(p => p.id === id ? { ...p, checklistState: { ...p.checklistState, ...newState } } : p) : null);
            } else {
                setPortfolioComplianceData(prev => prev ? prev.map(p => p.id === id ? { ...p, checklistState: { ...p.checklistState, ...newState } } : p) : null);
            }
        };

        updateState(item.id, { loading: true, error: null });

        try {
            const result = await getComplianceChecklist({
                topic: item.title,
                currentStatus: item.status,
                details: item.details,
                pillar: type
            });
            updateState(item.id, { loading: false, data: result });
        } catch (err) {
            console.error("Failed to generate checklist:", err);
            updateState(item.id, { loading: false, error: "Konnte Checkliste nicht laden." });
        }
    };

    const handleTaskClick = async (task: any, item: FullComplianceInfo, type: 'ai-act' | 'iso-42001' | 'portfolio' = 'ai-act') => {
        const toggleTask = (prevChecked: Record<string, boolean>) => {
            const next = { ...prevChecked, [task.id]: !prevChecked[task.id] };
            return next;
        };

        let newCheckedTasks = {};

        if (type === 'ai-act') {
            setComplianceData(prev => {
                if (!prev) return null;
                return prev.map(p => {
                    if (p.id === item.id) {
                        newCheckedTasks = toggleTask(p.checklistState.checkedTasks);
                        return { ...p, checklistState: { ...p.checklistState, checkedTasks: newCheckedTasks } };
                    }
                    return p;
                });
            });
        } else if (type === 'iso-42001') {
            setIsoComplianceData(prev => prev ? prev.map(p => p.id === item.id ? { ...p, checklistState: { ...p.checklistState, checkedTasks: toggleTask(p.checklistState.checkedTasks) } } : p) : null);
        } else {
            setPortfolioComplianceData(prev => prev ? prev.map(p => p.id === item.id ? { ...p, checklistState: { ...p.checklistState, checkedTasks: toggleTask(p.checklistState.checkedTasks) } } : p) : null);
        }

        // Optimistic UI update done, now logic for side effects (like recalculating status) could go here
        // For now, we rely on the useEffect in page.tsx to save the state
    };


    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* 0. REGISTER SECTION (Paket A - Moved to Top) */}
                <section>
                    <RegisterTile
                        projectId={searchParams.get('projectId') || ''}
                        useCaseCount={useCaseCount}
                        pendingReviewCount={pendingReviewCount}
                        onCaptureClick={() => setIsQuickCaptureOpen(true)}
                    />
                    <QuickCaptureModal
                        open={isQuickCaptureOpen}
                        onOpenChange={setIsQuickCaptureOpen}
                        onCaptured={() => {
                            setIsQuickCaptureOpen(false);
                            onUseCaseCaptured?.();
                        }}
                    />
                </section>



                {/* 2. THREE LENSES SECTION (Operational Risk Analytics) */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Governance-Status</h2>
                    <p className="text-muted-foreground">Übersicht über Dokumentationsstand und offene Maßnahmen.</p>

                    <div className="grid md:grid-cols-3 gap-6 pt-4">
                        {/* A) Metric 1: System ohne Prüfhistorie */}
                        <LensCard
                            title={analytics.metric1.title}
                            description={analytics.metric1.description}
                            primaryLabel={analytics.metric1.primaryAction}
                            primaryVariant={analytics.metric1.count > 0 ? "outline" : "default"}
                            onPrimary={() => {
                                if (analytics.metric1.filterKey) {
                                    router.push(`/my-register?filter=${analytics.metric1.filterKey}`);
                                } else {
                                    router.push(`/my-register`);
                                }
                            }}
                            icon={ListChecks}
                            progressPercent={analytics.totalUseCases > 0 ? Math.round(((analytics.totalUseCases - analytics.metric1.count) / analytics.totalUseCases) * 100) : 100}
                            footerText={`${analytics.metric1.count} Lücken`}
                        />

                        {/* B) Metric 2: Hochrisiko ohne Prüfhistorie */}
                        <LensCard
                            title={analytics.metric2.title}
                            description={analytics.metric2.description}
                            primaryLabel={analytics.metric2.primaryAction}
                            primaryVariant={analytics.metric2.count > 0 ? "outline" : "default"}
                            onPrimary={() => {
                                if (analytics.metric2.filterKey) {
                                    router.push(`/my-register?filter=${analytics.metric2.filterKey}`);
                                } else {
                                    router.push(`/my-register`);
                                }
                            }}
                            icon={AlertTriangle}
                            progressPercent={analytics.totalUseCases > 0 ? Math.round(((analytics.totalUseCases - analytics.metric2.count) / analytics.totalUseCases) * 100) : 100}
                            footerText={`${analytics.metric2.count} kritische Lücken`}
                        />

                        {/* C) Metric 3: Externe Systeme ohne Beweis-Dossier */}
                        <LensCard
                            title={analytics.metric3.title}
                            description={analytics.metric3.description}
                            primaryLabel={analytics.metric3.primaryAction}
                            primaryVariant={analytics.metric3.count > 0 ? "outline" : "default"}
                            onPrimary={() => {
                                if (analytics.metric3.filterKey) {
                                    router.push(`/my-register?filter=${analytics.metric3.filterKey}`);
                                } else {
                                    router.push(`/my-register`);
                                }
                            }}
                            icon={ShieldAlert}
                            progressPercent={analytics.totalUseCases > 0 ? Math.round(((analytics.totalUseCases - analytics.metric3.count) / analytics.totalUseCases) * 100) : 100}
                            footerText={`${analytics.metric3.count} Transparenz-Lücken`}
                        />
                    </div>
                </section>

                <p className="text-center text-xs text-muted-foreground mt-4 mb-12">
                    <Shield className="w-3 h-3 inline mr-1 opacity-50" /> Echtzeit-Analyse basierend auf {analytics.totalUseCases} registrierten Systemen
                </p>

                {/* 4. DETAILS SECTION (Legacy Accordions - Removed per architectural decision) */}
                {/* Accordions intentionally destroyed to prevent separate Checklists */}
            </div>
        </div>
    );
}
