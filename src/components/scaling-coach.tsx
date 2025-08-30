
'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { coachingData, type CoachingPath } from '@/lib/coaching-data';
import { getActiveProjectId, getProjectDocRef, saveCoachingData, getCoachingData } from '@/lib/data-service';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, Info, Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Input } from './ui/input';

interface CoachingAnswers {
    [stepId: string]: string;
}

export function ScalingCoach() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const pathId = searchParams.get('step') as 'horizont' | 'fundament' | 'hebel' | null;
    const [coachingPath, setCoachingPath] = useState<CoachingPath | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [answers, setAnswers] = useState<CoachingAnswers>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!pathId || !coachingData[pathId]) {
            router.push('/cbs');
            return;
        }
        setCoachingPath(coachingData[pathId]);
        
        const loadData = async () => {
            if (user && getActiveProjectId()) {
                const savedData = await getCoachingData(pathId);
                if (savedData) {
                    setAnswers(savedData);
                }
            }
            setIsLoading(false);
        };
        loadData();

    }, [pathId, router, user]);

    // Auto-save answers with debounce
    useEffect(() => {
        if (isLoading || !pathId || !user) return;

        const handler = setTimeout(() => {
            saveCoachingData(pathId, answers);
        }, 1500);

        return () => clearTimeout(handler);
    }, [answers, pathId, isLoading, user]);
    

    const handleNext = () => {
        if (coachingPath && currentStepIndex < coachingPath.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            router.push('/cbs'); // Go back to overview when done
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        } else {
             router.push('/cbs');
        }
    };
    
    const handleAnswerChange = (stepId: string, value: string) => {
        setAnswers(prev => ({...prev, [stepId]: value}));
    };
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, stepId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            
            const appendContent = (content: string) => {
                const currentAnswer = answers[stepId] || '';
                const newAnswer = `${currentAnswer}\n\n---\n[Inhalt aus Datei: ${file.name}]\n${content}`;
                handleAnswerChange(stepId, newAnswer.trim());
            };

            if (file.type.startsWith('text/')) {
                 reader.onload = (event) => {
                    const textContent = event.target?.result as string;
                    appendContent(textContent);
                };
                reader.readAsText(file);
            } else {
                const fileContentPlaceholder = `Platzhalter für Datei: "${file.name}". Der Inhalt dieses Dateityps kann im Browser nicht direkt ausgelesen werden.`;
                appendContent(fileContentPlaceholder);
            }
        }
    };

    if (!coachingPath || isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const currentStep = coachingPath.steps[currentStepIndex];
    const isLastStep = currentStepIndex === coachingPath.steps.length - 1;

    return (
       <div className="flex flex-col lg:flex-row min-h-[calc(100vh-theme(spacing.14))]">
            {/* Sidebar / Progress */}
            <aside className="w-full lg:w-80 border-b lg:border-r p-4 lg:p-6 bg-secondary/50 lg:h-auto overflow-y-auto">
                <h2 className="text-xl font-bold mb-1">{coachingPath.title}</h2>
                <p className="text-sm text-muted-foreground mb-6">{coachingPath.description}</p>
                <nav>
                    <ul className="space-y-3">
                        {coachingPath.steps.map((step, index) => (
                             <li key={step.id}>
                                <button 
                                    onClick={() => setCurrentStepIndex(index)}
                                    className="flex items-center gap-3 text-left w-full disabled:opacity-50"
                                    disabled={index > currentStepIndex}
                                >
                                    {index <= currentStepIndex ? 
                                        <CheckCircle className="h-5 w-5 text-primary shrink-0" /> : 
                                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                                    <span className={`text-sm ${index === currentStepIndex ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{step.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-3xl"
                    >
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
                                <CardDescription className="text-md pt-2">{currentStep.question}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentStep.hasFileUpload && (
                                     <Alert variant="default" className="mt-2 text-xs">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Hinweis zur Inhaltsanalyse</AlertTitle>
                                        <AlertDescription>
                                            Damit die KI den Inhalt von Dokumenten analysieren kann, laden Sie bitte eine Textdatei (.txt, .md) hoch oder kopieren Sie den Inhalt aus Ihrer PDF-/Word-Datei manuell in das Textfeld.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Textarea
                                    placeholder={currentStep.placeholder}
                                    className="min-h-[250px] text-base"
                                    value={answers[currentStep.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentStep.id, e.target.value)}
                                />
                                 {currentStep.hasFileUpload && (
                                     <>
                                        <Input 
                                            id={`upload-${currentStep.id}`}
                                            type="file"
                                            className="hidden"
                                            accept=".txt,.md,.text,.pdf,.doc,.docx"
                                            onChange={(e) => handleFileChange(e, currentStep.id)}
                                        />
                                        <label htmlFor={`upload-${currentStep.id}`} className="w-full pt-2 block">
                                            <Button type="button" asChild className="w-full cursor-pointer" variant="outline">
                                            <span>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Kontext-Dokument hochladen...
                                            </span>
                                            </Button>
                                        </label>
                                     </>
                                 )}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={handleBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {currentStepIndex === 0 ? "Zurück zur Übersicht" : "Zurück"}
                                </Button>
                                <Button onClick={handleNext}>
                                     {isLastStep ? "Coaching abschließen" : "Nächster Schritt"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
       </div>
    );
}

