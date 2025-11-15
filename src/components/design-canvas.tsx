
'use client';

import { useState, useEffect, ChangeEvent, Fragment } from 'react';
import { principlesData, designPhases, Principle, DesignPhase } from '@/lib/design-thinking-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDesignAdvice, type GetDesignAdviceOutput, type GetDesignAdviceInput } from '@/ai/flows/design-advisor';
import { detectAntiPatterns, type DetectAntiPatternsOutput, type DetectAntiPatternsInput } from '@/ai/flows/anti-pattern-detector';
import { Loader2, Sparkles, Wand2, Upload, Info, ShieldAlert, CheckCircle, AlertCircle, Send, AlertTriangle, PlusCircle, Trash2, Users, FileSignature, Layers } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getDesignCanvasData, saveDesignCanvasData, getActiveProjectId, saveExportedInsight } from '@/lib/data-service';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

interface ValueMapping {
    [principleId: string]: {
        rating: number;
    }
}

interface Stakeholder {
    id: string;
    name: string;
    type: 'internal' | 'external' | 'societal';
    concerns: string;
}

interface ValueTension {
    id: string;
    principleA: string;
    principleB: string;
    resolution: string;
}

interface Requirement {
    id: string;
    title: string;
    description: string;
    responsible: string; // RACI field
}

interface DesignCanvasData {
    projectContext: string;
    stakeholders: Stakeholder[];
    advice: GetDesignAdviceOutput | null;
    antiPatternDescription: string;
    antiPatternAnalysis: DetectAntiPatternsOutput | null;
    valueMapping: ValueMapping;
    valueTensions: ValueTension[];
    requirements: Requirement[];
}

const ratingLabels = ['Irrelevant', 'Niedrige Priorität', 'Hohe Priorität', 'Sehr hohe Priorität'];
const stakeholderTypeLabels = {
    'internal': 'Intern (Team, Management)',
    'external': 'Extern (Kunden, Partner)',
    'societal': 'Gesellschaftlich (Öffentlichkeit, Regulierer)'
};

