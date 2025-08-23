
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GetComplianceChecklistOutput_Checklist } from '@/ai/flows/get-compliance-checklist';

interface Task extends GetComplianceChecklistOutput_Checklist {
    complianceItemId: string;
    complianceItemTitle: string;
}

export default function TaskPage() {
    const [task, setTask] = useState<Task | null>(null);
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    useEffect(() => {
        const storedTaskData = localStorage.getItem('currentTask');
        if (storedTaskData) {
            const parsedTask: Task = JSON.parse(storedTaskData);
            // Ensure we are on the correct page for the stored task
            if (parsedTask.id === taskId) {
                 setTask(parsedTask);
            } else {
                // If the task in storage doesn't match the URL, something is wrong.
                // For safety, clear it and go back to dashboard.
                localStorage.removeItem('currentTask');
                router.push('/dashboard');
            }
        } else {
            // No task data found, redirect to dashboard
            router.push('/dashboard');
        }
    }, [router, taskId]);

    const handleMarkAsDone = () => {
        if (!task) return;

        // Update the checklist state in localStorage
        const checklistState = JSON.parse(localStorage.getItem('checklistState') || '{}');
        if (checklistState[task.complianceItemId]) {
            checklistState[task.complianceItemId].checkedTasks[task.id] = true;
        }
        localStorage.setItem('checklistState', JSON.stringify(checklistState));

        // Clear the current task and navigate back
        localStorage.removeItem('currentTask');
        router.push('/dashboard');
    };

    if (!task) {
        return (
            <div className="flex flex-col min-h-screen bg-background dark">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p>Lade Aufgabe...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background dark">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-3xl shadow-2xl">
                    <CardHeader>
                        <Button variant="ghost" size="sm" className="justify-start p-0 h-auto mb-4" onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück zum Dashboard
                        </Button>
                        <CardTitle className="text-2xl">{task.complianceItemTitle}</CardTitle>
                        <CardDescription>Detaillierte Anleitung zur Erfüllung der folgenden Anforderung:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <blockquote className="mt-2 border-l-2 pl-6 italic">
                            "{task.description}"
                        </blockquote>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Umsetzungshilfe</h3>
                             <Alert>
                                <Lightbulb className="h-4 w-4" />
                                <AlertTitle>Empfohlene nächste Schritte</AlertTitle>
                                <AlertDescription className='space-y-2 mt-2'>
                                   <p>
                                        <strong>1. Analyse:</strong> Überprüfen Sie Ihre aktuellen Prozesse. Wo sammeln Sie Daten? Wie werden diese validiert und getestet? Gibt es bereits eine Dokumentation?
                                   </p>
                                   <p>
                                        <strong>2. Tooling:</strong> Suchen Sie nach Tools zur "Bias Detection" oder zur Datenvalidierung. Anbieter wie Aporia, Fiddler AI oder Open-Source-Bibliotheken wie `great_expectations` (Python) können hierbei helfen.
                                   </p>
                                     <p>
                                        <strong>3. Dokumentation:</strong> Erstellen Sie ein "Data Sheet for Datasets". Dies ist ein standardisiertes Dokument, das alle relevanten Informationen zu einem Datensatz zusammenfasst. Vorlagen hierfür sind online verfügbar.
                                   </p>
                                </AlertDescription>
                            </Alert>

                             <Alert variant="destructive">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Leitfragen für Ihr Team</AlertTitle>
                                <AlertDescription className='space-y-2 mt-2'>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Können wir die Herkunft und die Rechte für jeden einzelnen Datensatz nachweisen?</li>
                                        <li>Haben wir den Datensatz auf mögliche Verzerrungen (Bias) gegenüber bestimmten demografischen Gruppen analysiert?</li>
                                        <li>Wie stellen wir sicher, dass die Testdaten die realen Einsatzbedingungen des KI-Systems widerspiegeln?</li>
                                         <li>Wer ist im Unternehmen für die Datenqualität verantwortlich?</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>

                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleMarkAsDone}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Als erledigt markieren
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}

