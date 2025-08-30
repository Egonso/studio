
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, Lightbulb, Users, FlaskConical, TestTube, LocateFixed } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { manifest, principlesData, designPhases, Principle } from '@/lib/design-thinking-data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ComplianceByDesignPageContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    if (authLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const phaseIcons: { [key: string]: React.ElementType } = {
        d1: Users,
        d2: LocateFixed,
        d3: Lightbulb,
        d4: FlaskConical,
        d5: TestTube,
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* Header Card */}
                    <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-primary">Compliance by Design</CardTitle>
                            <CardDescription className="text-lg">
                                Ein interaktiver Prozess, der Design Thinking mit den Werten des EU AI Acts verbindet, um bessere und vertrauenswürdigere Produkte zu entwickeln.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button onClick={() => alert("Interaktiver Prozess wird in Kürze implementiert.")}>
                                Neues Design-Projekt starten <ArrowRight className="ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Manifest Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{manifest.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            {manifest.introduction.map((p, i) => <p key={i}>{p}</p>)}
                             <blockquote className="mt-6 border-l-2 pl-6 italic">
                                {manifest.epilog}
                                <footer className="text-xs text-right block w-full mt-2">{manifest.epilogSource}</footer>
                            </blockquote>
                        </CardContent>
                    </Card>

                    {/* Principles Grid */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Die 10 Prinzipien der vertrauenswürdigen Intelligenz</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {principlesData.map((p: Principle) => (
                                <Card key={p.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{p.title}</CardTitle>
                                        <CardDescription>{p.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto bg-secondary/50 p-4 text-xs text-muted-foreground rounded-b-lg">
                                        <div>
                                            <p><strong>Historische Figur:</strong> {p.figure}</p>
                                            <p><strong>Vorbild-Firma:</strong> {p.company}</p>
                                            <p className="mt-2"><Badge variant="outline">{p.article}</Badge></p>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                    
                    <Separator />

                    {/* Design Thinking Phases */}
                     <div>
                        <h2 className="text-2xl font-bold mb-4">Die 5 Phasen des Design Prozesses</h2>
                         <div className="space-y-4">
                            {designPhases.map(phase => {
                                const Icon = phaseIcons[phase.id] || Lightbulb;
                                return (
                                    <Card key={phase.id} className="overflow-hidden">
                                        <CardHeader className="flex flex-row items-start bg-secondary/30 gap-4 space-y-0 p-4">
                                            <div className="bg-primary text-primary-foreground rounded-full p-2">
                                               <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{phase.title}</CardTitle>
                                                <CardDescription className="mt-1">{phase.description}</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <p className="text-sm font-semibold">Output:</p>
                                            <p className="text-sm text-muted-foreground">{phase.output}</p>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Inspiration Layer Placeholder */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Inspiration Layer (Demnächst verfügbar)</h2>
                         <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Was kommt hier?</AlertTitle>
                            <AlertDescription>
                                Dies wird der interaktive Kern des Prozesses. Hier finden Sie bald kontext-spezifische Fragen, wiederverwendbare Design-Muster, einen Szenario-Simulator und Werkzeuge, um Risiken in Marktchancen umzuwandeln.
                            </AlertDescription>
                        </Alert>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default function ComplianceByDesignPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <ComplianceByDesignPageContent />
        </Suspense>
    );
}
