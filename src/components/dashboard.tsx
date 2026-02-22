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
    lastEntry?: { name: string; date: string; } | null;
    onUseCaseCaptured?: () => void;
    /** Current user UID – forwarded to TrustPortalTile for live aggregation */
    ownerId?: string;
    metrics?: import('@/lib/register-first/types').RegisterMetrics;
}

import { DiagnosticBoard } from './diagnostic-board';
import { EngineContext } from '@/lib/compliance-engine/types';
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
    lastEntry,
    onUseCaseCaptured,
    ownerId,
    metrics,
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
    const analytics = useDashboardAnalytics(useCases || [], {
        companyProfile: {
            infrastructure: {
                aiPolicyUrl: '',
                incidentProcessUrl: '',
                raciDocUrl: '',
            }
        }
    } as any); // Type cast for now, org settings will be injected properly later

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
                        lastEntry={lastEntry}
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

                {/* 1. DIAGNOSTIC BOARD (Engine) */}
                <section>
                    {hasProjects === false ? (
                        <DiagnosticBoard
                            workspaceId={searchParams.get('projectId') || ''}
                            organizationName={projectName || 'Neue Organisation'}
                            context={{
                                useCases: useCases || [],
                                orgStatus: {
                                    hasPolicy: false,
                                    hasIncidentProcess: false,
                                    hasRaciDefined: false,
                                    trustPortalActive: false
                                }
                            }}
                        />
                    ) : (
                        <DiagnosticBoard
                            workspaceId={searchParams.get('projectId') || ''}
                            organizationName={projectName || 'Organisation'}
                            context={{
                                useCases: useCases || [],
                                orgStatus: {
                                    hasPolicy: policiesGenerated || !!(aimsData?.policy && aimsData.policy.length >= 20),
                                    hasIncidentProcess: false, // Could be derived from aims progress
                                    hasRaciDefined: !!(aimsData?.raci && aimsData.raci.length > 0),
                                    trustPortalActive: !!(trustPortalConfig && trustPortalConfig.isPublished)
                                }
                            }}
                        />
                    )}
                </section>

                <section>
                    <TrustPortalTile
                        projectId={searchParams.get('projectId') || ''}
                        projectName={projectName}
                        config={trustPortalConfig}
                        onConfigUpdate={(c: TrustPortalConfig) => onTrustPortalUpdate && onTrustPortalUpdate(c)}
                        ownerId={ownerId}
                    />
                </section>

                {/* 1.5 USER CERTIFICATION STATUS */}
                <section>
                    <UserCertificationStatus status={userStatus || null} loading={userStatusLoading} />
                </section>

                {/* 1.6 REGISTER SECTION (Moved to top) */}
                {/* Removed from here */}

                {/* 2. OVERVIEW SECTION */}
                <section className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gesamtübersicht & Compliance-Status</h2>
                        <p className="text-muted-foreground">Zusammenfassung der drei Säulen: AI Act, ISO 42001 und Portfolio-Strategie.</p>
                    </div>

                    {/* Paket B: AI Act Empty State – nur UI-Conditional */}
                    {(!wizardHasData && (!metrics || metrics.activeUseCases === 0)) ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {/* AI Act: Nicht gestartet */}
                            <Card className="shadow-sm border-slate-200 md:col-span-3">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">AI Act Bewertung</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-2xl font-bold text-slate-400">Nicht gestartet</div>
                                    <p className="text-xs text-muted-foreground">
                                        Bitte starten Sie die AI-Act-Basisprüfung oder erfassen Sie zuerst einen Use Case im Register.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* ISO Quick Status */}
                            <Card className="shadow-sm border-slate-200 bg-slate-50 dark:bg-slate-900">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">ISO Auditfähigkeit</CardTitle>
                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", auditability.color)} />
                                        {auditability.label}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Fortschritt: {completedSteps}/6 Schritte</p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {/* KPI Cards – nur wenn Wizard-Daten vorhanden */}
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Transparenz / Minimal</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics ? metrics.riskDistribution.limited + metrics.riskDistribution.minimal : compliantCount}</div>
                                    <p className="text-xs text-muted-foreground">Low Risk Use Cases</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Hochrisiko Systeme</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics?.riskDistribution.high || 0}</div>
                                    <p className="text-xs text-muted-foreground">Erfordern strengere Kontrollen</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Unvollständige Assessments</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics?.actionItemsCount || 0}</div>
                                    <p className="text-xs text-muted-foreground">Fehlende Core-Bewertungen</p>
                                </CardContent>
                            </Card>

                            {/* ISO Quick Status */}
                            <Card className="shadow-sm border-slate-200 bg-slate-50 dark:bg-slate-900">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">ISO Auditfähigkeit</CardTitle>
                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", auditability.color)} />
                                        {auditability.label}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Fortschritt: {completedSteps}/6 Schritte</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {(metrics?.actionItemsCount || 0) > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Kritische Warnungen!</AlertTitle>
                            <AlertDescription>
                                Sie haben {metrics?.actionItemsCount} Use Cases mit unvollständigem Assessment oder Hochrisiko-Einstufungen ohne menschliche Aufsicht. Gehen Sie in Ihr <b>EUKI Register</b>, um die Lücken zu schließen.
                                {(metrics?.riskDistribution.prohibited || 0) > 0 && " Eines Ihrer Systeme wurde als verboten (Prohibited) eingestuft. Dies erfordert sofortiges Handeln."}
                            </AlertDescription>
                        </Alert>
                    )}
                </section>

                {/* 3. THREE LENSES SECTION (Register-First Analytics) */}
                <section className="grid md:grid-cols-3 gap-6">
                    {/* A) AI Act Analyse Lens */}
                    <LensCard
                        title="AI Act Analyse"
                        description="Legislative AI Act Klassifizierung & gesetzliche Pflichten."
                        primaryLabel={analytics.aiAct.primaryAction}
                        primaryVariant={analytics.aiAct.criticalCount > 0 ? "destructive" : "default"}
                        onPrimary={() => {
                            if (analytics.aiAct.filterKey) {
                                router.push(`/my-register?filter=${analytics.aiAct.filterKey}`);
                            } else {
                                router.push(`/audit-report?projectId=${searchParams.get('projectId') || ''}&type=ai-act`);
                            }
                        }}
                        icon={ListChecks}
                        progressPercent={analytics.aiAct.coveragePercent}
                        footerText="AI Act Abdeckung"
                    />

                    {/* B) ISO-Struktur-Analyse Lens */}
                    <LensCard
                        title="ISO-Struktur-Analyse"
                        description="ISO 42001 Strukturqualität & Management-System."
                        primaryLabel={analytics.iso.primaryAction}
                        primaryVariant={(!analytics.iso.macroFlags.aiPolicyExists || !analytics.iso.macroFlags.raciExists) ? "destructive" : "default"}
                        onPrimary={() => {
                            if (analytics.iso.targetDestination === 'settings:governance') {
                                router.push('/my-register?openSettings=true');
                            } else if (analytics.iso.targetDestination) {
                                router.push(`/my-register?filter=${analytics.iso.targetDestination}`);
                            } else {
                                router.push(`/my-register`);
                            }
                        }}
                        icon={Building}
                        progressPercent={analytics.iso.macroFlags.aiPolicyExists && analytics.iso.macroFlags.raciExists ? 100 : 33}
                        footerText="ISO 42001 Makro-Reife"
                    />

                    {/* C) Portfolio-Analyse Lens */}
                    <LensCard
                        title="Portfolio-Analyse"
                        description="Strategische Auswertung nach Nutzen (Value) vs. Risiko."
                        primaryLabel={analytics.portfolio.primaryAction}
                        primaryVariant="default"
                        onPrimary={() => {
                            if (analytics.portfolio.filterKey) {
                                router.push(`/my-register?filter=${analytics.portfolio.filterKey}`);
                            } else {
                                router.push(`/my-register`);
                            }
                        }}
                        icon={Briefcase}
                        progressPercent={(analytics.portfolio.highValueHighRiskCount + analytics.portfolio.quickWinsCount) > 0 ? 100 : 0}
                        footerText="Strategische Signale"
                    />
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
