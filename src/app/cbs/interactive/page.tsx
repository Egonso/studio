
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ScalingCoach } from '@/components/scaling-coach';

function InteractiveCoachingPageContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    if (authLoading || !user) {
        // AuthProvider already shows a loader, and redirects if not logged in.
        // Returning null prevents flicker.
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1">
                <ScalingCoach />
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
