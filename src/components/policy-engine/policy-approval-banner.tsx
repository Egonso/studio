"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
    FileEdit,
    Send,
    CheckCircle,
    Clock,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { PolicyStatus, PolicyDocument } from "@/lib/policy-engine/types";
import {
    getPolicyStatusLabel,
    resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

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
    const locale = useLocale();
    const [isUpdating, setIsUpdating] = useState(false);
    const copy =
        resolveGovernanceCopyLocale(locale) === "de"
            ? {
                status: "Status",
                draftDescription:
                    "Dies ist Ihr aktueller Entwurf. Sobald der Text fertig ist, reichen Sie ihn zur internen Prüfung ein.",
                submitReview: "Zur Prüfung einreichen",
                waitingApproval: "Warten auf Genehmigung",
                reviewDescription:
                    "Die Richtlinie wird aktuell geprüft. Sie kann genehmigt werden, um sie als finalen Standard zu setzen.",
                revise: "Überarbeiten",
                approve: "Final genehmigen",
                active: "Operativ gültig",
                approvedDescription:
                    "Diese Richtlinie ist genehmigt und dient als Grundlage für die KI-Governance in Ihrer Organisation.",
                newVersion: "Neue Version entwerfen",
            }
            : {
                status: "Status",
                draftDescription:
                    "This is your current draft. Once the text is ready, submit it for internal review.",
                submitReview: "Submit for review",
                waitingApproval: "Waiting for approval",
                reviewDescription:
                    "The policy is currently under review. It can be approved to set it as the final standard.",
                revise: "Revise",
                approve: "Approve final",
                active: "Operationally valid",
                approvedDescription:
                    "This policy is approved and serves as the basis for AI governance in your organisation.",
                newVersion: "Draft new version",
            };

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
                                    {copy.status}: {getPolicyStatusLabel(status, locale)}
                                    <Badge variant="outline" className="font-normal text-[10px]">v{policy.metadata.version}</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    {copy.draftDescription}
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
                            {copy.submitReview}
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
                                    {copy.status}: {getPolicyStatusLabel(status, locale)}
                                    <Badge variant="outline" className="border-amber-300 text-amber-700 font-normal text-[10px]">{copy.waitingApproval}</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-amber-800/80 dark:text-amber-200/70">
                                    {copy.reviewDescription}
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
                                {copy.revise}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                onClick={() => handleAction("approved")}
                                disabled={isUpdating || !isAuthorised}
                            >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                {copy.approve}
                            </Button>
                        </div>
                    </Alert>
                );

            case "approved":
                return (
                    <Alert className="bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-900 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <AlertTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    {copy.status}: {getPolicyStatusLabel(status, locale)}
                                    <Badge variant="outline" className="border-gray-300 text-gray-700 font-normal text-[10px]">{copy.active}</Badge>
                                </AlertTitle>
                                <AlertDescription className="text-xs text-gray-800/80 dark:text-gray-200/70">
                                    {copy.approvedDescription}
                                </AlertDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-4 outline-gray-200 hover:bg-gray-100 text-gray-900"
                            onClick={() => handleAction("draft")}
                            disabled={isUpdating}
                        >
                            {copy.newVersion}
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
