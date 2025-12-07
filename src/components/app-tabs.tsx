
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GanttChartSquare, ListChecks, Sparkles, Wand2, BookOpen, GraduationCap } from 'lucide-react';

export function AppTabs() {
    const router = useRouter();
    const pathname = usePathname();

    const getActiveTab = () => {
        if (pathname.startsWith('/cbs')) return 'cbs';
        if (pathname.startsWith('/kurs')) return 'kurs';
        if (pathname.startsWith('/exam')) return 'exam';
        // Add more specific paths if needed, e.g. /ai-management
        if (pathname.startsWith('/ai-management')) return 'ai-management';
        if (pathname.startsWith('/dashboard')) return 'dashboard'; // Default to dashboard for related pages
        return 'dashboard';
    };

    const activeTab = getActiveTab();

    const handleTabChange = (value: string) => {
        if (value === 'dashboard') {
            router.push('/dashboard');
        } else {
            router.push(`/${value}`);
        }
    };

    // A simplified mapping for the dashboard tabs
    const dashboardTabMapping: Record<string, string> = {
        'compliance-status': 'dashboard',
        'ai-act-duties': 'dashboard',
        'ai-management': 'dashboard',
        'cbs': 'cbs',
        'kurs': 'kurs',
        'exam': 'exam',
    };
    
    // Determine which tab should be active on the UI
    const uiActiveTab = dashboardTabMapping[activeTab] || activeTab;


    return (
        <Tabs value={uiActiveTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="dashboard" disabled={activeTab === 'dashboard'}>
                    <GanttChartSquare className="mr-2 h-4 w-4" />
                    Dashboard
                </TabsTrigger>
                <TabsTrigger value="cbs">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Compliance-in-a-Day
                </TabsTrigger>
                <TabsTrigger value="kurs">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Kurs
                </TabsTrigger>
                <TabsTrigger value="exam">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Zertifizierung
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
