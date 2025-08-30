
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { principlesData, designPhases, Principle, DesignPhase } from '@/lib/design-thinking-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDesignAdvice, type GetDesignAdviceOutput, type GetDesignAdviceInput } from '@/ai/flows/design-advisor';
import { Loader2, Sparkles, Wand2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDesignCanvasData, saveDesignCanvasData, getActiveProjectId } from '@/lib/data-service';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';

export function DesignCanvas() {
    const { user } = useAuth();
    const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(designPhases[0]);
    const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(principlesData[0]);
    const [projectContext, setProjectContext] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [advice, setAdvice] = useState<GetDesignAdviceOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user && getActiveProjectId()) {
                setIsInitializing(true);
                const data = await getDesignCanvasData() as { projectContext: string; advice: GetDesignAdviceOutput | null } | null;
                if (data) {
                    setProjectContext(data.projectContext || '');
                    setAdvice(data.advice || null);
                }
                setIsInitializing(false);
            }
        };
        loadData();
    }, [user]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            
            const appendContent = (content: string) => {
                setProjectContext(prev => `${prev}\n\n---\n[Inhalt aus Datei: ${file.name}]\n${content}`);
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

    const handleGenerateAdvice = async () => {
        setIsLoading(true);
        setError(null);
        setAdvice(null);
        
        try {
            const input: GetDesignAdviceInput = {
                phase: selectedPhase,
                principle: selectedPrinciple,
                projectContext: projectContext || "Ein allgemeines Software-Produkt für den europäischen Markt.",
            };
            const result = await getDesignAdvice(input);
            setAdvice(result);
            await saveDesignCanvasData({ projectContext, advice: result });
        } catch (e) {
            console.error("Failed to get design advice:", e);
            setError("Die KI-gestützte Beratung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsLoading(false);
        }
    };

    // Save project context on change, with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isInitializing && projectContext !== undefined) {
                 saveDesignCanvasData({ projectContext, advice });
            }
        }, 1000); // 1-second debounce

        return () => {
            clearTimeout(handler);
        };
    }, [projectContext, advice, isInitializing]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Configuration & Input */}
            <Card className="shadow-lg sticky top-8">
                <CardHeader>
                    <CardTitle>1. Design-Kontext festlegen</CardTitle>
                    <CardDescription>Wählen Sie Ihre aktuelle Phase und das Prinzip, das Sie explorieren möchten. Beschreiben Sie Ihre Idee oder laden Sie ein Dokument hoch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="phase-select" className="text-sm font-medium">Design-Phase</label>
                                <Select onValueChange={(value) => setSelectedPhase(designPhases.find(p => p.id === value) || designPhases[0])} defaultValue={selectedPhase.id}>
                                    <SelectTrigger id="phase-select">
                                        <SelectValue placeholder="Phase auswählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {designPhases.map(phase => (
                                            <SelectItem key={phase.id} value={phase.id}>{phase.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Output dieser Phase: {selectedPhase.output}</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="principle-select" className="text-sm font-medium">Prinzip der vertrauensw. Intelligenz</label>
                                <Select onValueChange={(value) => setSelectedPrinciple(principlesData.find(p => p.id === value) || principlesData[0])} defaultValue={selectedPrinciple.id}>
                                    <SelectTrigger id="principle-select">
                                        <SelectValue placeholder="Prinzip auswählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {principlesData.map(principle => (
                                            <SelectItem key={principle.id} value={principle.id}>{principle.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">{selectedPrinciple.description}</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="project-context" className="text-sm font-medium">Ihre Idee / Ihr Projektkontext (wird automatisch gespeichert)</label>
                                <Textarea 
                                    id="project-context"
                                    placeholder="z.B. 'Ein KI-Chatbot für den Kundenservice' oder 'Ein Tool zur Analyse von Bewerbungsunterlagen'."
                                    value={projectContext}
                                    onChange={(e) => setProjectContext(e.target.value)}
                                    className="min-h-[120px]"
                                />
                                <Input 
                                    id="context-file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".txt,.md,.text,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="context-file-upload" className="w-full pt-2 block">
                                    <Button type="button" asChild className="w-full cursor-pointer" variant="outline">
                                       <span>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Kontext-Dokument hochladen...
                                       </span>
                                    </Button>
                                </label>
                                {fileName && <p className="text-xs text-muted-foreground mt-2">Zuletzt hochgeladen: {fileName}</p>}
                            </div>
                            
                            <Button onClick={handleGenerateAdvice} disabled={isLoading || isInitializing} className="w-full">
                                {isLoading ? (
                                    <><Loader2 className="mr-2 animate-spin" /> Generiere Inspiration...</>
                                ) : (
                                    <><Sparkles className="mr-2" /> Inspiration generieren</>
                                )}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Right Column: AI-Generated Output */}
            <Card className="shadow-lg min-h-[500px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="text-primary" />
                        2. KI-gestützter Inspiration Layer
                    </CardTitle>
                    <CardDescription>Erhalten Sie massgeschneiderte Fragen, Muster und Chancen basierend auf Ihrer Auswahl.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || isInitializing ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : advice ? (
                        <div className="space-y-6 animate-in fade-in-50">
                            {advice.sections.map((section, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-md mb-2">{section.title}</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                        {section.content.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground pt-16">Definieren Sie links Ihren Kontext und klicken Sie auf "Inspiration generieren", um hier Vorschläge zu erhalten.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
