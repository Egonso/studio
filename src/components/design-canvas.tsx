
'use client';

import { useState, useEffect, ChangeEvent, Fragment } from 'react';
import { principlesData, designPhases, Principle, DesignPhase } from '@/lib/design-thinking-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDesignAdvice, type GetDesignAdviceOutput, type GetDesignAdviceInput } from '@/ai/flows/design-advisor';
import { detectAntiPatterns, type DetectAntiPatternsOutput, type DetectAntiPatternsInput } from '@/ai/flows/anti-pattern-detector';
import { Loader2, Sparkles, Wand2, Upload, Info, ShieldAlert, CheckCircle, AlertCircle, Send, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDesignCanvasData, saveDesignCanvasData, getActiveProjectId, saveExportedInsight } from '@/lib/data-service';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';

interface ValueMapping {
    [principleId: string]: {
        rating: number;
        conflict: boolean;
    }
}
interface DesignCanvasData {
    projectContext: string;
    advice: GetDesignAdviceOutput | null;
    antiPatternDescription: string;
    antiPatternAnalysis: DetectAntiPatternsOutput | null;
    valueMapping: ValueMapping;
}

const ratingLabels = ['Irrelevant', 'Niedrige Priorität', 'Hohe Priorität', 'Sehr hohe Priorität'];

