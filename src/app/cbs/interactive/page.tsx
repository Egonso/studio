
'use client';

import { Suspense, useEffect, useState, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSharedPolicy, type SharedPolicyData } from '@/lib/data-service';
import { Button } from '@/components/ui/button';


function InteractiveCoachingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const policyId = searchParams.get('policyId');
    
    const [policyData, setPolicyData] = useState<SharedPolicyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     const renderPolicyContent = (content: string) => {
        if (!content) return null;
        
        let filledContent = content;
        if (policyData?.placeholders) {
            Object.entries(policyData.placeholders).forEach(([key, value]) => {
                if (value) {
                    filledContent = filledContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
                }
            });
        }
        
        const lines = filledContent.split('\n');
        return lines.map((line, index) => {
            const key = `line-${index}`;
            if (line.trim() === '') return null;
            if (line.startsWith('---')) return <hr key={key} className="my-4" />;
            if (line.startsWith('**')) return <h3 key={key} className="text-lg font-semibold mt-4">{line.replace(/\*\*/g, '')}</h3>;
            if (line.startsWith('− ') || line.match(/^\d\./)) {
                return <p key={key} className="ml-5">{line}</p>;
            }
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return <p key={key}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</p>;
        });
    };


    useEffect(() => {
        if (!policyId) {
            setError("Keine Richtlinien-ID gefunden.");
            setIsLoading(false);
            return;
        }

        const fetchPolicy = async () => {
            try {
                const data = await getSharedPolicy(policyId);
                if (!data) {
                    setError("Die angeforderte Richtlinie konnte nicht gefunden werden.");
                } else {
                    setPolicyData(data);
                }
            } catch (e) {
                console.error(e);
                setError("Fehler beim Laden der Richtlinie.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolicy();
    }, [policyId]);


    if (isLoading) {
         return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex-1 flex items-center justify-center p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Fehler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <FileText/> {policyData?.policy.title}
                                </CardTitle>
                                <CardDescription>
                                    Dieses Dokument wurde am {policyData?.createdAt ? new Date(policyData.createdAt.seconds * 1000).toLocaleDateString('de-DE') : ''} zur Ansicht und Gegenzeichnung geteilt.
                                </CardDescription>
                            </div>
                            <img src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp" alt="Logo" className="h-16 w-16" />
                        </div>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none">
                       {policyData && renderPolicyContent(policyData.policy.content)}
                    </CardContent>
                </Card>
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
