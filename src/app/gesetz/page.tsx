import React from 'react';
import fs from 'fs';
import path from 'path';
import { LawData } from '@/types/law';
import { LawSidebar } from '@/components/law-viewer/sidebar';
import { LawContent } from '@/components/law-viewer/content';

// Server Component
async function getLawData(): Promise<LawData> {
    const filePath = path.join(process.cwd(), 'src/data/eu-ai-act.json');
    const fileContents = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContents);
}

export default async function GesetzPage() {
    const data = await getLawData();

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar - Hidden on mobile, sticky on desktop */}
                <aside className="hidden lg:block w-64 xl:w-80 flex-shrink-0">
                    <LawSidebar data={data} />
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <LawContent data={data} />
                </div>
            </div>
        </main>
    );
}