export function DesignCanvas() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(designPhases[0]);
    const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(principlesData[0]);
    
    // State for the whole canvas data
    const [canvasData, setCanvasData] = useState<DesignCanvasData>({
        projectContext: '',
        advice: null,
        antiPatternDescription: '',
        antiPatternAnalysis: null,
        valueMapping: {},
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

    const handleExportInsight = async (insightText: string) => {
        try {
            await saveExportedInsight(insightText);
            toast({
                title: "Erfolg!",
                description: "Der Eintrag wurde zum Audit-Dossier hinzugefügt.",
            });
        } catch (error) {
            console.error("Failed to export insight:", error);
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Der Eintrag konnte nicht gespeichert werden.",
            });
        }
    };
    
    const handleValueMappingChange = (principleId: string, key: 'rating' | 'conflict', value: number | boolean) => {
        setCanvasData(prev => {
            const newMapping = { ...prev.valueMapping };
            if (!newMapping[principleId]) {
                newMapping[principleId] = { rating: 0, conflict: false };
            }
            (newMapping[principleId] as any)[key] = value;
            return { ...prev, valueMapping: newMapping };
        });
    };

    // Save canvas data on change, with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isInitializing && getActiveProjectId()) {
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
                           <Sparkles className="text-primary"/> 1. Projektkontext & Impulse
                        </CardTitle>
                        <CardDescription>Beschreiben Sie Ihre Idee, wählen Sie Phase & Prinzip und erhalten Sie kreativen Input.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <>
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
                                <Separator />
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
                                </div>
                                
                                <Button onClick={handleGenerateAdvice} disabled={isGeneratingAdvice || isInitializing} className="w-full">
                                    {isGeneratingAdvice ? (
                                        <><Loader2 className="mr-2 animate-spin" /> Generiere Impulse...</>
                                    ) : (
                                        <><Sparkles className="mr-2" /> Entwicklungsimpulse generieren</>
                                    )}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> 2. Werte-Mapping & Analyse</CardTitle>
                        <CardDescription>Definieren Sie die ethischen Grundlagen Ihres Projekts gemäß der ISO/IEC/IEEE 24748-7000 Norm.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <div className="space-y-6">
                                {principlesData.map(p => {
                                    const mapping = canvasData.valueMapping?.[p.id] || { rating: 0, conflict: false };
                                    return (
                                        <div key={p.id} className="space-y-3">
                                            <Label htmlFor={`slider-${p.id}`} className='font-semibold'>{p.title}</Label>
                                            <p className="text-xs text-muted-foreground">{p.description}</p>
                                            <div className="flex items-center gap-4">
                                                <Slider
                                                    id={`slider-${p.id}`}
                                                    min={0}
                                                    max={3}
                                                    step={1}
                                                    value={[mapping.rating]}
                                                    onValueChange={(value) => handleValueMappingChange(p.id, 'rating', value[0])}
                                                    className="flex-1"
                                                />
                                                <span className="text-xs font-medium w-32 text-right">{ratingLabels[mapping.rating]}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`conflict-${p.id}`} 
                                                    checked={mapping.conflict}
                                                    onCheckedChange={(checked) => handleValueMappingChange(p.id, 'conflict', !!checked)}
                                                />
                                                <label
                                                    htmlFor={`conflict-${p.id}`}
                                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                                                >
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500"/>
                                                    Potenzieller Wertekonflikt
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                         )}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> 3. Anti-Pattern Detektor</CardTitle>
                        <CardDescription>Prüfen Sie User-Workflows auf bekannte "Dark Patterns" oder manipulative Designs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <>
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
                            </>
                         )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: AI-Generated Output */}
            <div className="space-y-8">
                <Card className="shadow-lg min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="text-primary" />
                            Ihre generierten Impulse & Analysen
                        </CardTitle>
                        <CardDescription>Hier erscheinen Ihre Ergebnisse. Fügen Sie wichtige Erkenntnisse mit einem Klick zum Audit-Dossier hinzu.</CardDescription>
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
                                <Accordion type="multiple" defaultValue={["item-0"]} className="w-full animate-in fade-in-50">
                                    {canvasData.advice.sections.map((section, index) => (
                                        <AccordionItem value={`item-${index}`} key={index}>
                                            <AccordionTrigger className="text-md font-semibold">
                                                {section.title}
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-4">
                                                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                                    {section.content.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                                <Button variant="outline" size="sm" onClick={() => handleExportInsight(`**${section.title}**:\n${section.content.map(c => `- ${c}`).join('\n')}`)}>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Abschnitt zum Audit-Dossier
                                                </Button>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <p className="text-center text-muted-foreground pt-12">Definieren Sie links Ihren Kontext und klicken Sie auf "Entwicklungsimpulse generieren", um hier Vorschläge zu erhalten.</p>
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
                                    <h3 className="font-semibold text-lg mb-2">Analyse der Anti-Pattern</h3>
                                    {canvasData.antiPatternAnalysis.detectedPatterns.length > 0 ? (
                                        canvasData.antiPatternAnalysis.detectedPatterns.map((pattern, index) => (
                                            <div key={index}>
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Potenzielles Problem gefunden: {pattern.patternName}</AlertTitle>
                                                    <AlertDescription className="space-y-2 mt-2">
                                                        <p><strong>Erklärung:</strong> {pattern.explanation}</p>
                                                        <p><strong>Besserer Vorschlag:</strong> {pattern.suggestion}</p>
                                                        <Button variant="secondary" size="sm" className="mt-2" onClick={() => handleExportInsight(`**Anti-Pattern-Analyse: ${pattern.patternName}**\n**Problem:** ${pattern.explanation}\n**Lösungsvorschlag:** ${pattern.suggestion}`)}>
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Analyse zum Audit-Dossier
                                                        </Button>
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        ))
                                    ) : (
                                        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50">
                                            <CheckCircle className="h-4 w-4 text-green-600"/>
                                            <AlertTitle>Keine offensichtlichen Anti-Pattern gefunden</AlertTitle>
                                            <AlertDescription>
                                                In der beschriebenen Vorgehensweise wurden keine gängigen manipulativen Muster erkannt.
                                                 <Button variant="outline" size="sm" className="mt-2" onClick={() => handleExportInsight(`**Anti-Pattern-Analyse:**\nKeine offensichtlichen Anti-Pattern im beschriebenen Workflow gefunden.`)}>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Ergebnis zum Audit-Dossier
                                                </Button>
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

