
'use client';

import { useState } from 'react';
import { principlesData, designPhases, Principle, DesignPhase } from '@/lib/design-thinking-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDesignAdvice, type GetDesignAdviceOutput, type GetDesignAdviceInput } from '@/ai/flows/design-advisor';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function DesignCanvas() {
    const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(designPhases[0]);
    const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(principlesData[0]);
    const [projectContext, setProjectContext] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<GetDesignAdviceOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        } catch (e) {
            console.error("Failed to get design advice:", e);
            setError("Die KI-gestützte Beratung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Configuration & Input */}
            <Card className="shadow-lg sticky top-8">
                <CardHeader>
                    <CardTitle>1. Design-Kontext festlegen</CardTitle>
                    <CardDescription>Wählen Sie Ihre aktuelle Phase und das Prinzip, das Sie explorieren möchten. Beschreiben Sie kurz Ihre Idee.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <label htmlFor="project-context" className="text-sm font-medium">Ihre Idee / Ihr Projektkontext</label>
                        <Textarea 
                            id="project-context"
                            placeholder="z.B. 'Ein KI-Chatbot für den Kundenservice' oder 'Ein Tool zur Analyse von Bewerbungsunterlagen'."
                            value={projectContext}
                            onChange={(e) => setProjectContext(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    
                    <Button onClick={handleGenerateAdvice} disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <><Loader2 className="mr-2 animate-spin" /> Generiere Inspiration...</>
                        ) : (
                            <><Sparkles className="mr-2" /> Inspiration generieren</>
                        )}
                    </Button>
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
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                     {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {advice ? (
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
                        !isLoading && <p className="text-center text-muted-foreground pt-16">Definieren Sie links Ihren Kontext und klicken Sie auf "Inspiration generieren", um hier Vorschläge zu erhalten.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
