import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EU AI Act (EU-KI-Verordnung) - Volltext',
    description: 'Lesen Sie den vollständigen Text der EU-KI-Verordnung (EU AI Act). Interaktiv und durchsuchbar.',
};

import { AppHeader } from "@/components/app-header";

export default function GesetzLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
