"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert, Loader2, ListChecks, ArrowRight, FileText, GanttChartSquare, Sparkles, Wand2, GraduationCap, Building, Check, FileClock, History, Gauge, Shield, BookOpen } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { saveCurrentTask, type AimsProgress } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AimsExportDialog } from "@/components/aims-export-dialog";
import { RegisterToolsManager } from "./register-tools-manager";

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
    onRestartWizard?: () => void;
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

export function AimsDashboardView({
    projectName,
    complianceItems,
    checklistState,
    setChecklistState,
    aimsData,
    aimsProgress,
    onRestartWizard
}: DashboardProps) {
    const router = useRouter();
    // Default to ai-management tab since this is the view shown when completed
    const [activeTab, setActiveTab] = useState("ai-management");

    // Register Use Cases State for Dashboard Card
    const [useCasesCount, setUseCasesCount] = useState<number>(0);
    const [hasReviewPending, setHasReviewPending] = useState<boolean>(false);

    // Fetch register use cases on mount
    useEffect(() => {
        const loadRegisterData = async () => {
            try {
                const { registerService } = await import("@/lib/register-first/register-service");
                const cases = await registerService.listUseCases();
                setUseCasesCount(cases.length);
                setHasReviewPending(cases.some(c => c.status === 'REVIEW_RECOMMENDED'));
            } catch (error) {
                console.error("Failed to load register use cases:", error);
            }
        };
        loadRegisterData();
    }, []);

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
                pillar: 'iso-42001'
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
                        AI Governance Framework
                    </h1>
                    <p className="text-muted-foreground">
                        Organisation-Dashboard für: <span className="font-semibold">{projectName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-4 max-w-2xl">
                        Dieses Dashboard verbindet gesetzliche EU-KI-Compliance (AI Act) mit dem optionalen, international anerkannten Managementsystem ISO/IEC 42001.
                    </p>
                </div>
                <div className="flex gap-2">
                    {onRestartWizard ? (
                        <Button variant="outline" onClick={onRestartWizard}>
                            <Shield className="mr-2 h-4 w-4" />
                            KI-Managementsystem anpassen
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => router.push('/aims')}>
                            <Shield className="mr-2 h-4 w-4" />
                            KI Management System - Setup starten
                        </Button>
                    )}
                    <Link href={`/audit-report?projectId=${complianceItems.length > 0 ? new URLSearchParams(window.location.search).get('projectId') : ''}`} passHref>
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Audit-Dossier erstellen
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                    <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto min-w-full sm:min-w-0">
                        <TabsTrigger value="ai-management" className="gap-2 px-4">
                            <Sparkles className="h-4 w-4" />
                            AI Management
                        </TabsTrigger>
                        <TabsTrigger value="compliance-status" className="gap-2 px-4">
                            <GanttChartSquare className="h-4 w-4" />
                            Compliance-Status
                        </TabsTrigger>
                        <TabsTrigger value="ai-act-duties" className="gap-2 px-4">
                            <ListChecks className="h-4 w-4" />
                            AI Act Pflichten
                        </TabsTrigger>
                        <TabsTrigger value="cbs" className="gap-2 px-4">
                            <Wand2 className="h-4 w-4" />
                            Smart Policy Engine
                        </TabsTrigger>
                        <TabsTrigger value="kurs" className="gap-2 px-4">
                            <BookOpen className="h-4 w-4" />
                            Kurs
                        </TabsTrigger>
                        <TabsTrigger value="exam" className="gap-2 px-4">
                            <GraduationCap className="h-4 w-4" />
                            Zertifizierung
                        </TabsTrigger>
                        <TabsTrigger value="tools" className="gap-2 px-4">
                            <Image
                                src="/register-logo.png"
                                alt="Register"
                                width={16}
                                height={16}
                                className="h-4 w-4"
                            />
                            KI-Register
                        </TabsTrigger>
                    </TabsList>
                </div>

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
                </TabsContent>

                <TabsContent value="ai-act-duties">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <Card className="bg-secondary/20 border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex justify-between items-center">
                                    Basis-Dokumentation
                                    {compliantCount > 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((compliantCount / complianceItems.length) * 100)}%</div>
                                <p className="text-xs text-muted-foreground">Konformität erreicht</p>
                            </CardContent>
                        </Card>
                        <Card className={cn("bg-secondary/20 border-l-4", policiesExist ? "border-l-green-500" : "border-l-yellow-500")}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex justify-between items-center">
                                    KI-Policies
                                    {policiesExist ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{policiesExist ? "Erledigt" : "Ausstehend"}</div>
                                <p className="text-xs text-muted-foreground">{policiesExist ? "Richtlinien definiert" : "Noch keine Policy"}</p>
                            </CardContent>
                        </Card>
                        <Card className={cn("bg-secondary/20 border-l-4", risksDocumented ? "border-l-green-500" : "border-l-yellow-500")}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex justify-between items-center">
                                    Risikobewertung
                                    {risksDocumented ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{risksDocumented ? "Erledigt" : "Ausstehend"}</div>
                                <p className="text-xs text-muted-foreground">{risksDocumented ? "Risiken analysiert" : "Risikoanalyse fehlt"}</p>
                            </CardContent>
                        </Card>
                    </div>

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

                <TabsContent value="tools">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <RegisterToolsManager />
                    </div>
                </TabsContent>

                <TabsContent value="ai-management" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-8 md:p-12">
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl opacity-50" />

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-4 max-w-2xl">
                                <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-primary">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> ISO/IEC 42001 Ready
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    AI Management System
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Ihr zentraler Hub für KI-Compliance. Führen Sie Ihr Unternehmen sicher durch die ISO 42001 Zertifizierung und erfüllen Sie die Anforderungen des EU AI Acts.
                                </p>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <AimsExportDialog />
                                    {!onRestartWizard && (
                                        <Button variant="ghost" onClick={() => router.push('/aims')} className="hover:bg-background/50">
                                            Setup bearbeiten
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative flex items-center justify-center">
                                <div className="relative h-40 w-40">
                                    <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                                        <circle
                                            className="text-muted/20"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="42"
                                            cx="50"
                                            cy="50"
                                        />
                                        <circle
                                            className="text-primary transition-all duration-1000 ease-out"
                                            strokeWidth="8"
                                            strokeDasharray={264} // 2 * pi * 42
                                            strokeDashoffset={264 - (264 * (completedSteps / 6))}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="42"
                                            cx="50"
                                            cy="50"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-bold text-foreground">{Math.round((completedSteps / 6) * 100)}%</span>
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fortschritt</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="AIMS Status"
                            value={`${completedSteps}/6`}
                            label="Implementierte Schritte"
                            icon={FileClock}
                            status={completedSteps === 6 ? "success" : "neutral"}
                        />
                        <MetricCard
                            title="Risikobewertung"
                            value={risksDocumented ? "Dokumentiert" : "Ausstehend"}
                            label="ISO 42001 Risiken"
                            icon={History}
                            status={risksDocumented ? "success" : "warning"}
                        />
                        <MetricCard
                            title="Governance"
                            value={policiesExist ? "Aktiv" : "In Arbeit"}
                            label="KI-Richtlinien (Policies)"
                            icon={Building}
                            status={policiesExist ? "success" : "warning"}
                        />
                        <MetricCard
                            title="Audit-Reife"
                            value={auditability.label}
                            label="Zertifizierungs-Status"
                            icon={Gauge}
                            status={auditability.label === 'Grün' ? "success" : auditability.label === 'Gelb' ? "warning" : "error"}
                            customColor={auditability.color}
                        />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Timeline / Roadmap Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Implementierungs-Plan</h3>
                                    <p className="text-sm text-muted-foreground">Schritt-für-Schritt zur ISO 42001 Konformität</p>
                                </div>
                            </div>

                            <div className="relative space-y-0 pl-4 md:pl-0">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-4 bottom-4 w-px bg-border md:left-8 hidden md:block" />

                                {[
                                    {
                                        title: "Geltungsbereich (Scope)",
                                        desc: "Definieren Sie, wo das Managementsystem angewendet wird. Dies ist das Fundament.",
                                        done: !!aimsData?.scope && !!aimsData?.systems,
                                        step: 1
                                    },
                                    {
                                        title: "Kontext & Stakeholder",
                                        desc: "Verstehen Sie interne/externe Erwartungen und regulatorische Anforderungen.",
                                        done: aimsData?.stakeholders?.length > 0 && aimsData?.stakeholders[0]?.name !== '',
                                        step: 2
                                    },
                                    {
                                        title: "KI-Policy Framework",
                                        desc: "Leitlinien für ethische und sichere KI-Nutzung verabschieden.",
                                        done: aimsData?.policy && aimsData.policy.length > 20,
                                        step: 3
                                    },
                                    {
                                        title: "Rollen & Verantwortung",
                                        desc: "Klare Zuweisung von Governance-Aufgaben (RACI-Matrix).",
                                        done: aimsData?.raci?.length > 0 && aimsData?.raci[0]?.task !== '',
                                        step: 4
                                    },
                                    {
                                        title: "Systematische Risikoanalyse",
                                        desc: "Bewertung von KI-spezifischen Risiken und Chancen.",
                                        done: aimsData?.risks?.length > 0 && aimsData?.risks[0]?.description !== '',
                                        step: 5
                                    },
                                    {
                                        title: "Monitoring & Audit",
                                        desc: "Überwachung der Leistung und Planung interner Audits.",
                                        done: !!aimsData?.monitoringProcess && !!aimsData?.auditRhythm,
                                        step: 6
                                    }
                                ].map((rec, i, arr) => {
                                    const isNext = !rec.done && (i === 0 || arr[i - 1].done);

                                    return (
                                        <div key={i} className={cn(
                                            "relative flex flex-col md:flex-row gap-6 p-4 rounded-xl border transition-all duration-300 md:ml-20",
                                            rec.done ? "bg-card/50 border-border/50 opacity-80" :
                                                isNext ? "bg-background border-primary shadow-lg scale-[1.01] ring-1 ring-primary/20" :
                                                    "bg-card border-border/50 opacity-50"
                                        )}>
                                            {/* Timeline Node */}
                                            <div className={cn(
                                                "hidden md:flex absolute -left-[76px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-4 items-center justify-center bg-background z-10",
                                                rec.done ? "border-green-500 text-green-600" :
                                                    isNext ? "border-primary text-primary shadow-[0_0_15px_rgba(37,99,235,0.3)]" :
                                                        "border-muted text-muted-foreground"
                                            )}>
                                                {rec.done ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold text-lg">{rec.step}</span>}
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={cn("font-semibold text-base", rec.done && "line-through text-muted-foreground")}>
                                                        {rec.title}
                                                    </h4>
                                                    {rec.done && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100"><Check className="w-3 h-3 mr-1" /> Erledigt</Badge>}
                                                    {isNext && <Badge className="animate-pulse bg-primary text-primary-foreground">Nächster Schritt</Badge>}
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {rec.desc}
                                                </p>
                                            </div>

                                            <div className="flex items-center">
                                                {!rec.done && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.push('/aims')}
                                                        variant={isNext ? "default" : "secondary"}
                                                        className={cn("w-full md:w-auto min-w-[120px]", !isNext && "opacity-0 group-hover:opacity-100")}
                                                    >
                                                        {isNext ? "Jetzt starten" : "Bearbeiten"} <ArrowRight className="ml-2 w-3 h-3" />
                                                    </Button>
                                                )}
                                                {rec.done && (
                                                    <Button size="sm" variant="ghost" onClick={() => router.push('/aims')} className="text-muted-foreground hover:text-foreground">
                                                        Bearbeiten
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar: Tools & Help */}
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                            <Image
                                                src="/register-logo.png"
                                                alt="Register Logo"
                                                width={20}
                                                height={20}
                                                className="h-5 w-5"
                                            />
                                        </div>
                                        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">KI-Register</h3>
                                    </div>
                                    <CardDescription>
                                        Ihre inventarisierten KI-Systeme und deren Risiko-Status.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{useCasesCount}</span>
                                                <span className="text-muted-foreground ml-2 text-sm">Anwendungsfälle</span>
                                            </div>
                                            {hasReviewPending && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    Review empfohlen
                                                </Badge>
                                            )}
                                        </div>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md group" onClick={() => setActiveTab('tools')}>
                                            Zum Register <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Warum ISO 42001?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>
                                        Die ISO 42001 ist der erste globale Standard für KI-Managementsysteme.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                            <span>Erfüllt Dokumentationspflichten des AI Acts</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                            <span>Minimiert Haftungsrisiken</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                            <span>Wettbewerbsvorteil durch Zertifikat</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
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

function MetricCard({ title, value, label, icon: Icon, status, customColor }: any) {
    const statusColor = customColor ? '' : (
        status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    );

    return (
        <Card className="relative overflow-hidden border-none shadow-sm bg-card hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2 rounded-lg transition-colors", statusColor, customColor)}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{value}</h3>
                    <p className="font-medium text-sm text-muted-foreground">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50 flex items-center gap-1">
                    {label}
                </p>
            </CardContent>
        </Card>
    );
}
