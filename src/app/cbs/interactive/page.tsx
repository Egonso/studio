
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

function InteractiveCoachingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const step = searchParams.get('step');

    if (authLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // Placeholder title based on the step from URL
    const getTitle = () => {
        switch(step) {
            case 'horizont': return 'Coaching: Vision Reverse Engineering';
            case 'fundament': return 'Coaching: Bottleneck-Identifikation';
            case 'hebel': return 'Coaching: Hebel-Finder';
            default: return 'Interaktives Coaching';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Button variant="ghost" onClick={() => router.push('/cbs')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Zurück zur Übersicht
                    </Button>
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                           <CardTitle className="text-3xl font-bold text-primary">{getTitle()}</CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Hier beginnt Ihr interaktiver Coaching-Prozess. Dieser Bereich wird in den nächsten Schritten ausgebaut.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4"/>
                                <p className="text-muted-foreground">Der interaktive Coaching-Dialog ist in Entwicklung.</p>
                                <p className="text-sm text-muted-foreground">Kommende Features: Geführte Fragen, KI-gestütztes Brainstorming und Aktionspläne.</p>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}


export default function InteractiveCoachingPage() {
     return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <InteractiveCoachingPageContent />
        </Suspense>
    );
}
