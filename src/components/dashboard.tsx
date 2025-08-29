
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2, ListChecks, ArrowRight, FileText } from "lucide-react";
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


export interface ChecklistState {
    [itemId: string]: {
        loading: boolean;
        error: string | null;
        data: GetComplianceChecklistOutput | null;
        checkedTasks: Record<string, boolean>;
    }
}

interface DashboardProps {
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



export function Dashboard({ complianceItems, checklistState, setChecklistState }: DashboardProps) {
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
  
  const handleTaskClick = (task: GetComplianceChecklistOutput_Checklist, complianceItem: ComplianceItem) => {
    // Prevent navigation for compliant items
    if (complianceItem.status === 'Compliant') return;

    localStorage.setItem('currentTask', JSON.stringify({
      ...task,
      complianceItemId: complianceItem.id,
      complianceItemTitle: complianceItem.title,
    }));
     router.push(`/task/${task.id}`);
  };


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Act Compass
        </h1>
        <Link href="/audit-report" passHref>
             <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Audit-Dossier erstellen
            </Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliantCount}</div>
            <p className="text-xs text-muted-foreground">
              out of {complianceItems.length} requirements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskCount}</div>
             <p className="text-xs text-muted-foreground">
              require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonCompliantCount}</div>
            <p className="text-xs text-muted-foreground">
              critical issues
            </p>
          </CardContent>
        </Card>
      </div>

        <div className="space-y-6">
            {criticalAlerts.length > 0 && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Critical Alerts!</AlertTitle>
                <AlertDescription>
                    {criticalAlerts.length > 1 ? `Sie haben ${criticalAlerts.length} non-compliant items` : 'Sie haben einen non-compliant item'}, die sofortige Aufmerksamkeit erfordern.
                    {complianceItems.find(item => item.details.includes("verbotene Praktiken")) && 
                     " Eines Ihrer Systeme scheint verbotene Praktiken nach Art. 5 anzuwenden. Dies erfordert sofortiges Handeln."}
                </AlertDescription>
                </Alert>
            )}

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Compliance Status Breakdown</CardTitle>
                    <CardDescription>Click on an item to see a detailed compliance checklist.</CardDescription>
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
                                                <ListChecks className="h-5 w-5 text-primary"/>
                                                {isCompliant ? "Erfüllte Kriterien" : "Actionable Checklist"}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {state?.loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Generating checklist...</div>}
                                            {state?.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                                            {state?.data && (
                                                <div className="space-y-2">
                                                    {state.data.checklist.map((task) => {
                                                        const isChecked = !!state.checkedTasks[task.id];
                                                        const taskProps = {
                                                            key: task.id,
                                                            onClick: () => handleTaskClick(task, item),
                                                            className: cn(
                                                                "flex items-center justify-between space-x-3 p-3 rounded-md border transition-colors",
                                                                isCompliant 
                                                                    ? 'cursor-default bg-background/50'
                                                                    : (isChecked 
                                                                        ? "bg-green-100/50 border-green-200/80 hover:bg-green-100 cursor-pointer"
                                                                        : "bg-background/50 border-border hover:bg-gray-50 cursor-pointer")
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
                                                                <p className={cn("flex-1", !isCompliant && isChecked && "line-through text-foreground/70")}>
                                                                    {task.description}
                                                                </p>
                                                              </div>
                                                              {!isCompliant && <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />}
                                                            </>
                                                        );

                                                        if (isCompliant) {
                                                            return <div {...taskProps}>{content}</div>;
                                                        }

                                                        return (
                                                            <div {...taskProps}>
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
        </div>
    </div>
  );
}
