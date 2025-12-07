
'use client';

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ExamCard } from "@/components/exam-card";
import { AppTabs } from "@/components/app-tabs";


export default function ExamPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return null;
    }


    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto mb-8">
                    <AppTabs />
                </div>
                <div className="flex items-center justify-center">
                    <ExamCard />
                </div>
            </main>
        </div>
    );
}

    
