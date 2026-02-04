import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EU AI Act (EU-KI-Verordnung) - Volltext',
    description: 'Lesen Sie den vollständigen Text der EU-KI-Verordnung (EU AI Act). Interaktiv und durchsuchbar.',
};

export default function GesetzLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* The main layout usually includes the AppHeader from root layout. 
          Here we just provide the container for the page content. 
          The page.tsx will handle the grid layout for sidebar/content. */}
            {children}
        </div>
    );
}
