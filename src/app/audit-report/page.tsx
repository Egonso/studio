
'use client';

import { useEffect, useState, Suspense, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle, Circle, Loader2, Edit } from 'lucide-react';
import type { ComplianceItem } from '@/lib/types';
import type { ChecklistState } from '@/components/dashboard';
import { deriveComplianceState } from '@/lib/compliance-logic';
import { getComplianceChecklist, type GetComplianceChecklistOutput_Checklist } from '@/ai/flows/get-compliance-checklist';
import { useAuth } from '@/context/auth-context';
import { getAssessmentAnswers, getChecklistState, getActiveProjectId, setActiveProjectId, getExportedInsights } from '@/lib/data-service';

const statusConfig = {
    'Compliant': { badgeVariant: 'default' as const },
    'At Risk': { badgeVariant: 'secondary' as const },
    'Non-Compliant': { badgeVariant: 'destructive' as const },
};

interface FullComplianceInfo extends ComplianceItem {
    checklist?: GetComplianceChecklistOutput_Checklist[];
    checkedTasks?: Record<string, boolean>;
}

const InsightContent = ({ content }: { content: string }) => {
    return (
        <>
            {content.split('\n').map((line, index) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <Fragment key={index}>
                        {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                            }
                            return <Fragment key={partIndex}>{part}</Fragment>;
                        })}
                        <br />
                    </Fragment>
                );
            })}
        </>
    );
};


function AuditReportPageContent() {
    const [reportData, setReportData] = useState<FullComplianceInfo[] | null>(null);
    const [assessmentAnswers, setAssessmentAnswersData] = useState<Record<string, string> | null>(null);
    const [exportedInsights, setExportedInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') || getActiveProjectId();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (!user) return;

        if (!projectId) {
            router.push('/projects');
            return;
        }
        setActiveProjectId(projectId);

        const generateReport = async () => {
            const answers = await getAssessmentAnswers();
            const checklistStateData = await getChecklistState();
            const insightsData = await getExportedInsights();
            
            if (!answers || Object.keys(answers).length === 0) {
                // If no assessment, go do it.
                router.push('/assessment');
                return;
            }
            
            setAssessmentAnswersData(answers);
            setExportedInsights(insightsData);
            const checklistState: ChecklistState = checklistStateData || {};
            const initialComplianceData = deriveComplianceState(answers);

            const fetchAllChecklists = async () => {
                const fullData: FullComplianceInfo[] = await Promise.all(
                    initialComplianceData.map(async (item) => {
                        const state = checklistState[item.id];
                        let checklist, checkedTasks;

                        if (state?.data) {
                            checklist = state.data.checklist;
                            checkedTasks = state.checkedTasks;
                        } else {
                            try {
                                const result = await getComplianceChecklist({
                                    topic: item.title,
                                    currentStatus: item.status,
                                    details: item.details,
                                });
                                checklist = result.checklist;
                                checkedTasks = item.status === 'Compliant' 
                                    ? result.checklist.reduce((acc, task) => ({...acc, [task.id]: true}), {})
                                    : {};
                            } catch (e) {
                                console.error("Error fetching checklist for report:", e);
                                checklist = [];
                                checkedTasks = {};
                            }
                        }
                        
                        return { ...item, checklist, checkedTasks };
                    })
                );
                setReportData(fullData);
                setIsLoading(false);
            };

            fetchAllChecklists();
        };

        generateReport();

    }, [router, user, authLoading, projectId]);
    
    if (isLoading || authLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p>Generiere Audit-Dossier...</p>
                    </div>
                </div>
            </div>
        );
    }

    const hasHighRisk = assessmentAnswers ? Object.values(assessmentAnswers).includes("yes_high_risk") : false;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <h1 className="text-3xl font-bold">Audit-Dossier</h1>
                        <Button onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Drucken / Als PDF speichern
                        </Button>
                    </div>

                    <Card className="printable-area">
                        <CardHeader>
                            <div className='flex items-start justify-between'>
                                <div>
                                    <CardTitle className="text-2xl">Compliance-Bericht zum EU AI Act</CardTitle>
                                    <CardDescription>Automatisch generiert am {new Date().toLocaleDateString('de-DE')}</CardDescription>
                                </div>
                                <img src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp" alt="Logo" className="h-16 w-16" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                             {assessmentAnswers && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Ergebnisse der Erstbewertung</h2>
                                    <div className="space-y-2 text-sm p-4 rounded-lg bg-secondary">
                                        <p><strong>KI-Einsatz im Unternehmen:</strong> {assessmentAnswers.q1 || 'k.A.'}</p>
                                        <p><strong>Prüfung auf verbotene Praktiken (Art. 5):</strong> {assessmentAnswers.q2 || 'k.A.'}</p>
                                        <p><strong>Prüfung auf Hochrisiko-Systeme:</strong> {hasHighRisk ? 'Ja' : 'Nein'}</p>
                                    </div>
                                </div>
                            )}

                            <Separator />
                            
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Detaillierte Compliance-Analyse</h2>
                                <div className="space-y-6">
                                    {reportData?.map(item => (
                                        <div key={item.id} className="break-inside-avoid">
                                            <h3 className="font-bold text-lg">{item.title}</h3>
                                            <div className="flex items-center gap-4 mb-2">
                                                <span>Status:</span>
                                                <Badge variant={statusConfig[item.status].badgeVariant}>{item.status}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground italic mb-3">Begründung: {item.details}</p>
                                            
                                            <h4 className="font-semibold mb-2">Checkliste der Anforderungen:</h4>
                                            <ul className="space-y-2 text-sm">
                                                {item.checklist?.map(task => {
                                                    const isChecked = !!item.checkedTasks?.[task.id];
                                                    return (
                                                        <li key={task.id} className="flex items-start gap-3">
                                                            {isChecked ? <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
                                                            <span>{task.description}</span>
                                                        </li>
                                                    )
                                                })}
                                                {!item.checklist?.length && (
                                                    <li className='text-muted-foreground'>Keine spezifischen Checklistenpunkte für diesen Status generiert.</li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {exportedInsights.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <Edit className="h-5 w-5" />
                                            Manuelle Einträge aus 'Compliance by Design'
                                        </h2>
                                        <div className="space-y-4">
                                            {exportedInsights.map((insight, index) => (
                                                <div key={index} className="text-sm p-4 rounded-lg bg-secondary break-inside-avoid">
                                                    <p className="whitespace-pre-line"><InsightContent content={insight} /></p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}


                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}


export default function AuditReportPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <AuditReportPageContent />
        </Suspense>
    )
}
