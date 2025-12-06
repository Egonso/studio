
'use client';

import { Suspense } from 'react';
import { AppHeader } from '@/components/app-header';
import { Loader2, Download } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AimsExportDialog } from '@/components/aims-export-dialog';

function AiManagementPageContent() {
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
                                    <CardTitle className="text-3xl font-bold text-primary">
                                        AI Management System (ISO 42001)
                                    </CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        Hier verwalten und exportieren Sie die Dokumentation Ihres AI Management Systems.
                                    </CardDescription>
                                </div>
                                 <AimsExportDialog />
                            </div>
                        </CardHeader>
                        <CardContent>
                           <p>
                                Die hier gesammelten Informationen bilden die Grundlage für ein auditierbares Managementsystem. Sie können die Daten jederzeit als strukturierte Text- oder JSON-Datei exportieren, um sie in internen Systemen weiterzuverarbeiten.
                           </p>
                        </CardContent>
                    </Card>
                    
                    {/* Placeholder for future content */}
                    <Card>
                        <CardHeader><CardTitle>Detailansicht</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">In zukünftigen Versionen werden Sie hier eine detaillierte Ansicht und Bearbeitungsmöglichkeiten für die einzelnen Bereiche Ihres AI Management Systems finden.</p>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}

export default function AiManagementPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <AiManagementPageContent />
        </Suspense>
    );
}
