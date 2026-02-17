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
import { recalculateComplianceStatus } from "@/lib/compliance-logic";
import { UserCertificationStatus } from "./dashboard/user-certification-status";
import { TrustPortalTile } from "./dashboard/trust-portal-tile";
import { RegisterTile } from "./dashboard/register-tile";
import { QuickCaptureModal } from "./register/quick-capture-modal";
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
    useCaseCount?: number;
    pendingReviewCount?: number;
    onUseCaseCaptured?: () => void;
}

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
    useCaseCount = 0,
    pendingReviewCount = 0,
    onUseCaseCaptured,
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

                {/* 1. GUIDANCE SECTION */}
                <section>
                    <DashboardGuidanceFrame
                        projectId={searchParams.get('projectId') || ''}
                        wizardStatus={hasProjects === false ? 'no_projects' : wizardStatus}
                        projectName={projectName}
                        policiesGenerated={policiesGenerated || (aimsData?.policy && aimsData.policy.length >= 20)}
                        isoWizardStarted={completedSteps > 0}
                        isoWizardCompleted={isoWizardCompleted}
                    />
                </section>

                <section>
                    <TrustPortalTile
                        projectId={searchParams.get('projectId') || ''}
                        projectName={projectName}
                        config={trustPortalConfig}
                        onConfigUpdate={(c) => onTrustPortalUpdate && onTrustPortalUpdate(c)}
                        complianceData={{
                            compliantCount: compliantCount,
                            risksDocumented: aimsData?.risks && aimsData.risks.length > 0,
                            policiesExist: aimsData?.policy && aimsData.policy.length >= 20
                        }}
                        certificationStatus={
                            userStatus?.examPassed ? 'certified' :
                                (userStatus?.courseProgress && userStatus.courseProgress.length > 0) ? 'in_progress' :
                                    'none'
                        }
                    />
                </section>

                {/* 1.5 USER CERTIFICATION STATUS */}
                <section>
                    <UserCertificationStatus status={userStatus || null} loading={userStatusLoading} />
                </section>

                {/* 1.6 REGISTER SECTION (Paket A) */}
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

                {/* 2. OVERVIEW SECTION */}
                <section className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gesamtübersicht & Compliance-Status</h2>
                        <p className="text-muted-foreground">Zusammenfassung der drei Säulen: AI Act, ISO 42001 und Portfolio-Strategie.</p>
                    </div>

                    {/* Paket B: AI Act Empty State – nur UI-Conditional */}
                    {!wizardHasData ? (
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
                                    <CardTitle className="text-sm font-medium">Compliant (AI Act)</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{compliantCount}</div>
                                    <p className="text-xs text-muted-foreground">von {finalComplianceItems.length} Anforderungen</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">At Risk (AI Act)</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{atRiskCount}</div>
                                    <p className="text-xs text-muted-foreground">erfordern Aufmerksamkeit</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Non-Compliant (AI Act)</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{nonCompliantCount}</div>
                                    <p className="text-xs text-muted-foreground">kritische Probleme</p>
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

                    {criticalAlerts.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Kritische Warnungen!</AlertTitle>
                            <AlertDescription>
                                {criticalAlerts.length > 1 ? `Sie haben ${criticalAlerts.length} nicht konforme Punkte` : 'Sie haben einen nicht konformen Punkt'}, die sofortige Aufmerksamkeit erfordern.
                                {complianceData.find(item => item.details.includes("verbotene Praktiken")) && " Eines Ihrer Systeme scheint verbotene Praktiken nach Art. 5 anzuwenden. Dies erfordert sofortiges Handeln."}
                            </AlertDescription>
                        </Alert>
                    )}
                </section>

                {/* 3. THREE PILLARS SECTION */}
                <section className="grid md:grid-cols-3 gap-6">
                    <PillarCard
                        title="AI Act Pflichten"
                        description="Gesetzliche Anforderungen prüfen, dokumentieren und lückenlos erfüllen."
                        status={wizardStatus === 'completed' ? 'In Progress' : wizardStatus === 'not_started' ? 'Not Started' : 'In Progress'}
                        primaryLabel={wizardHasData ? "Prüfung fortsetzen" : "Prüfung starten"}
                        onPrimary={() => { setDetailsView('ai-act'); router.push('#details-section'); }}
                        onSecondary={() => setDetailsView('ai-act')}
                        icon={ListChecks}
                        exportAction={hasProjects && wizardStatus !== 'not_started' ? (
                            <Link href={`/audit-report?projectId=${searchParams.get('projectId') || ''}&type=ai-act`} passHref>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Audit-Dossier öffnen">
                                    <FileText className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                            </Link>
                        ) : undefined}
                    />
                    <PillarCard
                        title="KI Management (ISO)"
                        description="Strukturelle Prozesse, Policies und Governance nach ISO/IEC 42001 etablieren."
                        status={completedSteps > 0 ? 'In Progress' : 'Not Started'}
                        primaryLabel="Setup starten / anpassen"
                        onPrimary={() => router.push('/aims')}
                        onSecondary={() => setDetailsView('iso-42001')}
                        icon={Sparkles}
                        exportAction={hasProjects && completedSteps > 0 ? (
                            <AimsExportDialog trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Dokumentation exportieren">
                                    <GanttChartSquare className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                            } />
                        ) : undefined}
                    />
                    <PillarCard
                        title="KI-Portfolio Strategie"
                        description="Strategische Ausrichtung, Use-Case-Bewertung und ROI-Analyse."
                        status={portfolioComplianceData.length > 0 ? 'In Progress' : 'Not Started'}
                        primaryLabel="Strategie entwickeln"
                        onPrimary={() => router.push('/portfolio')}
                        onSecondary={() => setDetailsView('portfolio')}
                        icon={Briefcase}
                        exportAction={hasProjects && portfolioComplianceData.length > 0 ? (
                            <PortfolioExportDialog trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Strategie exportieren">
                                    <LineChart className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                            } />
                        ) : undefined}
                    />
                </section>

                {/* 4. DETAILS SECTION (Conditional/Accordion-like) */}
                {detailsView !== 'none' && (
                    <section className="animate-in fade-in slide-in-from-top-4 duration-300 scroll-mt-24" id="details-section">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {detailsView === 'ai-act' && <><ListChecks className="w-5 h-5" /> Detaillierte AI Act Pflichten</>}
                                {detailsView === 'iso-42001' && <><Sparkles className="w-5 h-5" /> ISO 42001 Anforderungen</>}
                                {detailsView === 'portfolio' && <><Briefcase className="w-5 h-5" /> Strategische Handlungsfelder</>}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setDetailsView('none')}>
                                <X className="mr-2 h-4 w-4" /> Schließen
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="pt-6">
                                {/* AI ACT DETAILS */}
                                {detailsView === 'ai-act' && (
                                    <Accordion type="single" collapsible className="w-full" onValueChange={(value) => { if (value) { const item = finalComplianceItems.find(i => i.id === value); if (item) { handleAccordionChange(item); } } }}>
                                        {(finalComplianceItems.length > 0 ? finalComplianceItems : [
                                            // Empty State Fallback
                                            { id: 'default-1', title: 'Verbotene Praktiken', description: 'Prüfen Sie, ob Ihr System verbotene KI-Praktiken einsetzt.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.', checklistState: { loading: false, error: null, data: null, checkedTasks: {} } },
                                            { id: 'default-2', title: 'Hochrisiko-Klassifizierung', description: 'Bestimmen Sie, ob Ihr System als Hochrisiko-KI gilt.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.', checklistState: { loading: false, error: null, data: null, checkedTasks: {} } },
                                            { id: 'default-3', title: 'Daten-Governance', description: 'Anforderungen an Trainings-, Validierungs- und Testdaten.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.', checklistState: { loading: false, error: null, data: null, checkedTasks: {} } },
                                        ]).map((item: any) => {
                                            const status = item.status as string;
                                            const config = (statusConfig as any)[status] || { icon: ArrowRight, badgeVariant: 'secondary', iconClassName: 'text-gray-400' };
                                            return (
                                                <AccordionItem value={item.id} key={item.id}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center gap-3 flex-1 text-left">
                                                            <config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        <Badge variant={config.badgeVariant} className="ml-4 shrink-0">{status}</Badge>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pl-10 space-y-4 text-sm">
                                                        <p className="text-muted-foreground font-semibold">{item.description}</p>
                                                        <p className="italic">Status-Begründung: {item.details}</p>

                                                        {/* Checklist Rendering (Only if real item) */}
                                                        {item.checklistState && (
                                                            <Card className="mt-4 bg-secondary/50">
                                                                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Checkliste</CardTitle></CardHeader>
                                                                <CardContent>
                                                                    {item.checklistState.loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Lade...</div>}
                                                                    {item.checklistState.data && (
                                                                        <div className="space-y-2">
                                                                            {item.checklistState.data.checklist.map((task: any) => (
                                                                                <div key={task.id} onClick={() => handleTaskClick(task, item)} className="flex items-center justify-between space-x-3 p-3 rounded-md border bg-background/50 hover:bg-background cursor-pointer transition-colors">
                                                                                    <div className="flex items-start gap-4">
                                                                                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                                                                                        <div className={cn("flex-1", item.checklistState.checkedTasks[task.id] && "line-through text-muted-foreground")}>
                                                                                            <StepContent content={task.description} />
                                                                                        </div>
                                                                                        {item.checklistState.checkedTasks[task.id] && <Check className="h-4 w-4 text-green-500" />}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs text-muted-foreground italic text-center">
                                                                        Hinweis: Für personalisierte Handlungsempfehlungen und Assistenten nutzen Sie bitte die Kacheln oben.
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                )}

                                {/* ISO DETAILS */}
                                {detailsView === 'iso-42001' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-muted-foreground">Verwalten Sie hier Ihre ISO 42001 Dokumentation.</p>
                                            <AimsExportDialog />
                                        </div>
                                        <Accordion type="single" collapsible className="w-full" onValueChange={(value) => { if (value) { const item = isoComplianceData.find(i => i.id === value); if (item) { handleAccordionChange(item, 'iso-42001'); } } }}>
                                            {isoComplianceData.map((item) => (
                                                <AccordionItem value={item.id} key={item.id}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center gap-3 flex-1 text-left">
                                                            <Sparkles className="h-5 w-5 text-primary shrink-0" />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        <Badge variant="outline" className="ml-4">{item.status}</Badge>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pl-10 space-y-4">
                                                        <p className="text-muted-foreground">{item.description}</p>
                                                        <p className="text-xs italic">{item.details}</p>
                                                        {item.checklistState?.data && (
                                                            <div className="mt-4 space-y-2 pl-4 border-l-2 border-primary/20">
                                                                {item.checklistState.data.checklist.map((task: any) => (
                                                                    <div key={task.id} className={cn("text-sm py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 rounded", item.checklistState.checkedTasks[task.id] && "line-through text-muted-foreground")} onClick={() => handleTaskClick(task, item, 'iso-42001')}>
                                                                        • {task.description}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between mt-2">
                                                            <Button size="sm" variant="outline" onClick={() => router.push('/aims')}>Im Wizard bearbeiten</Button>
                                                            <span className="text-[10px] text-muted-foreground italic">
                                                                Nutzen Sie die Kacheln für geführte Empfehlungen.
                                                            </span>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                )}

                                {/* PORTFOLIO DETAILS */}
                                {detailsView === 'portfolio' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-muted-foreground">Strategische Ausrichtung und Portfolio-Management.</p>
                                            <PortfolioExportDialog />
                                        </div>
                                        <Accordion type="single" collapsible className="w-full" onValueChange={(value) => { if (value) { const item = portfolioComplianceData.find(i => i.id === value); if (item) { handleAccordionChange(item, 'portfolio'); } } }}>
                                            {portfolioComplianceData.map((item) => (
                                                <AccordionItem value={item.id} key={item.id}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center gap-3 flex-1 text-left">
                                                            <Briefcase className="h-5 w-5 text-primary shrink-0" />
                                                            <span>{item.title}</span>
                                                        </div>
                                                        <Badge variant="outline" className="ml-4">{item.status}</Badge>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pl-10 space-y-4">
                                                        <p className="text-muted-foreground">{item.description}</p>
                                                        <Button size="sm" variant="outline" className="mt-2" onClick={() => router.push('/portfolio')}>Strategie bearbeiten</Button>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                )}
            </div>
        </div>
    );
}


function PillarCard({ title, description, status, primaryLabel, onPrimary, onSecondary, icon: Icon, exportAction }: { title: string, description: string, status: string, primaryLabel: string, onPrimary: () => void, onSecondary?: () => void, icon: any, exportAction?: React.ReactNode }) {
    return (
        <Card className="flex flex-col h-full shadow-md border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={status === 'Completed' || status === 'Compliant' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                </div>
                <CardTitle className="mt-4 text-xl">{title}</CardTitle>
                <CardDescription className="line-clamp-2">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {/* Spacer */}
            </CardContent>
            <div className="p-6 pt-0 mt-auto flex items-center justify-between gap-2">
                <Button onClick={onPrimary} className="flex-1 gap-2">
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                </Button>
                {onSecondary && (
                    <Button variant="outline" onClick={onSecondary} title="Details ansehen">
                        Details
                    </Button>
                )}
                {exportAction}
            </div>
        </Card>
    );
}

const StepContent = ({ content }: { content: string }) => {
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
                if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
                if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-sm">{part.slice(1, -1)}</code>;
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