function RequirementManager({ requirements, setCanvasData }: { requirements: Requirement[], setCanvasData: React.Dispatch<React.SetStateAction<DesignCanvasData>> }) {
    const addRequirement = () => {
        setCanvasData(prev => ({
            ...prev,
            requirements: [...prev.requirements, { id: new Date().getTime().toString(), title: '', description: '', responsible: '' }]
        }));
    };

    const removeRequirement = (id: string) => {
        setCanvasData(prev => ({
            ...prev,
            requirements: prev.requirements.filter(req => req.id !== id)
        }));
    };

    const handleReqChange = (id: string, field: keyof Omit<Requirement, 'id'>, value: string) => {
        setCanvasData(prev => ({
            ...prev,
            requirements: prev.requirements.map(req => req.id === id ? { ...req, [field]: value } : req)
        }));
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileSignature className='text-primary'/>
                    Value-to-Requirement-Traceability
                </CardTitle>
                <CardDescription>
                    Hier werden aus Werten konkrete, nachverfolgbare Anforderungen.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {requirements.map((req) => (
                    <div key={req.id} className="p-4 rounded-lg border bg-secondary/50 space-y-3">
                         <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold">Anforderung</p>
                            <Button variant="ghost" size="icon" onClick={() => removeRequirement(req.id)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        <Input 
                            placeholder="Titel der Anforderung (z.B. 'Transparenz bei Chatbot-Antworten')"
                            value={req.title}
                            onChange={(e) => handleReqChange(req.id, 'title', e.target.value)}
                        />
                         <Textarea 
                            placeholder="Beschreibung und Akzeptanzkriterien"
                            value={req.description}
                            onChange={(e) => handleReqChange(req.id, 'description', e.target.value)}
                            className="text-xs min-h-[80px]"
                        />
                        <Input 
                            placeholder="Verantwortliche Person (RACI)"
                            value={req.responsible}
                            onChange={(e) => handleReqChange(req.id, 'responsible', e.target.value)}
                        />
                    </div>
                ))}
                 <Button variant="outline" size="sm" onClick={addRequirement} className='w-full'>
                    <PlusCircle className="mr-2 h-4 w-4"/> Anforderung hinzufügen
                </Button>
            </CardContent>
            <CardFooter>
                 <Card className='bg-secondary/30 w-full'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-lg'><Layers className='text-primary'/>Verification Layer / Evidence</CardTitle>
                        <CardDescription>Hier werden Nachweise für die Erfüllung der Anforderungen gesammelt. (Zukünftiger Schritt)</CardDescription>
                    </CardHeader>
                </Card>
            </CardFooter>
        </Card>
    );
}

export function DesignCanvas() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(designPhases[0]);
    const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(principlesData[0]);
    
    // State for the whole canvas data
    const [canvasData, setCanvasData] = useState<DesignCanvasData>({
        projectContext: '',
        stakeholders: [{id: '1', name: '', type: 'external', concerns: ''}],
        advice: null,
        antiPatternDescription: '',
        antiPatternAnalysis: null,
        valueMapping: {},
        valueTensions: [],
        requirements: [],
    });
    
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
                    const stakeholders = Array.isArray(data.stakeholders) && data.stakeholders.length > 0 
                        ? data.stakeholders 
                        : [{id: '1', name: '', type: 'external', concerns: ''}];
                    const valueTensions = Array.isArray(data.valueTensions) ? data.valueTensions : [];
                    const requirements = Array.isArray(data.requirements) ? data.requirements : [];
                    setCanvasData(prev => ({ ...prev, ...data, stakeholders, valueTensions, requirements }));
                }
                setIsInitializing(false);
            }
        };
        loadData();
    }, [user]);

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
    
    const handleValueMappingChange = (principleId: string, key: 'rating', value: number) => {
        setCanvasData(prev => {
            const newMapping = { ...prev.valueMapping };
            if (!newMapping[principleId]) {
                newMapping[principleId] = { rating: 0 };
            }
            (newMapping[principleId] as any)[key] = value;
            return { ...prev, valueMapping: newMapping };
        });
    };

    const handleStakeholderChange = (index: number, field: keyof Omit<Stakeholder, 'id'>, value: string) => {
        const newStakeholders = [...canvasData.stakeholders];
        (newStakeholders[index] as any)[field] = value;
        setCanvasData(prev => ({ ...prev, stakeholders: newStakeholders }));
    };

    const addStakeholder = () => {
        setCanvasData(prev => ({
            ...prev,
            stakeholders: [...prev.stakeholders, { id: new Date().getTime().toString(), name: '', type: 'external', concerns: '' }]
        }));
    };

    const removeStakeholder = (index: number) => {
        if (canvasData.stakeholders.length > 1) {
            const newStakeholders = canvasData.stakeholders.filter((_, i) => i !== index);
            setCanvasData(prev => ({ ...prev, stakeholders: newStakeholders }));
        } else {
            setCanvasData(prev => ({ ...prev, stakeholders: [{id: '1', name: '', type: 'external', concerns: ''}] }));
        }
    };

    // --- Value Tension Handlers ---
    const addValueTension = () => {
        setCanvasData(prev => ({
            ...prev,
            valueTensions: [...prev.valueTensions, { id: new Date().getTime().toString(), principleA: '', principleB: '', resolution: '' }]
        }));
    };

    const handleTensionChange = (index: number, field: keyof Omit<ValueTension, 'id'>, value: string) => {
        const newTensions = [...canvasData.valueTensions];
        (newTensions[index] as any)[field] = value;
        setCanvasData(prev => ({ ...prev, valueTensions: newTensions }));
    };

    const removeValueTension = (index: number) => {
        const newTensions = canvasData.valueTensions.filter((_, i) => i !== index);
        setCanvasData(prev => ({ ...prev, valueTensions: newTensions }));
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="space-y-8 sticky top-8 lg:col-span-1">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Users className="text-primary"/> 1. Stakeholder & Kontext
                        </CardTitle>
                        <CardDescription>Definieren Sie, wer von Ihrer KI betroffen ist und was Sie vorhaben.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="project-context">Ihre Idee / Ihr Projektkontext</Label>
                                    <Textarea 
                                        id="project-context"
                                        placeholder="z.B. 'Ein KI-Chatbot für den Kundenservice' oder 'Ein Tool zur Analyse von Bewerbungsunterlagen'."
                                        value={canvasData.projectContext}
                                        onChange={(e) => setCanvasData(prev => ({ ...prev, projectContext: e.target.value }))}
                                        className="min-h-[100px] mt-1"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label>Betroffene Stakeholder</Label>
                                    {canvasData.stakeholders.map((stakeholder, index) => (
                                        <div key={stakeholder.id} className="p-4 rounded-lg border bg-secondary/50 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    placeholder="Name (z.B. Endkunden)"
                                                    value={stakeholder.name}
                                                    onChange={(e) => handleStakeholderChange(index, 'name', e.target.value)}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removeStakeholder(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                            <Select value={stakeholder.type} onValueChange={(value) => handleStakeholderChange(index, 'type', value)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(stakeholderTypeLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Textarea 
                                                placeholder="Betroffenheit / Interessen (z.B. 'Erhalten KI-generierte Antworten auf Anfragen')"
                                                value={stakeholder.concerns}
                                                onChange={(e) => handleStakeholderChange(index, 'concerns', e.target.value)}
                                                className="text-xs min-h-[60px]"
                                            />
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addStakeholder} className='w-full'>
                                        <PlusCircle className="mr-2 h-4 w-4"/> Stakeholder hinzufügen
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> 2. Impulse & Analyse</CardTitle>
                        <CardDescription>Wählen Sie Phase & Prinzip und lassen Sie die KI mitdenken.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phase-select">Design-Phase</Label>
                                    <Select onValueChange={(value) => setSelectedPhase(designPhases.find(p => p.id === value) || designPhases[0])} defaultValue={selectedPhase.id}>
                                        <SelectTrigger id="phase-select"><SelectValue placeholder="Phase auswählen" /></SelectTrigger>
                                        <SelectContent>{designPhases.map(phase => (<SelectItem key={phase.id} value={phase.id}>{phase.title}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="principle-select">Prinzip der vertrauensw. Intelligenz</Label>
                                    <Select onValueChange={(value) => setSelectedPrinciple(principlesData.find(p => p.id === value) || principlesData[0])} defaultValue={selectedPrinciple.id}>
                                        <SelectTrigger id="principle-select"><SelectValue placeholder="Prinzip auswählen" /></SelectTrigger>
                                        <SelectContent>{principlesData.map(principle => (<SelectItem key={principle.id} value={principle.id}>{principle.title}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleGenerateAdvice} disabled={isGeneratingAdvice || isInitializing} className="w-full">
                                    {isGeneratingAdvice ? <><Loader2 className="mr-2 animate-spin" /> Generiere Impulse...</> : <><Sparkles className="mr-2" /> Entwicklungsimpulse generieren</>}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> 3. Werte-Mapping</CardTitle>
                        <CardDescription>Definieren Sie die Priorität der ethischen Werte für Ihr Projekt.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <div className="space-y-6">
                                {principlesData.map(p => {
                                    const mapping = canvasData.valueMapping?.[p.id] || { rating: 0 };
                                    return (
                                        <div key={p.id} className="space-y-3">
                                            <Label htmlFor={`slider-${p.id}`} className='font-semibold'>{p.title}</Label>
                                            <div className="flex items-center gap-4">
                                                <Slider id={`slider-${p.id}`} min={0} max={3} step={1} value={[mapping.rating]} onValueChange={(value) => handleValueMappingChange(p.id, 'rating', value[0])} className="flex-1" />
                                                <span className="text-xs font-medium w-32 text-right">{ratingLabels[mapping.rating]}</span>
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
                        <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-primary"/> 4. Wertekonflikte analysieren</CardTitle>
                        <CardDescription>Dokumentieren Sie, wo Werte kollidieren und wie Sie die Spannung auflösen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isInitializing ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : (
                            <>
                                {canvasData.valueTensions.map((tension, index) => (
                                    <div key={tension.id} className="p-4 rounded-lg border bg-secondary/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-semibold">Konfliktanalyse</p>
                                            <Button variant="ghost" size="icon" onClick={() => removeValueTension(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                        <div className='grid grid-cols-2 gap-2'>
                                            <Select value={tension.principleA} onValueChange={(v) => handleTensionChange(index, 'principleA', v)}>
                                                <SelectTrigger><SelectValue placeholder="Wert A"/></SelectTrigger>
                                                <SelectContent>
                                                    {principlesData.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select value={tension.principleB} onValueChange={(v) => handleTensionChange(index, 'principleB', v)}>
                                                <SelectTrigger><SelectValue placeholder="Wert B"/></SelectTrigger>
                                                <SelectContent>
                                                    {principlesData.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Textarea
                                            placeholder="Begründung & Entscheidung zur Auflösung..."
                                            value={tension.resolution}
                                            onChange={(e) => handleTensionChange(index, 'resolution', e.target.value)}
                                            className="text-xs min-h-[80px]"
                                        />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addValueTension} className='w-full'>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Wertekonflikt hinzufügen
                                </Button>
                            </>
                         )}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> 5. Anti-Pattern Detektor</CardTitle>
                        <CardDescription>Prüfen Sie User-Workflows auf manipulative Designs.</CardDescription>
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
                                    {isDetecting ? <><Loader2 className="mr-2 animate-spin" /> Prüfe Muster...</> : <>Muster prüfen</>}
                                </Button>
                            </>
                         )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: AI-Generated Output & Requirements */}
            <div className="space-y-8 lg:col-span-2">
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
                
                 {isInitializing ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : <RequirementManager requirements={canvasData.requirements} setCanvasData={setCanvasData} />}
            </div>
        </div>
    );
}
