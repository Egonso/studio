"use client";

import { useState } from "react";
import {
    FileEdit,
    Send,
    CheckCircle,
    AlertCircle,
    Clock,
    Loader2,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { PolicyStatus, PolicyDocument } from "@/lib/policy-engine/types";
import { POLICY_STATUS_LABELS } from "@/lib/policy-engine/types";

interface PolicyApprovalBannerProps {
    policy: PolicyDocument;
    onStatusChange: (nextStatus: PolicyStatus, note?: string) => Promise<void>;
    isAuthorised?: boolean; // e.g. Contact Person or Admin
}

export function PolicyApprovalBanner({
    policy,
    onStatusChange,
    isAuthorised = true,
}: PolicyApprovalBannerProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAction = async (nextStatus: PolicyStatus) => {
        try {
            setIsUpdating(true);
            await onStatusChange(nextStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    const status = policy.status;

    const renderContent = () => {
        switch (status) {
            case "draft":
                return (
                    <Alert className="bg-muted/50 border-none shadow-sm flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <FileEdit className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <AlertTitle className="text-sm font-semibold flex items-center gap-2">
                                    Status: {POLICY_STATUS_LABELS[status]}
                                    <Badge variant="outline" className="font-normal text-[10px]">v{policy.metadata.version}</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Dies ist Ihr aktueller Entwurf. Sobald der Text fertig ist, reichen Sie ihn zur internen Prüfung ein.
                                </AlertDescription>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="ml-4 shrink-0 gap-2"
                            onClick={() => handleAction("review")}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Zur Prüfung einreichen
                        </Button>
                    </Alert>
                );

            case "review":
                return (
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                    Status: {POLICY_STATUS_LABELS[status]}
                                    <Badge variant="outline" className="border-amber-300 text-amber-700 font-normal text-[10px]">Warten auf Genehmigung</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-amber-800/80 dark:text-amber-200/70">
                                    Die Richtlinie wird aktuell geprüft. Sie kann genehmigt werden, um sie als finalen Standard zu setzen.
                                </AlertDescription>
                            </div>
                        </div>

                        <div className="flex gap-2 ml-4 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-200 hover:bg-amber-100 text-amber-900"
                                onClick={() => handleAction("draft")}
                                disabled={isUpdating}
                            >
                                Überarbeiten
                            </Button>
                            <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                onClick={() => handleAction("approved")}
                                disabled={isUpdating || !isAuthorised}
                            >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                Final Genehmigen
                            </Button>
                        </div>
                    </Alert>
                );

            case "approved":
                return (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <AlertTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                                    Status: {POLICY_STATUS_LABELS[status]}
                                    <Badge variant="outline" className="border-green-300 text-green-700 font-normal text-[10px]">Operativ Gültig</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-green-800/80 dark:text-green-200/70">
                                    Diese Richtlinie ist genehmigt und dient als Grundlage für die KI-Governance in Ihrer Organisation.
                                </AlertDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-4 outline-green-200 hover:bg-green-100 text-green-900"
                            onClick={() => handleAction("draft")}
                            disabled={isUpdating}
                        >
                            Neue Version entwerfen
                        </Button>
                    </Alert>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            {renderContent()}
        </div>
    );
}
