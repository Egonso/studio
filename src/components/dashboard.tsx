"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText, GanttChartSquare, Sparkles, Building, Shield, Check, X, FileClock, History, LineChart, Gauge, Briefcase, Edit } from "lucide-react";
import type { ComplianceItem } from "@/lib/types";
import { DashboardGuidanceFrame } from "./dashboard-guidance-frame";
import { getComplianceChecklist, type GetComplianceChecklistOutput, type GetComplianceChecklistOutput_Checklist } from "@/ai/flows/get-compliance-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCurrentTask, type AimsProgress } from "@/lib/data-service";
// Tabs removed
import { AimsExportDialog } from "./aims-export-dialog";
import { PortfolioExportDialog } from "./portfolio-export-dialog";
import { recalculateComplianceStatus } from "@/lib/compliance-logic";

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
}


const statusConfig = {
    'Compliant': {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        iconClassName: 'text-green-600',
    },
    'At Risk': {
        icon: AlertTriangle,
        badgeVariant: 'secondary' as const,
        iconClassName: 'text-yellow-600',
    },
    'Non-Compliant': {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        iconClassName: 'text-red-600',
    },
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
    hasProjects
}: DashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // State for separate details view (no longer tabs for main nav)
    const [detailsView, setDetailsView] = useState<'none' | 'ai-act' | 'iso-42001' | 'portfolio'>('none');

    // Auto-open AI Act details if "Details" was clicked in a previous session or if default
    // BUT user requested: structure first. So maybe default to none? 
    // "Drei Säulen Cards (Startpunkte) ... Detailbereiche darunter"
    // Let's keep detailsView state to toggle the bottom section.

    const finalComplianceItems = complianceData.map(item => ({ ...recalculateComplianceStatus(item, item.checklistState), checklistState: item.checklistState } as FullComplianceInfo));

    const compliantCount = finalComplianceItems.filter(item => item.status === "Compliant").length;
    const atRiskCount = finalComplianceItems.filter(item => item.status === "At Risk").length;
    const nonCompliantCount = finalComplianceItems.filter(item => item.status === "Non-Compliant").length;

    const criticalAlerts = finalComplianceItems.filter(item => item.status === "Non-Compliant");

    const completedSteps = aimsProgress ? Object.values(aimsProgress).filter(v => v === true).length : 0;
    const risksDocumented = aimsData?.risks && aimsData.risks.length > 0 && aimsData.risks.some((r: any) => r.description);
    const policiesExist = aimsData?.policy && aimsData.policy.length >= 20;
    const rolesExist = aimsData?.raci && aimsData.raci.length > 0 && aimsData.raci.some((r: any) => r.task);

    const getAuditability = () => {
        if (completedSteps === 6 && risksDocumented && policiesExist && rolesExist) return { label: 'Grün', color: 'bg-green-500' };
        if (completedSteps >= 3 && (risksDocumented || policiesExist)) return { label: 'Gelb', color: 'bg-yellow-500' };
        return { label: 'Rot', color: 'bg-red-500' };
    };
    const auditability = getAuditability();

    const handleAccordionChange = async (item: FullComplianceInfo, pillar: 'ai-act' | 'iso-42001' | 'portfolio' = 'ai-act') => {
        if (item.checklistState.data || item.checklistState.loading) return;

        const setter = pillar === 'ai-act' ? setComplianceData : pillar === 'iso-42001' ? setIsoComplianceData : setPortfolioComplianceData;

        // Use type assertion or check if setter is available to avoid errors if passed null
        if (!setter) return;

        setter((prev: FullComplianceInfo[] | null) => prev ? prev.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: true, error: null } } : d) : null);

        try {
            const result = await getComplianceChecklist({
                topic: item.title,
                currentStatus: item.status,
                details: item.details,
                pillar: pillar
            });
            let initialCheckedTasks: Record<string, boolean> = item.checklistState.checkedTasks || {};
            if (item.status === 'Compliant') {
                initialCheckedTasks = result.checklist.reduce((acc, task) => ({ ...acc, [task.id]: true }), {});
            }
            setter((prev: FullComplianceInfo[] | null) => prev ? prev.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: false, data: result, checkedTasks: initialCheckedTasks } } : d) : null);
        } catch (e) {
            console.error(e);
            setter((prev: FullComplianceInfo[] | null) => prev ? prev.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: false, error: "Failed to generate checklist." } } : d) : null);
        }
    };

    const handleTaskClick = async (task: GetComplianceChecklistOutput_Checklist, complianceItem: FullComplianceInfo, pillar: 'ai-act' | 'iso-42001' | 'portfolio' = 'ai-act') => {
        if (complianceItem.status === 'Compliant') return;

        await saveCurrentTask({
            ...task,
            complianceItemId: complianceItem.id,
            complianceItemTitle: complianceItem.title,
            pillar: pillar
        });

        router.push(`/task/${task.id}`);
    };

    const PillarCard = ({
        title,
        description,
        status,
        onPrimary,
        onSecondary,
        primaryLabel,
        icon: Icon,
        exportAction
    }: {
        title: string,
        description: string,
        status: 'Not Started' | 'In Progress' | 'Done',
        onPrimary: () => void,
        onSecondary: () => void,
        primaryLabel: string,
        icon: any,
        exportAction?: React.ReactNode
    }) => (
        <Card className="flex flex-col h-full transition-all duration-500 border border-transparent bg-slate-100/50 dark:bg-slate-900/50 opacity-80 hover:opacity-100 hover:bg-card hover:shadow-xl hover:scale-[1.01] hover:border-border group">
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <Badge variant={status === 'Done' ? 'default' : status === 'In Progress' ? 'secondary' : 'outline'} className="opacity-70 group-hover:opacity-100 transition-opacity">
                        {status}
                    </Badge>
                </div>
                <CardTitle className="text-xl text-foreground/80 group-hover:text-foreground transition-colors">{title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2 group-hover:text-muted-foreground/80 transition-colors">{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-3 pt-4">
                <Button onClick={onPrimary} className="w-full opacity-0 group-hover:opacity-100 bg-primary/90 hover:bg-primary transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-sm h-9">
                    {primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex gap-2 justify-between items-center opacity-60 group-hover:opacity-100 transition-all duration-300">
                    <Button variant="ghost" size="sm" onClick={onSecondary} className="h-8 text-xs font-normal text-muted-foreground hover:text-foreground">
                        Details
                    </Button>
                    {exportAction && (
                        <div className="scale-95 hover:scale-100 transition-transform">
                            {exportAction}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* 1. GUIDANCE SECTION */}
                <section>
                    <DashboardGuidanceFrame
                        projectId={new URLSearchParams(window.location.search).get('projectId') || ''}
                        wizardStatus={hasProjects === false ? 'no_projects' : wizardStatus}
                        projectName={projectName}
                        policiesGenerated={policiesGenerated || (aimsData?.policy && aimsData.policy.length >= 20)}
                    />
                </section>

                {/* 2. OVERVIEW SECTION */}
                <section className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gesamtübersicht & Compliance-Status</h2>
                        <p className="text-muted-foreground">Zusammenfassung der drei Säulen: AI Act, ISO 42001 und Portfolio-Strategie.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* KPI Cards */}
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
                        primaryLabel={wizardStatus === 'completed' ? "Prüfung fortsetzen" : "Wizard starten"}
                        onPrimary={() => { setDetailsView('ai-act'); /* Optionally scroll to details */ }}
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
                    <section className="animate-in fade-in slide-in-from-top-4 duration-300 scroll-mt-8" id="details-section">
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
                                            { id: 'default-1', title: 'Verbotene Praktiken', description: 'Prüfen Sie, ob Ihr System verbotene KI-Praktiken einsetzt.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.' },
                                            { id: 'default-2', title: 'Hochrisiko-Klassifizierung', description: 'Bestimmen Sie, ob Ihr System als Hochrisiko-KI gilt.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.' },
                                            { id: 'default-3', title: 'Daten-Governance', description: 'Anforderungen an Trainings-, Validierungs- und Testdaten.', status: 'Not Started', details: 'Lege ein Projekt an, um Anforderungen zu laden.' },
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
                                                                                        <p className="flex-1"><StepContent content={task.description} /></p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
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
                                                                    <div key={task.id} className="text-sm py-1" onClick={() => handleTaskClick(task, item, 'iso-42001')}>
                                                                        • {task.description}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <Button size="sm" variant="outline" className="mt-2" onClick={() => router.push('/aims')}>Im Wizard bearbeiten</Button>
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
