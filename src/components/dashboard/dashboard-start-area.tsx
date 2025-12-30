import React from 'react';
import { ProjectCreationWizard } from '@/components/wizard/project-creation-wizard';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function DashboardStartArea() {
    const router = useRouter();

    const handleProjectCreated = (projectId: string) => {
        // Redirect to the project dashboard
        router.push(`/dashboard?projectId=${projectId}`);
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 md:px-8 bg-muted/10 min-h-[80vh]">
            <div className="mb-8 text-center space-y-4 max-w-2xl">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <Image
                            src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp"
                            alt="Logo"
                            width={50}
                            height={50}
                            className="h-12 w-auto opacity-80"
                        />
                    </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    Willkommen beim AI Act Compass
                </h1>
                <p className="text-lg text-muted-foreground">
                    Der einfachste Weg zur Compliance. Starten Sie jetzt Ihre erste Bewertung – wir führen Sie Schritt für Schritt durch den Prozess.
                </p>
            </div>

            <ProjectCreationWizard
                variant="embedded"
                onComplete={handleProjectCreated}
            />
        </div>
    );
}
