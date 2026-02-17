"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, PlusCircle, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface RegisterTileProps {
    projectId: string;
    useCaseCount: number;
    pendingReviewCount: number;
    onCaptureClick: () => void;
}

export function RegisterTile({
    projectId,
    useCaseCount,
    pendingReviewCount,
    onCaptureClick,
}: RegisterTileProps) {
    const isEmpty = useCaseCount === 0;

    return (
        <Card className="shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">AI Use Register</CardTitle>
                            <CardDescription>
                                Erfassen, prüfen und verwalten Sie KI-Anwendungen (Use Cases).
                            </CardDescription>
                        </div>
                    </div>
                    {!isEmpty && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="font-mono">
                                {useCaseCount} Use Case{useCaseCount !== 1 ? "s" : ""}
                            </Badge>
                            {pendingReviewCount > 0 && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                    {pendingReviewCount} Prüfung{pendingReviewCount !== 1 ? "en" : ""} ausstehend
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEmpty && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Noch keine KI-Anwendungen erfasst. Starten Sie mit einem Use Case,
                            damit Dokumentation und weitere Schritte sinnvoll werden.
                        </p>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Button onClick={onCaptureClick} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        KI-Anwendung erfassen
                    </Button>
                    <Link href={`/register?projectId=${projectId}`}>
                        <Button variant="outline" className="gap-2">
                            Register öffnen
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
