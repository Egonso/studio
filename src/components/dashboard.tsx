import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ComplianceItem } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
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
import { AIAdvisor } from "./ai-advisor";
import { cn } from "@/lib/utils";

interface DashboardProps {
  complianceItems: ComplianceItem[];
}

const statusConfig = {
    'Compliant': {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        iconClassName: 'text-primary',
    },
    'At Risk': {
        icon: AlertTriangle,
        badgeVariant: 'secondary' as const,
        iconClassName: 'text-muted-foreground',
    },
    'Non-Compliant': {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        iconClassName: 'text-destructive',
    },
};

export function Dashboard({ complianceItems }: DashboardProps) {
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Act Compass
        </h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
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
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
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
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonCompliantCount}</div>
            <p className="text-xs text-muted-foreground">
              critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
            {criticalAlerts.length > 0 && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Critical Alerts!</AlertTitle>
                <AlertDescription>
                    You have {criticalAlerts.length} non-compliant item(s) requiring immediate attention.
                </AlertDescription>
                </Alert>
            )}

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Compliance Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
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
                                <AccordionContent className="pl-10 space-y-2 text-sm">
                                    <p className="text-muted-foreground">{item.description}</p>
                                    <p>{item.details}</p>
                                </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <AIAdvisor />
        </div>
      </div>
    </div>
  );
}
