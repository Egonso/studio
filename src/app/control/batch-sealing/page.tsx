"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/context/auth-context";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { registerService } from "@/lib/register-first/register-service";
import type { UseCaseCard } from "@/lib/register-first/types";
import { BatchSealingView } from "@/components/control/batch-sealing-view";

export default function BatchSealingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    const loadData = useCallback(async () => {
        setIsDataLoading(true);
        setDataError(null);

        try {
            const registers = await registerService.listRegisters().catch(() => []);
            const register = registers[0] ?? null;
            const registerId = register?.registerId ?? null;

            if (registerId) {
                // Fetch all use cases that have not been soft deleted
                const cases = await registerService.listUseCases(registerId, { includeDeleted: false });
                setUseCases(cases);
            }
        } catch (error) {
            console.error("Failed to load use cases for sealing", error);
            setDataError("Fehler beim Laden der Einsatzfälle.");
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loading && user) {
            void loadData();
        }
    }, [loading, user, loadData]);

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle>Master-Siegel (Batch Sealing)</CardTitle>
                                <CardDescription>
                                    Überprüfen und versiegeln Sie mehrere KI-Systeme gleichzeitig als EUKI Officer.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/control">Zurück zu Control</Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/my-register">Zurück zum Register</Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    {isDataLoading && (
                        <Card>
                            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Einsatzfälle werden geladen...
                            </CardContent>
                        </Card>
                    )}

                    {dataError && (
                        <Card>
                            <CardContent className="py-6 text-sm text-destructive">{dataError}</CardContent>
                        </Card>
                    )}

                    {!isDataLoading && !dataError && (
                        <BatchSealingView useCases={useCases} onRefresh={loadData} />
                    )}
                </div>
            </main>
        </div>
    );
}
