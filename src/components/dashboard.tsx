
"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { saveCurrentTask, type AimsProgress } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AimsExportDialog } from "./aims-export-dialog";
import { AppTabs } from "./app-tabs";

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


export function Dashboard({ projectName, complianceItems, checklistState, setChecklistState, aimsData, aimsProgress }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("compliance-status");


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
  const risksDocumented = aimsData?.risks && aimsData.risks.length > 0 && aimsData.risks.some((r:any) => r.description);
  const policiesExist = aimsData?.policy && aimsData.policy.length >= 20;
  const rolesExist = aimsData?.raci && aimsData.raci.length > 0 && aimsData.raci.some((r:any) => r.task);

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

    return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
            <AppTabs />
        </div>
      <div className="flex items-start justify-between space-y-2 max-w-6xl mx-auto">
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

       <div className="space-y-4 max-w-6xl mx-auto">
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
                                    {risksDocumented ? <Check/> : <X/>}
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
                                     {policiesExist ? <Check/> : <X/>}
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
       </div>
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
