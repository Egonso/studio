
'use client';

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ExamCard } from "@/components/exam-card";


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
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <ExamCard />
            </main>
        </div>
    );
}
