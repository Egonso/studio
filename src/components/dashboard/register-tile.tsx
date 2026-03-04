"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertCircle, Link2, Share2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface RegisterTileProps {
    projectId: string;
    useCaseCount: number;
    pendingReviewCount: number;
    onCaptureClick: () => void;
    onSupplierRequestClick?: () => void;
    onShareCaptureLinkClick?: () => void;
    utilitiesDisabled?: boolean;
    isSupplierLinkCopied?: boolean;
    isCaptureLinkCopied?: boolean;
}

export function RegisterTile({
    projectId,
    useCaseCount,
    pendingReviewCount,
    onCaptureClick,
    onSupplierRequestClick,
    onShareCaptureLinkClick,
    utilitiesDisabled = false,
    isSupplierLinkCopied = false,
    isCaptureLinkCopied = false,
}: RegisterTileProps) {
    const isEmpty = useCaseCount === 0;
    const registerHref = projectId ? `/my-register?projectId=${projectId}` : "/my-register";

    return (
        <Card className="shadow-md border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-950/50">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                    {/* Left: Title & Main CTA */}
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Image
                                    src="/register-logo.png"
                                    alt="Register Logo"
                                    width={24}
                                    height={24}
                                    className="h-6 w-6"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    AI Governance Register
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Dokumentieren Sie KI-Einsatzfälle revisionssicher und nachvollziehbar.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center gap-3">
                                <Link href={registerHref}>
                                    <Button className="shadow-sm">
                                        Register öffnen
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs text-muted-foreground"
                                    onClick={onCaptureClick}
                                >
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                    KI-Einsatzfall erfassen
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={`h-8 text-xs ${
                                        isSupplierLinkCopied
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "text-muted-foreground"
                                    }`}
                                    disabled={utilitiesDisabled}
                                    onClick={onSupplierRequestClick}
                                >
                                    {isSupplierLinkCopied ? (
                                        <Check className="mr-1.5 h-3.5 w-3.5" />
                                    ) : (
                                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {isSupplierLinkCopied ? "Link kopiert" : "Lieferant anfragen"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={`h-8 text-xs ${
                                        isCaptureLinkCopied
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "text-muted-foreground"
                                    }`}
                                    disabled={utilitiesDisabled}
                                    onClick={onShareCaptureLinkClick}
                                >
                                    {isCaptureLinkCopied ? (
                                        <Check className="mr-1.5 h-3.5 w-3.5" />
                                    ) : (
                                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {isCaptureLinkCopied ? "Link kopiert" : "Erfassungslink teilen"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats & Metadata */}
                    <div className="flex flex-col gap-3 min-w-[280px] border-l pl-0 md:pl-6 border-slate-100 dark:border-slate-800">
                        {isEmpty ? (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span className="leading-snug">
                                    Noch keine Einträge. Starten Sie jetzt mit Ihrer ersten Erfassung.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Dokumentiert:</span>
                                        <Badge variant="secondary" className="font-mono bg-slate-100 text-slate-700 hover:bg-slate-100">
                                            {useCaseCount} Use Case{useCaseCount !== 1 && 's'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Offene Prüfungen:</span>
                                        {pendingReviewCount > 0 ? (
                                            <Badge variant="secondary" className="font-mono">
                                                {pendingReviewCount} offen
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                Aktuell
                                            </span>
                                        )}
                                    </div>
                                </div>

                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
