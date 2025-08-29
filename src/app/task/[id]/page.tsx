
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Lightbulb, Bot, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, ShieldCheck, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import type { GetComplianceChecklistOutput_Checklist } from '@/ai/flows/get-compliance-checklist';
import { analyzeDocument, type AnalyzeDocumentOutput } from '@/ai/flows/document-analyzer';
import { getImplementationGuide, type GetImplementationGuideOutput } from '@/ai/flows/get-implementation-guide';
import { Skeleton } from '@/components/ui/skeleton';


interface Task extends GetComplianceChecklistOutput_Checklist {
    complianceItemId: string;
    complianceItemTitle: string;
}

type Guide = GetImplementationGuideOutput['guide'];

const formatStep = (step: string) => {
    let html = step;
    // Convert **bold** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Convert `code` to <code>
    html = html.replace(/`([^`]*)`/g, '<code class="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-sm">$1</code>');
    return html;
};

export default function TaskPage() {
    const [task, setTask] = useState<Task | null>(null);
    const [documentText, setDocumentText] = useState("");
    const [analysisResult, setAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    
    const [guide, setGuide] = useState<Guide | null>(null);
    const [isGuideLoading, setIsGuideLoading] = useState(true);
    const [guideError, setGuideError] = useState<string | null>(null);

    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    useEffect(() => {
        const storedTaskData = localStorage.getItem('currentTask');
        if (storedTaskData) {
            const parsedTask: Task = JSON.parse(storedTaskData);
            if (parsedTask.id === taskId) {
                 setTask(parsedTask);
            } else {
                localStorage.removeItem('currentTask');
                router.push('/dashboard');
            }
        } else {
            router.push('/dashboard');
        }
    }, [router, taskId]);

    useEffect(() => {
        if (!task) return;

        const fetchGuide = async () => {
            setIsGuideLoading(true);
            setGuideError(null);
            
            const storedCompanyContext = localStorage.getItem('companyContext');
            const companyContext = storedCompanyContext ? JSON.parse(storedCompanyContext) : {};

            try {
                const result = await getImplementationGuide({ 
                    taskDescription: task.description,
                    companyDescription: companyContext.companyDescription,
                    riskProfile: companyContext.riskProfile,
                });
                setGuide(result.guide);
            } catch (e) {
                console.error("Failed to fetch implementation guide", e);
                setGuideError("Die Anleitung konnte nicht geladen werden. Bitte versuchen Sie es später erneut.");
            } finally {
                setIsGuideLoading(false);
            }
        };

        fetchGuide();
    }, [task]);


    const handleMarkAsDone = () => {
        if (!task) return;
        const checklistState = JSON.parse(localStorage.getItem('checklistState') || '{}');
        if (checklistState[task.complianceItemId]) {
            checklistState[task.complianceItemId].checkedTasks[task.id] = true;
        }
        localStorage.setItem('checklistState', JSON.stringify(checklistState));
        localStorage.removeItem('currentTask');
        router.push('/dashboard');
    };
    
    const handleAnalyze = async () => {
        if (!documentText || !task) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeDocument({
                documentText: documentText,
                complianceTopic: task.complianceItemTitle,
                taskDescription: task.description,
            });
            setAnalysisResult(result);
        } catch (e) {
            console.error("Analysis failed", e);
            setAnalysisError("Die Analyse ist fehlgeschlagen. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!task) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p>Lade Aufgabe...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 flex items-start justify-center">
                <div className="w-full max-w-4xl space-y-8">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <Button variant="ghost" size="sm" className="justify-start p-0 h-auto mb-4" onClick={() => router.push('/dashboard')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Zurück zum Dashboard
                            </Button>
                            <CardTitle className="text-2xl">{task.complianceItemTitle}</CardTitle>
                            <CardDescription>Detaillierte Anleitung zur Erfüllung der folgenden Anforderung:</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="mt-2 border-l-2 pl-6 italic">
                                "{task.description}"
                            </blockquote>
                        </CardContent>
                    </Card>

                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Lightbulb className="h-6 w-6 text-primary" />
                                Personalisierte Umsetzungshilfe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isGuideLoading && (
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-1/3" />
                                    <div className="pl-5 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                    <Skeleton className="h-6 w-1/4 mt-4" />
                                     <div className="pl-5 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                </div>
                            )}
                            {guideError && <Alert variant="destructive"><AlertTitle>Fehler</AlertTitle><AlertDescription>{guideError}</AlertDescription></Alert>}
                            
                            {guide && guide.map((section, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold mb-2">{section.title}</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                        {section.steps.map((step, stepIndex) => <li key={stepIndex} dangerouslySetInnerHTML={{ __html: formatStep(step) }} />)}
                                    </ul>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleMarkAsDone}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Als erledigt markieren
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Bot className="h-6 w-6 text-primary" />
                                KI-gestützter Dokumenten-Check
                            </CardTitle>
                            <CardDescription>
                                Fügen Sie hier den Text aus Ihrem relevanten Dokument ein (z.B. aus Word, Confluence, etc.), um eine schnelle KI-Analyse zu erhalten.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Fügen Sie hier den Text Ihres Dokuments ein..."
                                className="min-h-[200px] text-sm"
                                value={documentText}
                                onChange={(e) => setDocumentText(e.target.value)}
                            />
                             <Button onClick={handleAnalyze} disabled={isAnalyzing || !documentText}>
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analysiere...
                                    </>
                                ) : "Dokument analysieren"}
                            </Button>

                            {analysisError && <Alert variant="destructive"><AlertTitle>Fehler</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>}

                            {analysisResult && (
                                <div className="space-y-6 pt-4">
                                    <h3 className="font-semibold text-lg">Analyseergebnis</h3>

                                    <Alert variant={analysisResult.isFulfilled ? 'default' : 'destructive'} className={analysisResult.isFulfilled ? 'bg-green-50 border-green-200' : ''}>
                                        {analysisResult.isFulfilled ? <ShieldCheck className="h-4 w-4 text-green-700" /> : <ShieldX className="h-4 w-4" />}
                                        <AlertTitle className={analysisResult.isFulfilled ? 'text-green-800' : ''}>
                                            KI-Einschätzung: {analysisResult.isFulfilled ? "Anforderung scheint erfüllt" : "Anforderung scheint nicht erfüllt"}
                                        </AlertTitle>
                                        <AlertDescription className={analysisResult.isFulfilled ? 'text-green-700' : ''}>
                                            Basierend auf dem bereitgestellten Text scheint das Dokument die Kernpunkte der Aufgabe {analysisResult.isFulfilled ? "zu adressieren" : "noch nicht ausreichend zu adressieren. Beachten Sie die potenziellen Lücken."}
                                        </AlertDescription>
                                    </Alert>

                                    <div>
                                        <h4 className="font-medium mb-2">Zusammenfassung</h4>
                                        <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">{analysisResult.summary}</p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <Alert>
                                            <ThumbsUp className="h-4 w-4" />
                                            <AlertTitle>Stärken</AlertTitle>
                                            <AlertDescription>
                                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                                    {analysisResult.strengths.map((s, i) => <li key={`s-${i}`}>{s}</li>)}
                                                     {analysisResult.strengths.length === 0 && <li className="text-muted-foreground">Keine spezifischen Stärken für diese Aufgabe gefunden.</li>}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                        <Alert variant="destructive">
                                             <ThumbsDown className="h-4 w-4" />
                                            <AlertTitle>Potenzielle Lücken</AlertTitle>
                                            <AlertDescription>
                                                 <ul className="list-disc pl-5 mt-2 space-y-1">
                                                    {analysisResult.weaknesses.map((w, i) => <li key={`w-${i}`}>{w}</li>)}
                                                    {analysisResult.weaknesses.length === 0 && <li className="text-muted-foreground">Keine offensichtlichen Lücken gefunden. Gut gemacht!</li>}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                     <Alert variant="default" className="mt-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                                        <AlertTriangle className="h-4 w-4 !text-yellow-700" />
                                        <AlertTitle>Rechtlicher Hinweis</AlertTitle>
                                        <AlertDescription className="!text-yellow-700">
                                            Diese KI-gestützte Analyse stellt keine Rechtsberatung dar und ersetzt nicht die Prüfung durch qualifizierte Rechtsexperten. Sie dient ausschließlich als unterstützendes Werkzeug.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}

    