
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { manifest } from '@/lib/design-thinking-data';
import { DesignCanvas } from '@/components/design-canvas';


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

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* Header Card */}
                    <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary">{manifest.title}</CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        {manifest.introduction[0]}
                                    </CardDescription>
                                </div>
                                <img src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp" alt="AI Act Compass Siegel" className="h-24 w-24 hidden md:block" />
                            </div>
                        </CardHeader>
                        <CardContent>
                           <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                                {manifest.epilog}
                                <footer className="text-xs text-right block w-full mt-2">{manifest.epilogSource}</footer>
                            </blockquote>
                        </CardContent>
                    </Card>

                   {/* Interactive Canvas */}
                    <DesignCanvas />

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
