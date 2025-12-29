
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText, BookOpen, GanttChartSquare, Sparkles, Wand2, GraduationCap, Building, Shield, Check, X, FileClock, History, LineChart, Gauge } from "lucide-react";
import type { ComplianceItem } from "@/lib/types";
import { getComplianceChecklist, type GetComplianceChecklistOutput, type GetComplianceChecklistOutput_Checklist } from "@/ai/flows/get-compliance-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCurrentTask, type AimsProgress, getActiveProjectId, getFullProject, setActiveProjectId } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AimsExportDialog } from "@/components/aims-export-dialog";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/app-header";
import { deriveComplianceState } from "@/lib/compliance-logic";

export interface ChecklistState {
    [itemId: string]: {
        loading: boolean;
        error: string | null;
        data: GetComplianceChecklistOutput | null;
        checkedTasks: Record<string, boolean>;
    }
}

interface DashboardProps {
    projectName: string;
    complianceItems: ComplianceItem[];
    checklistState: ChecklistState;
    setChecklistState: React.Dispatch<React.SetStateAction<ChecklistState>>;
    aimsData: any;
    aimsProgress: AimsProgress;
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

const isoCategories: ComplianceItem[] = [
    { id: 'iso-context', title: 'Kontext & Stakeholder', description: 'Verstehen der Organisation und der Bedürfnisse der Stakeholder.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-leadership', title: 'Leadership & AI Policy', description: 'Festlegung von KI-Richtlinien und Verantwortlichkeiten.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-planning', title: 'Planung & Risikoanalyse', description: 'Planung von Maßnahmen zum Umgang mit Risiken und Chancen.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-operation', title: 'Operation / AI Lifecycle', description: 'Steuerung des KI-System-Lebenszyklus.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-monitoring', title: 'Monitoring, KPIs & Performance', description: 'Überwachung, Messung, Analyse und Bewertung der Leistung.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-improvement', title: 'Improvement / Korrekturmaßnahmen', description: 'Kontinuierliche Verbesserung des KI-Managementsystems.', status: 'At Risk', details: 'Noch nicht bewertet.' },
];


function AiManagementInternalView({ projectName, complianceItems, checklistState, setChecklistState, aimsData, aimsProgress }: DashboardProps) {
    const router = useRouter();
    // Default to ai-management tab since this is the AI Management page
    const [activeTab, setActiveTab] = useState("ai-management");


    const compliantCount = complianceItems.filter(
        (item) => item.status === "Compliant"
    ).length;
    const atRiskCount = complianceItems.filter(
        (item) => item.status === "At Risk"
    ).length;
    const nonCompliantCount = complianceItems.filter(
        (item) => item.status === "Non-Compliant"
    ).length;

    const criticalAlerts = complianceItems.filter(
        (item) => item.status === "Non-Compliant"
    );

    // ISO Status Calculation
    const completedSteps = aimsProgress ? Object.values(aimsProgress).filter(v => v === true).length : 0;
    const risksDocumented = aimsData?.risks && aimsData.risks.length > 0 && aimsData.risks.some((r: any) => r.description);
    const policiesExist = aimsData?.policy && aimsData.policy.length >= 20;
    const rolesExist = aimsData?.raci && aimsData.raci.length > 0 && aimsData.raci.some((r: any) => r.task);

    const getAuditability = () => {
        if (completedSteps === 6 && risksDocumented && policiesExist && rolesExist) {
            return { label: 'Grün', color: 'bg-green-500' };
        }
        if (completedSteps >= 3 && (risksDocumented || policiesExist)) {
            return { label: 'Gelb', color: 'bg-yellow-500' };
        }
        return { label: 'Rot', color: 'bg-red-500' };
    };
    const auditability = getAuditability();


    const handleAccordionChange = async (itemId: string, item: ComplianceItem) => {
        // If data is already present, don't re-fetch
        if (checklistState[itemId]?.data) return;

        setChecklistState(prev => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || {}), loading: true, error: null, data: null, checkedTasks: prev[itemId]?.checkedTasks || {} }
        }));

        try {
            const result = await getComplianceChecklist({
                topic: item.title,
                currentStatus: item.status,
                details: item.details,
            });

            let initialCheckedTasks: Record<string, boolean> = checklistState[itemId]?.checkedTasks || {};
            if (item.status === 'Compliant') {
                initialCheckedTasks = result.checklist.reduce((acc, task) => {
                    acc[task.id] = true;
                    return acc;
                }, {} as Record<string, boolean>);
            }

            setChecklistState(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], loading: false, error: null, data: result, checkedTasks: initialCheckedTasks }
            }));
        } catch (e) {
            console.error(e);
            setChecklistState(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], loading: false, error: "Failed to generate checklist." }
            }));
        }
    };

    const handleTaskClick = async (task: GetComplianceChecklistOutput_Checklist, complianceItem: ComplianceItem) => {
        // Prevent navigation for compliant items
        if (complianceItem.status === 'Compliant') return;

        await saveCurrentTask({
            ...task,
            complianceItemId: complianceItem.id,
            complianceItemTitle: complianceItem.title,
        });
        router.push(`/task/${task.id}`);
    };

    const handleTabChange = (value: string) => {
        if (['cbs', 'kurs', 'exam'].includes(value)) {
            router.push(`/${value}`);
        } else {
            setActiveTab(value);
        }
    }


    return (
        <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="flex items-start justify-between space-y-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        AI Act Compass
                    </h1>
                    <p className="text-muted-foreground">
                        Projekt-Dashboard für: <span className="font-semibold">{projectName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-4 max-w-2xl">
                        Dieses Dashboard verbindet gesetzliche EU-KI-Compliance (AI Act) mit dem optionalen, international anerkannten Managementsystem ISO/IEC 42001.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/aims')}>
                        <Shield className="mr-2 h-4 w-4" />
                        KI Management System - Setup starten
                    </Button>
                    <Link href={`/audit-report?projectId=${complianceItems.length > 0 ? new URLSearchParams(window.location.search).get('projectId') : ''}`} passHref>
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Audit-Dossier erstellen
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                    <TabsTrigger value="compliance-status">
                        <GanttChartSquare className="mr-2 h-4 w-4" />
                        Compliance-Status
                    </TabsTrigger>
                    <TabsTrigger value="ai-act-duties">
                        <ListChecks className="mr-2 h-4 w-4" />
                        AI Act Pflichten
                    </TabsTrigger>
                    <TabsTrigger value="ai-management">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Management
                    </TabsTrigger>
                    <TabsTrigger value="cbs">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Compliance-in-a-Day
                    </TabsTrigger>
                    <TabsTrigger value="kurs">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Kurs
                    </TabsTrigger>
                    <TabsTrigger value="exam">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Zertifizierung
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="compliance-status" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Compliant (AI Act)</CardTitle>
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{compliantCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    von {complianceItems.length} Anforderungen
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">At Risk (AI Act)</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{atRiskCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    erfordern Aufmerksamkeit
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Non-Compliant (AI Act)</CardTitle>
                                <ShieldAlert className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{nonCompliantCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    kritische Probleme
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold tracking-tight mb-2">AI Management System Status</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            ISO 42001 ist ein KI-Managementsystem, das langfristige Compliance und Prozesssicherheit gewährleistet.
                        </p>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">AIMS implementiert</CardTitle>
                                    <FileClock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{completedSteps}/6</div>
                                    <p className="text-xs text-muted-foreground">Erfüllte Anforderungen</p>
                                </CardContent>
                            </Card>
                            <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Risiken dokumentiert</CardTitle>
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-2xl font-bold flex items-center gap-2", risksDocumented ? "text-green-600" : "text-muted-foreground")}>
                                        {risksDocumented ? <Check /> : <X />}
                                        {risksDocumented ? 'Ja' : 'Nein'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Risikobewertung nach ISO 42001</p>
                                </CardContent>
                            </Card>
                            <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Policies vorhanden</CardTitle>
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-2xl font-bold flex items-center gap-2", policiesExist ? "text-green-600" : "text-muted-foreground")}>
                                        {policiesExist ? <Check /> : <X />}
                                        {policiesExist ? 'Ja' : 'Nein'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Grundlegende Richtlinien vorhanden</p>
                                </CardContent>
                            </Card>
                            <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Auditfähigkeit</CardTitle>
                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        <div className={cn("w-4 h-4 rounded-full", auditability.color)} />
                                        {auditability.label}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Grad der ISO-Auditvorbereitung</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {criticalAlerts.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Kritische Warnungen!</AlertTitle>
                            <AlertDescription>
                                {criticalAlerts.length > 1 ? `Sie haben ${criticalAlerts.length} nicht konforme Punkte` : 'Sie haben einen nicht konformen Punkt'}, die sofortige Aufmerksamkeit erfordern.
                                {complianceItems.find(item => item.details.includes("verbotene Praktiken")) &&
                                    " Eines Ihrer Systeme scheint verbotene Praktiken nach Art. 5 anzuwenden. Dies erfordert sofortiges Handeln."}
                            </AlertDescription>
                        </Alert>
                    )}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Übersicht des Compliance-Status</CardTitle>
                            <CardDescription>
                                Das Managementsystem (ISO 42001) ergänzt die gesetzlichen Anforderungen (EU AI Act).
                                <br />Links: Was Sie tun müssen. Rechts: Wie Sie es dauerhaft sicherstellen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* EU AI Act Column */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2">EU AI Act Pflichten</h3>
                                <p className="text-sm text-muted-foreground mb-4">Gesetzliche KI-Anforderungen nach EU AI Act.</p>
                                <Accordion type="single" collapsible className="w-full">
                                    {complianceItems.map((item) => {
                                        const config = statusConfig[item.status];
                                        const Icon = config.icon;

                                        return (
                                            <AccordionItem value={item.id} key={item.id}>
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center gap-3 flex-1 text-left">
                                                        <Icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} />
                                                        <span>{item.title}</span>
                                                    </div>
                                                    <Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge>
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-10 space-y-4 text-sm">
                                                    <p className="text-muted-foreground font-semibold">{item.description}</p>
                                                    <p className="italic">Status-Begründung: {item.details}</p>
                                                    <Button variant="secondary" size="sm" onClick={() => setActiveTab("ai-act-duties")}>
                                                        Zur Detailansicht & Checkliste <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>

                            {/* ISO 42001 Column */}
                            <div className="border-l border-gray-200 pl-8">
                                <h3 className="font-semibold text-lg mb-2">ISO 42001 Managementsystem</h3>
                                <p className="text-sm text-muted-foreground mb-4">Strukturelle Prozesse & Governance nach ISO/IEC 42001.</p>
                                <Accordion type="single" collapsible className="w-full">
                                    {isoCategories.map((item) => {
                                        const config = statusConfig[item.status];
                                        const Icon = config.icon;

                                        return (
                                            <AccordionItem value={item.id} key={item.id} disabled>
                                                <AccordionTrigger className="hover:no-underline disabled:opacity-50">
                                                    <div className="flex items-center gap-3 flex-1 text-left">
                                                        <Icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} />
                                                        <span>{item.title}</span>
                                                    </div>
                                                    <Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge>
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-10 space-y-4 text-sm">
                                                    <p>Inhalt wird in Kürze verfügbar sein.</p>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai-act-duties">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detaillierte AI Act Pflichten</CardTitle>
                            <CardDescription>Hier finden Sie eine detaillierte Aufschlüsselung aller gesetzlichen Anforderungen des EU AI Acts und können den Umsetzungsstand verfolgen.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full" onValueChange={(value) => {
                                if (value) {
                                    const item = complianceItems.find(i => i.id === value);
                                    if (item) {
                                        handleAccordionChange(value, item);
                                    }
                                }
                            }}>
                                {complianceItems.map((item) => {
                                    const config = statusConfig[item.status];
                                    const Icon = config.icon;
                                    const state = checklistState[item.id];
                                    const isCompliant = item.status === 'Compliant';

                                    return (
                                        <AccordionItem value={item.id} key={item.id}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3 flex-1 text-left">
                                                    <Icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} />
                                                    <span>{item.title}</span>
                                                </div>
                                                <Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge>
                                            </AccordionTrigger>
                                            <AccordionContent className="pl-10 space-y-4 text-sm">
                                                <p className="text-muted-foreground font-semibold">{item.description}</p>
                                                <p className="italic">Status-Begründung: {item.details}</p>

                                                <Card className="mt-4 bg-secondary/50">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <ListChecks className="h-5 w-5 text-primary" />
                                                            {isCompliant ? "Erfüllte Kriterien" : "Umsetzbare Checkliste"}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {state?.loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Generiere Checkliste...</div>}
                                                        {state?.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Fehler</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                                                        {state?.data && (
                                                            <div className="space-y-2">
                                                                {state.data.checklist.map((task) => {
                                                                    const isChecked = !!state.checkedTasks[task.id];
                                                                    const taskProps = {
                                                                        onClick: () => handleTaskClick(task, item),
                                                                        className: cn(
                                                                            "flex items-center justify-between space-x-3 p-3 rounded-md border transition-colors",
                                                                            isCompliant
                                                                                ? 'cursor-default bg-background/50'
                                                                                : (isChecked
                                                                                    ? "bg-green-100/50 border-green-200/80 dark:bg-green-900/20 dark:border-green-800/50 hover:bg-green-100/60 dark:hover:bg-green-900/30 cursor-default"
                                                                                    : "bg-background/50 border-border hover:bg-gray-50 dark:hover:bg-secondary/60 cursor-pointer")
                                                                        )
                                                                    };

                                                                    const content = (
                                                                        <>
                                                                            <div className="flex items-start gap-4">
                                                                                {isCompliant || isChecked ? (
                                                                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                                                                                ) : (
                                                                                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                                                                                )}
                                                                                <p className={cn("flex-1", isChecked && !isCompliant ? "line-through text-foreground/70" : "")}>
                                                                                    <StepContent content={task.description} />
                                                                                </p>
                                                                            </div>
                                                                            {!isCompliant && !isChecked && <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />}
                                                                        </>
                                                                    );

                                                                    if (isCompliant || isChecked) {
                                                                        return <div key={task.id} {...taskProps}>{content}</div>;
                                                                    }

                                                                    return (
                                                                        <div key={task.id} {...taskProps}>
                                                                            {content}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai-management">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card className="w-full shadow-lg bg-secondary border-none">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-3xl font-bold text-primary">
                                            AI Management System (ISO 42001)
                                        </CardTitle>
                                        <CardDescription className="text-lg mt-2 max-w-4xl">
                                            Hier verwalten und exportieren Sie die Dokumentation Ihres AI Management Systems.
                                        </CardDescription>
                                    </div>
                                    <AimsExportDialog />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p>
                                    Die hier gesammelten Informationen bilden die Grundlage für ein auditierbares Managementsystem. Sie können die Daten jederzeit als strukturierte Text- oder JSON-Datei exportieren, um sie in internen Systemen weiterzuverarbeiten.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Detailansicht</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">In zukünftigen Versionen werden Sie hier eine detaillierte Ansicht und Bearbeitungsmöglichkeiten für die einzelnen Bereiche Ihres AI Management Systems finden.</p>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>

                <TabsContent value="cbs">
                    {/* Content will be handled by /cbs page, this just makes the tab exist */}
                </TabsContent>

                <TabsContent value="kurs">
                    {/* Content will be handled by /kurs page, this just makes the tab exist */}
                </TabsContent>
                <TabsContent value="exam">
                    {/* Content will be handled by /exam page, this just makes the tab exist */}
                </TabsContent>
            </Tabs>
        </div>
    );
}


const StepContent = ({ content }: { content: string }) => {
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={index}>{part.slice(1, -1)}</em>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                        <code key={index} className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-sm">
                            {part.slice(1, -1)}
                        </code>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};

// --- Main Page Wrapper (Copy of Dashboard/Page logic) ---

function AiManagementPageContent() {
    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});
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
            // If no answers, we proceed but compliance items might be empty/default. 
            // Logic in dashboard page derives compliance state.
            if (answers && Object.keys(answers).length > 0) {
                const derivedData = deriveComplianceState(answers);
                setComplianceItems(derivedData);

                // Initialize checklist state if saved
                if (fullProjectData.checklistState) {
                    const loadedState: ChecklistState = {};
                    derivedData.forEach(item => {
                        loadedState[item.id] = fullProjectData.checklistState[item.id] || { loading: false, error: null, data: null, checkedTasks: {} };
                    });
                    setChecklistState(loadedState);
                }
            }

        } else {
            console.warn("No project data found");
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const activeProjectId = projectId || getActiveProjectId();

        if (activeProjectId) {
            if (activeProjectId !== projectId) {
                router.push(`/ai-management?projectId=${activeProjectId}`);
            } else {
                loadData(activeProjectId);
            }
        } else {
            router.push('/projects');
        }
    }, [router, user, authLoading, projectId, loadData]);

    if (isLoading || authLoading) {
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
            <AiManagementInternalView
                projectName={projectName}
                complianceItems={complianceItems}
                checklistState={checklistState}
                setChecklistState={setChecklistState}
                aimsData={projectData?.aimsData || {}}
                aimsProgress={projectData?.aimsProgress || {}}
            />
        </div>
    );
}

export default function AiManagementPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <AiManagementPageContent />
        </Suspense>
    );
}
