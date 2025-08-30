
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { manifest, scalingData } from '@/lib/scaling-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


function ComplianceByScalingPageContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    if (authLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const handleStartCoaching = (step: string) => {
        router.push(`/cbs/interactive?step=${step}`);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                           <CardTitle className="text-3xl font-bold text-primary">{manifest.title}</CardTitle>
                            <CardDescription className="text-lg mt-2 max-w-4xl">
                                {manifest.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3 items-start">
                        {scalingData.map((item) => (
                            <Card key={item.id} className="flex flex-col h-full shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
                                    <CardDescription className="text-md pt-2">{item.principle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-primary">Leitfrage:</h3>
                                        <blockquote className="mt-1 border-l-2 pl-4 italic text-sm">
                                            {item.question}
                                        </blockquote>
                                    </div>
                                     <div>
                                        <h3 className="font-semibold text-primary">Beispiel:</h3>
                                        <blockquote className="mt-1 border-l-2 pl-4 italic text-sm">
                                            {item.example}
                                        </blockquote>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            Verstärker durch Prinzipien:
                                        </h3>
                                        <div className="space-y-3">
                                            {item.amplifiers.map((amp, index) => (
                                                <div key={index} className="p-3 rounded-md bg-background/50 border">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-semibold text-sm">{amp.principle}</h4>
                                                        <Badge variant="outline">{amp.article}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{amp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleStartCoaching(item.id)}>
                                        Coaching starten <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}

export default function ComplianceByScalingPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <ComplianceByScalingPageContent />
        </Suspense>
    );
}
