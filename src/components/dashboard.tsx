
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText, BookOpen, GanttChartSquare, Sparkles, Wand2, GraduationCap, Building, Shield, Check, X, FileClock, History, LineChart } from "lucide-react";
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
import { saveCurrentTask } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    { id: 'iso-leadership', title: 'Leadership & Policies', description: 'Festlegung von KI-Richtlinien und Verantwortlichkeiten.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-planning', title: 'Planung & Risikoanalyse', description: 'Planung von Maßnahmen zum Umgang mit Risiken und Chancen.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-operation', title: 'Operation / Lifecycle', description: 'Steuerung des KI-System-Lebenszyklus.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-monitoring', title: 'Monitoring & KPIs', description: 'Überwachung, Messung, Analyse und Bewertung der Leistung.', status: 'At Risk', details: 'Noch nicht bewertet.' },
    { id: 'iso-improvement', title: 'Improvement / Korrekturmaßnahmen', description: 'Kontinuierliche Verbesserung des KI-Managementsystems.', status: 'At Risk', details: 'Noch nicht bewertet.' },
];


export function Dashboard({ projectName, complianceItems, checklistState, setChecklistState }: DashboardProps) {
  const router = useRouter();

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
          <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
            Dieses Dashboard verbindet gesetzliche EU-KI-Compliance (AI Act) mit dem optionalen, international anerkannten Managementsystem ISO/IEC 42001.
          </p>
        </div>
         <div className="flex gap-2">
            <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                AIMS-Setup starten
            </Button>
            <Link href={`/audit-report?projectId=${complianceItems.length > 0 ? new URLSearchParams(window.location.search).get('projectId') : ''}`} passHref>
                <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Audit-Dossier erstellen
                </Button>
            </Link>
         </div>
      </div>

       <Tabs defaultValue="compliance-status" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="compliance-status">
                    <GanttChartSquare className="mr-2 h-4 w-4" />
                    Compliance-Status
                </TabsTrigger>
                <TabsTrigger value="ai-act-duties">
                     <ListChecks className="mr-2 h-4 w-4" />
                    AI Act Pflichten
                </TabsTrigger>
                 <TabsTrigger value="iso" onClick={() => router.push('/cbd')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    ISO 42001 / AI Management System
                </TabsTrigger>
                <TabsTrigger value="cbs" onClick={() => router.push('/cbs')}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Compliance-in-a-Day
                </TabsTrigger>
                <TabsTrigger value="kurs" onClick={() => router.push('/kurs')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Kurs
                </TabsTrigger>
                <TabsTrigger value="exam" onClick={() => router.push('/exam')}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Zertifizierung
                </TabsTrigger>
            </TabsList>

            <TabsContent value="compliance-status" className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
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
                    <Card>
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
                    <Card>
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
                    <h3 className="text-xl font-bold tracking-tight mb-2">ISO 42001 Status</h3>
                    <p className="text-sm text-muted-foreground mb-4">ISO 42001 ist ein KI-Managementsystem, das langfristige Compliance und Prozesssicherheit gewährleistet.</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">AIMS implementiert</CardTitle>
                                <FileClock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0/6</div>
                                <p className="text-xs text-muted-foreground">Erfüllte Kernanforderungen des AI-Managementsystems</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Risiken dokumentiert</CardTitle>
                                <History className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold flex items-center gap-2"><X className="text-red-500 h-6 w-6"/> Nein</div>
                                <p className="text-xs text-muted-foreground">Zeigt, ob ein Risiko-Assessment nach ISO 42001 existiert</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Policies vorhanden</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold flex items-center gap-2"><Check className="text-green-500 h-6 w-6"/> Ja</div>
                                <p className="text-xs text-muted-foreground">Anzahl vorhandener KI-relevanter Richtlinien</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Auditfähigkeit</CardTitle>
                                <LineChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                             <CardContent>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                     <div className="w-4 h-4 rounded-full bg-yellow-500" />
                                     Gelb
                                </div>
                                <p className="text-xs text-muted-foreground">Bewertet, wie gut das Managementsystem auditierbar ist</p>
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
            </TabsContent>

             <TabsContent value="ai-act-duties">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Übersicht des Compliance-Status</CardTitle>
                        <CardDescription>Klicken Sie auf einen Punkt, um eine detaillierte Compliance-Checkliste zu sehen.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* EU AI Act Column */}
                        <div>
                             <h3 className="font-semibold text-lg mb-4">EU AI Act Pflichten</h3>
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
                                                        <ListChecks className="h-5 w-5 text-primary"/>
                                                        {isCompliant ? "Erfüllte Kriterien" : "Umsetzbare Checkliste"}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {state?.loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Generiere Checkliste...</div>}
                                                    {state?.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Fehler</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
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
                        </div>

                         {/* ISO 42001 Column */}
                        <div>
                             <h3 className="font-semibold text-lg mb-4">ISO 42001 Managementsystem</h3>
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
            
            <TabsContent value="iso">
                 {/* Content will be handled by /cbd page */}
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

