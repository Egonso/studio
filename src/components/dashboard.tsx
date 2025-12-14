
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText, GanttChartSquare, Sparkles, Building, Shield, Check, X, FileClock, History, LineChart, Gauge, Briefcase } from "lucide-react";
import type { ComplianceItem } from "@/lib/types";
import { getComplianceChecklist, type GetComplianceChecklistOutput, type GetComplianceChecklistOutput_Checklist } from "@/ai/flows/get-compliance-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { saveCurrentTask, type AimsProgress } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AimsExportDialog } from "./aims-export-dialog";
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

const portfolioCategories: ComplianceItem[] = [
    { id: 'portfolio-strategy', title: 'Strategie & Vision', description: 'Definition der langfristigen KI-Ziele und Ausrichtung.', status: 'At Risk', details: 'Initialphase' },
    { id: 'portfolio-usecases', title: 'Use Case Bewertung', description: 'Identifikation und Priorisierung von KI-Anwendungsfällen.', status: 'At Risk', details: 'In Evaluierung' },
    { id: 'portfolio-roi', title: 'ROI & Wertbeitrag', description: 'Analyse des wirtschaftlichen Nutzens.', status: 'At Risk', details: 'Noch nicht berechnet' },
    { id: 'portfolio-tech', title: 'Technologie & Infrastruktur', description: 'Bewertung der technischen Machbarkeit.', status: 'At Risk', details: 'In Prüfung' },
];


