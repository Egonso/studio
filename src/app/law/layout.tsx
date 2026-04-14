import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EU AI Act (Regulation (EU) 2024/1689) - Full Text',
    description: 'Read the full text of the EU AI Act (Regulation (EU) 2024/1689). Interactive and searchable.',
};

import { AppHeader } from "@/components/app-header";

export default function LawLayout({
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
