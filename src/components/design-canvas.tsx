
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { principlesData, designPhases, Principle, DesignPhase } from '@/lib/design-thinking-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDesignAdvice, type GetDesignAdviceOutput, type GetDesignAdviceInput } from '@/ai/flows/design-advisor';
import { detectAntiPatterns, type DetectAntiPatternsOutput, type DetectAntiPatternsInput } from '@/ai/flows/anti-pattern-detector';
import { Loader2, Sparkles, Wand2, Upload, Info, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDesignCanvasData, saveDesignCanvasData, getActiveProjectId } from '@/lib/data-service';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

interface DesignCanvasData {
    projectContext: string;
    advice: GetDesignAdviceOutput | null;
    antiPatternDescription: string;
    antiPatternAnalysis: DetectAntiPatternsOutput | null;
}

export function DesignCanvas() {
    const { user } = useAuth();
    const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(designPhases[0]);
    const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(principlesData[0]);
    
    // State for the whole canvas data
    const [canvasData, setCanvasData] = useState<DesignCanvasData>({
        projectContext: '',
        advice: null,
        antiPatternDescription: '',
        antiPatternAnalysis: null,
    });
    
    const [fileName, setFileName] = useState<string | null>(null);
    
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const [adviceError, setAdviceError] = useState<string | null>(null);
    const [detectorError, setDetectorError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user && getActiveProjectId()) {
                setIsInitializing(true);
                const data = await getDesignCanvasData() as DesignCanvasData | null;
                if (data) {
                    setCanvasData(prev => ({ ...prev, ...data }));
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
                setCanvasData(prev => ({
                    ...prev,
                    projectContext: `${prev.projectContext}\n\n---\n[Inhalt aus Datei: ${file.name}]\n${content}`
                }));
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
        setIsGeneratingAdvice(true);
        setAdviceError(null);
        setCanvasData(prev => ({ ...prev, advice: null }));
        
        try {
            const input: GetDesignAdviceInput = {
                phase: selectedPhase,
                principle: selectedPrinciple,
                projectContext: canvasData.projectContext || "Ein allgemeines Software-Produkt für den europäischen Markt.",
            };
            const result = await getDesignAdvice(input);
            setCanvasData(prev => ({ ...prev, advice: result }));
        } catch (e) {
            console.error("Failed to get design advice:", e);
            setAdviceError("Die KI-gestützte Beratung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsGeneratingAdvice(false);
        }
    };
    
    const handleDetectAntiPatterns = async () => {
        if (!canvasData.antiPatternDescription) return;
        setIsDetecting(true);
        setDetectorError(null);
        setCanvasData(prev => ({ ...prev, antiPatternAnalysis: null }));

        try {
            const input: DetectAntiPatternsInput = {
                description: canvasData.antiPatternDescription
            };
            const result = await detectAntiPatterns(input);
            setCanvasData(prev => ({ ...prev, antiPatternAnalysis: result }));
        } catch(e) {
            console.error("Failed to detect anti-patterns:", e);
            setDetectorError("Die Mustererkennung konnte nicht durchgeführt werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsDetecting(false);
        }
    };

    // Save canvas data on change, with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isInitializing) {
                 saveDesignCanvasData(canvasData);
            }
        }, 1000); // 1-second debounce

        return () => {
            clearTimeout(handler);
        };
    }, [canvasData, isInitializing]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Configuration & Input */}
            <div className="space-y-8 sticky top-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Sparkles className="text-primary"/> 1. Inspiration Layer
                        </CardTitle>
                        <CardDescription>Wählen Sie Ihre Phase & Prinzip, beschreiben Sie Ihre Idee und erhalten Sie kreativen Input.</CardDescription>
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
                                    <Alert variant="default" className="mt-2 text-xs">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Hinweis zur Inhaltsanalyse</AlertTitle>
                                        <AlertDescription>
                                            Damit die KI den Inhalt von Dokumenten analysieren kann, laden Sie bitte eine Textdatei (.txt, .md) hoch oder kopieren Sie den Inhalt aus Ihrer PDF-/Word-Datei manuell in das Textfeld.
                                        </AlertDescription>
                                    </Alert>
                                    <Textarea 
                                        id="project-context"
                                        placeholder="z.B. 'Ein KI-Chatbot für den Kundenservice' oder 'Ein Tool zur Analyse von Bewerbungsunterlagen'."
                                        value={canvasData.projectContext}
                                        onChange={(e) => setCanvasData(prev => ({ ...prev, projectContext: e.target.value }))}
                                        className="min-h-[120px] mt-2"
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
                                
                                <Button onClick={handleGenerateAdvice} disabled={isGeneratingAdvice || isInitializing} className="w-full">
                                    {isGeneratingAdvice ? (
                                        <><Loader2 className="mr-2 animate-spin" /> Generiere Inspiration...</>
                                    ) : (
                                        <><Sparkles className="mr-2" /> Inspiration generieren</>
                                    )}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> 2. Anti-Pattern Detektor</CardTitle>
                        <CardDescription>Beschreiben Sie einen geplanten User-Workflow, um ihn auf bekannte "Dark Patterns" oder manipulative Designs zu prüfen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Beispiel: Der User legt ein Produkt in den Warenkorb. Beim Checkout fügen wir automatisch eine teure Express-Lieferung hinzu, die der User aktiv abwählen muss."
                            className="min-h-[100px]"
                            value={canvasData.antiPatternDescription}
                            onChange={(e) => setCanvasData(prev => ({...prev, antiPatternDescription: e.target.value}))}
                            disabled={isDetecting}
                        />
                         <Button onClick={handleDetectAntiPatterns} disabled={isDetecting || !canvasData.antiPatternDescription.trim()}>
                            {isDetecting ? (
                                <><Loader2 className="mr-2 animate-spin" /> Prüfe Muster...</>
                            ) : (
                                <>Muster prüfen</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: AI-Generated Output */}
            <div className="space-y-8">
                <Card className="shadow-lg min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="text-primary" />
                            KI-gestützte Ergebnisse
                        </CardTitle>
                        <CardDescription>Hier erscheinen Ihre generierten Inspirationen und Analysen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isInitializing ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> :
                        (<>
                            {/* Inspiration Layer Output */}
                            {isGeneratingAdvice ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : adviceError ? (
                                <Alert variant="destructive">
                                    <AlertTitle>Fehler</AlertTitle>
                                    <AlertDescription>{adviceError}</AlertDescription>
                                </Alert>
                            ) : canvasData.advice ? (
                                <div className="space-y-6 animate-in fade-in-50">
                                    {canvasData.advice.sections.map((section, index) => (
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
                                <p className="text-center text-muted-foreground pt-12">Definieren Sie links Ihren Kontext und klicken Sie auf "Inspiration generieren", um hier Vorschläge zu erhalten.</p>
                            )}

                            <Separator className="my-8"/>

                             {/* Anti-Pattern Detector Output */}
                            {isDetecting ? (
                                 <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : detectorError ? (
                                <Alert variant="destructive">
                                    <AlertTitle>Fehler</AlertTitle>
                                    <AlertDescription>{detectorError}</AlertDescription>
                                </Alert>
                            ) : canvasData.antiPatternAnalysis ? (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <h3 className="font-semibold text-md mb-2">Analyse der Anti-Pattern</h3>
                                    {canvasData.antiPatternAnalysis.detectedPatterns.length > 0 ? (
                                        canvasData.antiPatternAnalysis.detectedPatterns.map((pattern, index) => (
                                            <Alert key={index} variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Potenzielles Problem gefunden: {pattern.patternName}</AlertTitle>
                                                <AlertDescription className="space-y-2 mt-2">
                                                   <p><strong>Erklärung:</strong> {pattern.explanation}</p>
                                                   <p><strong>Besserer Vorschlag:</strong> {pattern.suggestion}</p>
                                                </AlertDescription>
                                            </Alert>
                                        ))
                                    ) : (
                                        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50">
                                             <CheckCircle className="h-4 w-4 text-green-600"/>
                                             <AlertTitle>Keine offensichtlichen Anti-Pattern gefunden</AlertTitle>
                                             <AlertDescription>
                                                In der beschriebenen Vorgehensweise wurden keine gängigen manipulativen Muster erkannt. Das ist ein gutes Zeichen!
                                             </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground">Beschreiben Sie links einen Workflow, um ihn auf Anti-Pattern zu prüfen.</p>
                            )}
                        </>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