export function Dashboard({ projectName, complianceData, setComplianceData, aimsData, aimsProgress }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("compliance-status");

  const finalComplianceItems = complianceData.map(item => recalculateComplianceStatus(item, item.checklistState));

  const compliantCount = finalComplianceItems.filter(item => item.status === "Compliant").length;
  const atRiskCount = finalComplianceItems.filter(item => item.status === "At Risk").length;
  const nonCompliantCount = finalComplianceItems.filter(item => item.status === "Non-Compliant").length;

  const criticalAlerts = finalComplianceItems.filter(item => item.status === "Non-Compliant");
  
  const completedSteps = aimsProgress ? Object.values(aimsProgress).filter(v => v === true).length : 0;
  const risksDocumented = aimsData?.risks && aimsData.risks.length > 0 && aimsData.risks.some((r:any) => r.description);
  const policiesExist = aimsData?.policy && aimsData.policy.length >= 20;
  const rolesExist = aimsData?.raci && aimsData.raci.length > 0 && aimsData.raci.some((r:any) => r.task);

  const getAuditability = () => {
      if (completedSteps === 6 && risksDocumented && policiesExist && rolesExist) return { label: 'Grün', color: 'bg-green-500' };
      if (completedSteps >= 3 && (risksDocumented || policiesExist)) return { label: 'Gelb', color: 'bg-yellow-500' };
      return { label: 'Rot', color: 'bg-red-500' };
  };
  const auditability = getAuditability();

  const handleAccordionChange = async (item: FullComplianceInfo) => {
    if (item.checklistState.data || item.checklistState.loading) return;

    setComplianceData(prev => prev!.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: true, error: null } } : d));

    try {
      const result = await getComplianceChecklist({ topic: item.title, currentStatus: item.status, details: item.details });
      let initialCheckedTasks: Record<string, boolean> = item.checklistState.checkedTasks || {};
      if (item.status === 'Compliant') {
        initialCheckedTasks = result.checklist.reduce((acc, task) => ({ ...acc, [task.id]: true }), {});
      }
      setComplianceData(prev => prev!.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: false, data: result, checkedTasks: initialCheckedTasks } } : d));
    } catch (e) {
      console.error(e);
      setComplianceData(prev => prev!.map(d => d.id === item.id ? { ...d, checklistState: { ...d.checklistState, loading: false, error: "Failed to generate checklist." } } : d));
    }
  };
  
  const handleTaskClick = async (task: GetComplianceChecklistOutput_Checklist, complianceItem: FullComplianceInfo) => {
    if (complianceItem.status === 'Compliant') return;
    
    await saveCurrentTask({ ...task, complianceItemId: complianceItem.id, complianceItemTitle: complianceItem.title });
    router.push(`/task/${task.id}`);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col gap-6">
                 {/* 3 Main Pillars Navigation */}
                 <TabsList className="grid grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted rounded-xl">
                    <TabsTrigger value="ai-act-duties" className="py-4 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                        <ListChecks className="mr-2 h-5 w-5" />
                        AI Act Pflichten
                    </TabsTrigger>
                    <TabsTrigger value="ai-management" className="py-4 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                        <Sparkles className="mr-2 h-5 w-5" />
                        KI Management (ISO)
                    </TabsTrigger>
                     <TabsTrigger value="portfolio-strategy" className="py-4 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                        <Briefcase className="mr-2 h-5 w-5" />
                        KI-Portfolio Strategie
                    </TabsTrigger>
                </TabsList>

                {/* Sub-navigation / Wizards / Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pillar 1 Actions */}
                    <div className="flex gap-2 justify-center">
                         <Button variant={activeTab === 'ai-act-duties' ? "default" : "outline"} className={cn("w-full", activeTab !== 'ai-act-duties' && "opacity-50")} onClick={() => setActiveTab('ai-act-duties')}>
                            <Shield className="mr-2 h-4 w-4" />
                            AI Act Wizard
                        </Button>
                        <Link href={`/audit-report?projectId=${new URLSearchParams(window.location.search).get('projectId') || ''}&type=ai-act`} passHref className={cn("w-full", activeTab !== 'ai-act-duties' && "opacity-50 pointer-events-none")}>
                            <Button variant="outline" className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                Audit-Dossier
                            </Button>
                        </Link>
                    </div>

                    {/* Pillar 2 Actions */}
                    <div className="flex gap-2 justify-center">
                         <Button variant={activeTab === 'ai-management' ? "default" : "outline"} className={cn("w-full", activeTab !== 'ai-management' && "opacity-50")} onClick={() => { setActiveTab('ai-management'); router.push('/aims'); }}>
                            <Shield className="mr-2 h-4 w-4" />
                            KI Management Setup
                        </Button>
                         <div className={cn("w-full", activeTab !== 'ai-management' && "opacity-50 pointer-events-none")}>
                            {/* Reusing AimsExportDialog as the "Audit Paper" for ISO */}
                            <AimsExportDialog />
                        </div>
                    </div>

                    {/* Pillar 3 Actions */}
                    <div className="flex gap-2 justify-center">
                        <Button variant={activeTab === 'portfolio-strategy' ? "default" : "outline"} className={cn("w-full", activeTab !== 'portfolio-strategy' && "opacity-50")} onClick={() => { setActiveTab('portfolio-strategy'); router.push('/portfolio'); }}>
                            <LineChart className="mr-2 h-4 w-4" />
                            Strategie Wizard
                        </Button>
                        <Button variant="outline" className={cn("w-full", activeTab !== 'portfolio-strategy' && "opacity-50")} disabled>
                            <FileText className="mr-2 h-4 w-4" />
                            Portfolio Paper
                        </Button>
                    </div>
                </div>

                {/* Compliance Status Overview Button (acts as "Home" for the dashboard) */}
                 <div className="flex justify-center">
                     <Button
                        variant={activeTab === 'compliance-status' ? "secondary" : "ghost"}
                        onClick={() => setActiveTab('compliance-status')}
                        className="w-full md:w-1/3"
                    >
                        <GanttChartSquare className="mr-2 h-4 w-4" />
                        Gesamtübersicht & Compliance-Status
                     </Button>
                 </div>
            </div>

            <TabsContent value="compliance-status" className="space-y-6 mt-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Compliant (AI Act)</CardTitle><ShieldCheck className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{compliantCount}</div><p className="text-xs text-muted-foreground">von {finalComplianceItems.length} Anforderungen</p></CardContent></Card>
                    <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">At Risk (AI Act)</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{atRiskCount}</div><p className="text-xs text-muted-foreground">erfordern Aufmerksamkeit</p></CardContent></Card>
                    <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Non-Compliant (AI Act)</CardTitle><ShieldAlert className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{nonCompliantCount}</div><p className="text-xs text-muted-foreground">kritische Probleme</p></CardContent></Card>
                </div>
                
                 <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">KI Management System Status</h3>
                     <p className="text-sm text-muted-foreground mb-4">ISO 42001 ist ein KI-Managementsystem, das langfristige Compliance und Prozesssicherheit gewährleistet.</p>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">AIMS implementiert</CardTitle><FileClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{completedSteps}/6</div><p className="text-xs text-muted-foreground">Erfüllte Anforderungen</p></CardContent></Card>
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Risiken dokumentiert</CardTitle><History className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={cn("text-2xl font-bold flex items-center gap-2", risksDocumented ? "text-green-600" : "text-muted-foreground")}>{risksDocumented ? <Check/> : <X/>}{risksDocumented ? 'Ja' : 'Nein'}</div><p className="text-xs text-muted-foreground">Risikobewertung nach ISO 42001</p></CardContent></Card>
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Policies vorhanden</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={cn("text-2xl font-bold flex items-center gap-2", policiesExist ? "text-green-600" : "text-muted-foreground")}>{policiesExist ? <Check/> : <X/>}{policiesExist ? 'Ja' : 'Nein'}</div><p className="text-xs text-muted-foreground">Grundlegende Richtlinien vorhanden</p></CardContent></Card>
                        <Card className="transition-all hover:shadow-xl hover:-translate-y-0.5"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Auditfähigkeit</CardTitle><Gauge className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><div className={cn("w-4 h-4 rounded-full", auditability.color)} />{auditability.label}</div><p className="text-xs text-muted-foreground">Grad der ISO-Auditvorbereitung</p></CardContent></Card>
                    </div>
                </div>

                {criticalAlerts.length > 0 && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Kritische Warnungen!</AlertTitle><AlertDescription>{criticalAlerts.length > 1 ? `Sie haben ${criticalAlerts.length} nicht konforme Punkte` : 'Sie haben einen nicht konformen Punkt'}, die sofortige Aufmerksamkeit erfordern.{complianceData.find(item => item.details.includes("verbotene Praktiken")) && " Eines Ihrer Systeme scheint verbotene Praktiken nach Art. 5 anzuwenden. Dies erfordert sofortiges Handeln."}</AlertDescription></Alert>)}
                 <Card className="shadow-lg"><CardHeader><CardTitle>Übersicht des Compliance-Status</CardTitle><CardDescription>Zusammenfassung der drei Säulen: AI Act, ISO 42001 und Portfolio-Strategie.</CardDescription></CardHeader><CardContent className="grid md:grid-cols-3 gap-x-8 gap-y-4">
                        <div>
                             <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary"/> AI Act Pflichten</h3><p className="text-sm text-muted-foreground mb-4">Gesetzliche KI-Anforderungen nach EU AI Act.</p>
                             <Accordion type="single" collapsible className="w-full">
                                {finalComplianceItems.slice(0, 3).map((item) => {
                                    const config = statusConfig[item.status];
                                    return (<AccordionItem value={item.id} key={item.id}><AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span className="text-sm">{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-2 shrink-0 text-[10px] px-1 py-0">{item.status}</Badge></AccordionTrigger><AccordionContent className="pl-10 space-y-4 text-xs"><p className="text-muted-foreground font-semibold">{item.description}</p><Button variant="link" size="sm" onClick={() => setActiveTab("ai-act-duties")} className="p-0 h-auto">Details ansehen</Button></AccordionContent></AccordionItem>);
                                })}
                                <Button variant="ghost" className="w-full mt-2" onClick={() => setActiveTab("ai-act-duties")}>Alle anzeigen</Button>
                            </Accordion>
                        </div>
                        <div className="border-l border-gray-200 pl-4 md:pl-8">
                             <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/> KI Management (ISO)</h3><p className="text-sm text-muted-foreground mb-4">Strukturelle Prozesse & Governance nach ISO/IEC 42001.</p>
                             <Accordion type="single" collapsible className="w-full">
                                {isoCategories.slice(0, 3).map((item) => {
                                    const config = statusConfig[item.status];
                                    return (<AccordionItem value={item.id} key={item.id} disabled><AccordionTrigger className="hover:no-underline disabled:opacity-50"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span className="text-sm">{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-2 shrink-0 text-[10px] px-1 py-0">{item.status}</Badge></AccordionTrigger><AccordionContent className="pl-10 space-y-4 text-xs"><p>Inhalt wird in Kürze verfügbar sein.</p></AccordionContent></AccordionItem>);
                                })}
                                <Button variant="ghost" className="w-full mt-2" onClick={() => setActiveTab("ai-management")}>Alle anzeigen</Button>
                            </Accordion>
                        </div>
                        <div className="border-l border-gray-200 pl-4 md:pl-8">
                             <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Portfolio Strategie</h3><p className="text-sm text-muted-foreground mb-4">Strategische Ausrichtung und Use Case Bewertung.</p>
                             <Accordion type="single" collapsible className="w-full">
                                {portfolioCategories.map((item) => {
                                    const config = statusConfig[item.status];
                                    return (<AccordionItem value={item.id} key={item.id}><AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span className="text-sm">{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-2 shrink-0 text-[10px] px-1 py-0">{item.status}</Badge></AccordionTrigger><AccordionContent className="pl-10 space-y-4 text-xs"><p className="text-muted-foreground">{item.description}</p></AccordionContent></AccordionItem>);
                                })}
                            </Accordion>
                        </div>
                    </CardContent></Card>
            </TabsContent>

             <TabsContent value="ai-act-duties">
                <Card>
                    <CardHeader><CardTitle>Detaillierte AI Act Pflichten</CardTitle><CardDescription>Hier finden Sie eine detaillierte Aufschlüsselung aller gesetzlichen Anforderungen des EU AI Acts und können den Umsetzungsstand verfolgen.</CardDescription></CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full" onValueChange={(value) => { if (value) { const item = finalComplianceItems.find(i => i.id === value); if (item) { handleAccordionChange(item); } } }}>
                            {finalComplianceItems.map((item) => {
                                const config = statusConfig[item.status];
                                const isCompliant = item.status === 'Compliant';
                                
                                return (
                                    <AccordionItem value={item.id} key={item.id}>
                                    <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span>{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge></AccordionTrigger>
                                    <AccordionContent className="pl-10 space-y-4 text-sm">
                                        <p className="text-muted-foreground font-semibold">{item.description}</p><p className="italic">Status-Begründung: {item.details}</p>
                                        <Card className="mt-4 bg-secondary/50"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>{isCompliant ? "Erfüllte Kriterien" : "Umsetzbare Checkliste"}</CardTitle></CardHeader>
                                            <CardContent>
                                                {item.checklistState.loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Generiere Checkliste...</div>}
                                                {item.checklistState.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Fehler</AlertTitle><AlertDescription>{item.checklistState.error}</AlertDescription></Alert>}
                                                {item.checklistState.data && (
                                                    <div className="space-y-2">
                                                        {item.checklistState.data.checklist.map((task) => {
                                                            const isChecked = !!item.checklistState.checkedTasks[task.id];
                                                            return (
                                                                <div key={task.id} onClick={() => handleTaskClick(task, item)} className={cn("flex items-center justify-between space-x-3 p-3 rounded-md border transition-colors", isCompliant ? 'cursor-default bg-background/50' : (isChecked ? "bg-green-100/50 border-green-200/80 dark:bg-green-900/20 dark:border-green-800/50 hover:bg-green-100/60 dark:hover:bg-green-900/30 cursor-default" : "bg-background/50 border-border hover:bg-gray-50 dark:hover:bg-secondary/60 cursor-pointer"))}>
                                                                    <div className="flex items-start gap-4">
                                                                        {isCompliant || isChecked ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 shrink-0" /> : <AlertCircle className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />}
                                                                        <p className={cn("flex-1", isChecked && !isCompliant ? "line-through text-foreground/70" : "")}><StepContent content={task.description} /></p>
                                                                    </div>
                                                                    {!isCompliant && !isChecked && <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />}
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
                     <Card className="w-full shadow-lg bg-secondary border-none"><CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-3xl font-bold text-primary">KI Management System (ISO 42001)</CardTitle><CardDescription className="text-lg mt-2 max-w-4xl">Hier verwalten und exportieren Sie die Dokumentation Ihres AI Management Systems.</CardDescription></div><AimsExportDialog /></div></CardHeader><CardContent><p>Die hier gesammelten Informationen bilden die Grundlage für ein auditierbares Managementsystem. Sie können die Daten jederzeit als strukturierte Text- oder JSON-Datei exportieren, um sie in internen Systemen weiterzuverarbeiten.</p></CardContent></Card>

                     <Card>
                         <CardHeader><CardTitle>ISO 42001 Anforderungen</CardTitle></CardHeader>
                         <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {isoCategories.map((item) => {
                                    const config = statusConfig[item.status];
                                    return (<AccordionItem value={item.id} key={item.id} disabled><AccordionTrigger className="hover:no-underline disabled:opacity-50"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span>{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge></AccordionTrigger><AccordionContent className="pl-10 space-y-4 text-sm"><p>Inhalt wird in Kürze verfügbar sein.</p></AccordionContent></AccordionItem>);
                                })}
                            </Accordion>
                         </CardContent>
                     </Card>
                </div>
            </TabsContent>

             <TabsContent value="portfolio-strategy">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary">KI-Portfolio Strategie</CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">Entwickeln und überwachen Sie Ihre KI-Strategie und das Portfolio.</CardDescription>
                                </div>
                                <Button>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Strategie-Paper erstellen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent><p>Hier definieren Sie Ihre KI-Strategie, bewerten Use Cases und überwachen den ROI Ihrer KI-Initiativen.</p></CardContent>
                    </Card>

                    <Card>
                         <CardHeader><CardTitle>Strategische Handlungsfelder</CardTitle></CardHeader>
                         <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {portfolioCategories.map((item) => {
                                    const config = statusConfig[item.status];
                                    return (<AccordionItem value={item.id} key={item.id}><AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3 flex-1 text-left"><config.icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} /><span>{item.title}</span></div><Badge variant={config.badgeVariant} className="ml-4 shrink-0">{item.status}</Badge></AccordionTrigger><AccordionContent className="pl-10 space-y-4 text-sm"><p className="text-muted-foreground">{item.description}</p><p>Status: {item.details}</p></AccordionContent></AccordionItem>);
                                })}
                            </Accordion>
                         </CardContent>
                     </Card>
                </div>
            </TabsContent>
        </Tabs>
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
