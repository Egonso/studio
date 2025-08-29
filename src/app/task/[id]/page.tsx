
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Lightbulb, Bot, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import type { GetComplianceChecklistOutput_Checklist } from '@/ai/flows/get-compliance-checklist';
import { analyzeDocument, type AnalyzeDocumentOutput } from '@/ai/flows/document-analyzer';

interface Task extends GetComplianceChecklistOutput_Checklist {
    complianceItemId: string;
    complianceItemTitle: string;
}

export default function TaskPage() {
    const [task, setTask] = useState<Task | null>(null);
    const [documentText, setDocumentText] = useState("");
    const [analysisResult, setAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        setError(null);
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
            setError("Die Analyse ist fehlgeschlagen. Bitte versuchen Sie es später erneut.");
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

                            {error && <Alert variant="destructive"><AlertTitle>Fehler</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                            {analysisResult && (
                                <div className="space-y-6 pt-4">
                                    <h3 className="font-semibold text-lg">Analyseergebnis</h3>
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
                                </div>
                            )}

                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}
