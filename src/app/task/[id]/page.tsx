
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

interface Task extends GetComplianceChecklistOutput_Checklist {
    complianceItemId: string;
    complianceItemTitle: string;
}

const implementationGuides: Record<string, {title: string, steps: string[]}[]> = {
    'data-governance': [
        { title: "Empfohlene nächste Schritte", steps: ["Analyse: Überprüfen Sie Ihre aktuellen Prozesse. Wo sammeln Sie Daten? Wie werden diese validiert und getestet? Gibt es bereits eine Dokumentation?", "Tooling: Suchen Sie nach Tools zur 'Bias Detection' oder zur Datenvalidierung. Anbieter wie Aporia, Fiddler AI oder Open-Source-Bibliotheken wie 'great_expectations' (Python) können hierbei helfen.", "Dokumentation: Erstellen Sie ein 'Data Sheet for Datasets'. Dies ist ein standardisiertes Dokument, das alle relevanten Informationen zu einem Datensatz zusammenfasst. Vorlagen hierfür sind online verfügbar."] },
        { title: "Leitfragen für Ihr Team", steps: ["Können wir die Herkunft und die Rechte für jeden einzelnen Datensatz nachweisen?", "Haben wir den Datensatz auf mögliche Verzerrungen (Bias) gegenüber bestimmten demografischen Gruppen analysiert?", "Wie stellen wir sicher, dass die Testdaten die realen Einsatzbedingungen des KI-Systems widerspiegeln?", "Wer ist im Unternehmen für die Datenqualität verantwortlich?"] }
    ],
    'risk-management': [
        { title: "Empfohlene nächste Schritte", steps: ["Identifikation: Führen Sie einen Workshop durch, um alle potenziellen Risiken des KI-Systems zu identifizieren (technische, rechtliche, ethische).", "Bewertung: Bewerten Sie jedes Risiko nach Eintrittswahrscheinlichkeit und potenziellem Schaden.", "Maßnahmenplanung: Entwickeln Sie konkrete Maßnahmen zur Minderung der identifizierten Risiken und weisen Sie Verantwortlichkeiten zu.", "Dokumentation: Halten Sie den gesamten Prozess in Ihrem Risikomanagement-Dokument fest."] },
        { title: "Leitfragen für Ihr Team", steps: ["Welche unvorhergesehenen Folgen könnte der Einsatz des KI-Systems haben?", "Wie stellen wir sicher, dass unser Risikomanagementplan regelmäßig überprüft und aktualisiert wird?", "Welche Restrisiken akzeptieren wir bewusst?", "Wie überwachen wir die Wirksamkeit unserer Risikominderungsmaßnahmen?"] }
    ],
     'technical-documentation': [
        { title: "Empfohlene nächste Schritte", steps: ["Struktur schaffen: Erstellen Sie eine klare Ordnerstruktur für Ihre technische Dokumentation, die den Anforderungen von Anhang IV des AI Acts entspricht.", "Inhalte sammeln: Tragen Sie alle relevanten Informationen zusammen: Systemarchitektur, Algorithmen, Trainingsdaten, Testergebnisse, Gebrauchsanweisungen.", "Versionierung: Implementieren Sie ein Versionierungssystem (z.B. Git), um Änderungen an der Dokumentation nachvollziehbar zu machen."] },
        { title: "Leitfragen für Ihr Team", steps: ["Ist unsere Dokumentation so verständlich, dass eine externe Person das System nachvollziehen kann?", "Wie halten wir die Dokumentation synchron mit der Entwicklung des KI-Systems?", "Wer ist für die Freigabe und Aktualisierung der Dokumentation verantwortlich?"] }
    ],
    'transparency': [
        { title: "Empfohlene nächste Schritte", steps: ["Gebrauchsanweisung erstellen: Schreiben Sie eine klare und verständliche Gebrauchsanweisung für die Benutzer des Systems.", "Informationspflichten erfüllen: Stellen Sie sicher, dass Benutzer darüber informiert werden, wenn sie mit einem KI-System interagieren.", "Erklärbarkeit prüfen: Nutzen Sie Techniken wie SHAP oder LIME, um die Entscheidungen Ihres Modells nachvollziehbarer zu machen und dies zu dokumentieren."] },
        { title: "Leitfragen für Ihr Team", steps: ["Verstehen unsere Nutzer, wie das KI-System zu seinen Ergebnissen kommt?", "Wie informieren wir Nutzer über die Grenzen und potenziellen Risiken des Systems?", "Sind die Kontaktdaten des Anbieters leicht auffindbar?"] }
    ],
    'human-oversight': [
        { title: "Empfohlene nächste Schritte", steps: ["Aufsichts-Konzepte entwickeln: Definieren Sie, wie und wann ein Mensch eingreifen kann ('Stop-Button', Übersteuerungsmechanismen).", "Zuständigkeiten festlegen: Benennen Sie Personen, die für die menschliche Aufsicht verantwortlich sind und schulen Sie diese.", "Monitoring einrichten: Implementieren Sie Dashboards oder Warnsysteme, die den Zustand des KI-Systems anzeigen und bei Anomalien alarmieren."] },
        { title: "Leitfragen für Ihr Team", steps: ["Welche Qualifikationen benötigen die Personen, die die Aufsicht führen?", "Wie stellen wir sicher, dass eine Person jederzeit die Kontrolle über das KI-System übernehmen kann?", "In welchen Situationen ist ein menschliches Eingreifen zwingend erforderlich?"] }
    ],
    'accuracy-robustness': [
        { title: "Empfohlene nächste Schritte", steps: ["Metriken definieren: Legen Sie klare, messbare Ziele für Genauigkeit und Robustheit fest.", "Teststrategie entwickeln: Planen Sie umfangreiche Tests, einschließlich Tests unter widrigen Bedingungen (Adversarial Testing).", "Cybersicherheit prüfen: Führen Sie einen Penetrationstest durch, um Schwachstellen im System zu identifizieren."] },
        { title: "Leitfragen für Ihr Team", steps: ["Wie verhält sich unser System bei unerwarteten oder fehlerhaften Eingaben?", "Welche Maßnahmen haben wir gegen Cyberangriffe wie 'Data Poisoning' oder 'Model Inversion' getroffen?", "Wie stellen wir die Konsistenz der Leistung über die Zeit sicher?"] }
    ],
};


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

    const guide = useMemo(() => {
        if (!task) return [];
        return implementationGuides[task.complianceItemId] || [];
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
                    </Card>

                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Lightbulb className="h-6 w-6 text-primary" />
                                Umsetzungshilfe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {guide.map((section, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold mb-2">{section.title}</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                        {section.steps.map((step, stepIndex) => <li key={stepIndex} dangerouslySetInnerHTML={{ __html: step.replace(/'([^']*)'/g, '<code>$1</code>') }} />)}
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

                            {error && <Alert variant="destructive"><AlertTitle>Fehler</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

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
