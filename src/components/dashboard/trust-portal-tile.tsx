"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Shield } from "lucide-react";
import { TrustPortalConfigDialog } from "@/components/trust-portal-config-dialog";
import type { TrustPortalConfig, ComplianceItem } from "@/lib/types";

interface TrustPortalTileProps {
    projectId: string;
    config: TrustPortalConfig | undefined;
    onConfigUpdate: (newConfig: TrustPortalConfig) => void;
    complianceData: {
        compliantCount: number;
        risksDocumented: boolean;
        policiesExist: boolean;
    };
}

export function TrustPortalTile({ projectId, config, onConfigUpdate, complianceData }: TrustPortalTileProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    // Trust Score Calculation
    const hasGovernanceStatement = config?.governanceStatement && config.governanceStatement.length > 20;
    const hasContactEmail = config?.contactEmail && config.contactEmail.includes('@');

    // Points: Base (40%) + Transparency (60%)
    const trustScore = Math.round(
        (complianceData.policiesExist ? 20 : 0) +
        (complianceData.risksDocumented ? 20 : 0) +
        (hasGovernanceStatement ? 40 : 0) +
        (hasContactEmail ? 20 : 0)
    );

    return (
        <section className="mb-8">
            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-200 dark:border-indigo-800 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Shield className="w-32 h-32 text-indigo-600" />
                </div>

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                    New Feature
                                </span>
                                {config?.isPublished && (
                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Published
                                    </span>
                                )}
                            </div>
                            <CardTitle className="text-2xl text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-indigo-600" />
                                AI Trust & Accountability Portal
                            </CardTitle>
                            <CardDescription className="text-indigo-900/70 dark:text-indigo-300/70 max-w-2xl">
                                Stellen Sie Transparenz her und bauen Sie Vertrauen auf. Erstellen Sie ein öffentliches Portal basierend auf Ihren Compliance-Daten.
                            </CardDescription>
                        </div>

                        <div className="text-right hidden sm:block z-10">
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Trust Readiness</span>
                            <div className="flex items-end justify-end gap-1">
                                <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                    {trustScore}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Globe className="mr-2 h-4 w-4" />
                            {config?.isPublished ? "Portal verwalten" : "Portal vorbereiten"}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                            disabled={!config?.isPublished}
                            onClick={() => window.open(`/trust/${projectId}`, '_blank')}
                            title={config?.isPublished ? "Öffentliches Portal ansehen" : "Erst veröffentlichen um anzusehen"}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Zum öffentlichen Portal
                        </Button>
                    </div>
                </CardContent>

                {/* Progress Bar Background */}
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-100 w-full dark:bg-indigo-900/30">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                        style={{ width: `${trustScore}%` }}
                    />
                </div>
            </Card>

            <TrustPortalConfigDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                currentConfig={config}
                projectId={projectId}
                onConfigSaved={(newConfig) => {
                    onConfigUpdate(newConfig);
                    // The dialog calls saveProjectData internally, but we update local state too
                }}
            />
        </section>
    );
}
