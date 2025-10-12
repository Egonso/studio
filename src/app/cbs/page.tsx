
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2, Wand2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyEditor } from '@/components/policy-editor';

function ComplianceInADayPageContent() {
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
                <div className="max-w-4xl mx-auto space-y-8">
                     <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                                        <Wand2 />
                                        Compliance-in-a-Day
                                    </CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        Erstellen Sie in wenigen Schritten eine verbindliche KI-Richtlinie für Ihr Unternehmen. Dieser Prozess hilft Ihnen, grundlegende Compliance-Anforderungen schnell und pragmatisch zu erfüllen.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <p>
                                Beginnen Sie mit der Selbsteinschätzung, um die passende Richtlinien-Vorlage für Ihr Unternehmen zu finden. Füllen Sie die markierten Felder aus und schon haben Sie ein Dokument, das Sie intern verwenden können. Gemeinsam mit dem Zertifizierungskurs kommen Sie so an nur einem Tag einen großen Schritt weiter.
                           </p>
                        </CardContent>
                    </Card>

                    <PolicyEditor />

                </div>
            </main>
        </div>
    );
}

export default function ComplianceInADayPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <ComplianceInADayPageContent />
        </Suspense>
    );
}

    
