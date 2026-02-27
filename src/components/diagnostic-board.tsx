import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlusCircle, ShieldAlert, Activity, Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    DiagnosticReport,
    ActionItem,
    EngineContext
} from "@/lib/compliance-engine/types";
import { calculateDiagnosticReport } from "@/lib/compliance-engine/index/calculator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DiagnosticBoardProps {
    workspaceId: string;
    organizationName: string;
    context: EngineContext;
}

export function DiagnosticBoard({
    workspaceId,
    organizationName,
    context
}: DiagnosticBoardProps) {
    const router = useRouter();
    const report: DiagnosticReport = calculateDiagnosticReport(context);
    const { indices, recommendations } = report;
    const { primaryAction, secondaryActions } = recommendations;

    // Graceful Blank State: If no use cases and no policies, user just started.
    const isBlankState = context.useCases.length === 0 && !context.orgStatus.hasPolicy;

    if (isBlankState) {
        return (
            <Card className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 mb-8 overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                                Fundament für {organizationName} legen
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                                Um Ihre AI Compliance-Diagnostik zu starten, erfassen Sie zunächst Ihr erstes KI-System im Register oder erstellen Sie Ihre zentrale AI Policy.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Button size="lg" className="w-full justify-start py-6" onClick={() => router.push(`/my-register`)}>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                1. Erstes KI-System erfassen
                            </Button>
                            <Button size="lg" variant="outline" className="w-full justify-start py-6" onClick={() => router.push(`/dashboard/cbs`)}>
                                <ShieldCheck className="mr-2 h-5 w-5" />
                                2. AI Policy generieren
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 mb-8 overflow-hidden shadow-sm">
            <CardContent className="p-0">
                {/* TOP SECTION: 3 INDICES */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-slate-200 dark:border-slate-800">
                    <IndexMetric
                        title="Regulatory Exposure"
                        value={indices.exposure}
                        description="Haftungsrisiko & Offene Pflichten"
                        inverse={true}
                        icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
                    />
                    <IndexMetric
                        title="Governance Maturity"
                        value={indices.maturity}
                        description="Prozesse & Policies etabliert"
                        icon={<Activity className="h-4 w-4 text-primary" />}
                    />
                    <IndexMetric
                        title="Transparency"
                        value={indices.transparency}
                        description="Externe & Interne Sichtbarkeit"
                        icon={<Eye className="h-4 w-4 text-blue-500" />}
                    />
                </div>

                {/* BOTTOM SECTION: ACTIONS */}
                <div className="p-6 md:p-8 grid md:grid-cols-5 gap-8 items-start bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="md:col-span-3 space-y-4">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Höchste Priorität
                        </p>
                        {primaryAction ? (
                            <PrimaryActionCard action={primaryAction} workspaceId={workspaceId} />
                        ) : (
                            <div className="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 p-6 rounded-xl border border-green-200 dark:border-green-800/30 flex items-center gap-4">
                                <ShieldCheck className="h-8 w-8 text-green-500" />
                                <div>
                                    <h3 className="text-lg font-bold">Alles im grünen Bereich</h3>
                                    <p className="text-sm opacity-90">Ihre Organisation hat derzeit keine kritischen Compliance-Lücken.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Weitere Optimierungen ({secondaryActions.length})
                        </p>
                        <div className="space-y-3">
                            {secondaryActions.slice(0, 4).map(action => (
                                <SecondaryActionItem key={action.id} action={action} workspaceId={workspaceId} />
                            ))}
                            {secondaryActions.length === 0 && (
                                <p className="text-sm text-slate-500 italic">Keine weiteren Aufgaben anstehend.</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function IndexMetric({ title, value, description, icon, inverse = false }: { title: string, value: number, description: string, icon: React.ReactNode, inverse?: boolean }) {
    // Inverse means 0 is good, 100 is bad (like Exposure)
    const normalizedProgress = inverse ? (100 - value) : value;
    const colorClass = inverse
        ? (value > 50 ? 'bg-red-500' : value > 0 ? 'bg-amber-500' : 'bg-emerald-500')
        : (value > 80 ? 'bg-emerald-500' : value > 40 ? 'bg-amber-500' : 'bg-red-500');

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{value}%</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                </div>
            </div>
            <Progress value={normalizedProgress} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-slate-800 dark:bg-slate-200" />
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    );
}

function PrimaryActionCard({ action, workspaceId }: { action: ActionItem, workspaceId: string }) {
    const router = useRouter();

    const severityBorder = {
        critical: 'bg-red-500',
        high: 'bg-orange-500',
        medium: 'bg-blue-500',
        low: 'bg-slate-400'
    }[action.severity];

    const Icon = action.severity === 'critical' ? AlertTriangle : ArrowRight;

    return (
        <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden bg-white dark:bg-slate-950">
            <div className={`absolute top-0 left-0 w-1 h-full ${severityBorder}`} />

            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Icon className="h-5 w-5 text-slate-500" />
                    {action.title}
                </h3>
                {action.impactReductionEstimate ? (
                    <Badge variant="outline" className="font-mono text-xs">
                        -{action.impactReductionEstimate} Exposure
                    </Badge>
                ) : null}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {action.description}
            </p>

            <Button
                onClick={() => router.push(`${action.href}${action.href.includes('?') ? '&' : '?'}projectId=${workspaceId}`)}
                className={`w-full md:w-auto shadow-sm ${action.severity === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            >
                Jetzt beheben
            </Button>
        </div>
    );
}

function SecondaryActionItem({ action, workspaceId }: { action: ActionItem, workspaceId: string }) {
    return (
        <Link href={`${action.href}${action.href.includes('?') ? '&' : '?'}projectId=${workspaceId}`}>
            <div className="group block p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm group-hover:text-primary transition-colors">
                            {action.title}
                        </p>
                        {action.impactIncreaseEstimate ? (
                            <p className="text-xs text-primary/80 mt-1 font-medium">
                                +{action.impactIncreaseEstimate} Maturity Score
                            </p>
                        ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
            </div>
        </Link>
    );
}
