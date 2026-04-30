"use client";

import { FileText, Plus, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { PolicyDocument } from "@/lib/policy-engine/types";
import {
    formatGovernanceDate,
    getPolicyStatusLabel,
    resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PolicyListViewProps {
    policies: PolicyDocument[];
    onSelect: (policyId: string) => void;
    onCreate: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(
    status: PolicyDocument["status"],
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "approved":
            return "default";
        case "review":
            return "secondary";
        case "draft":
            return "outline";
        case "archived":
            return "outline";
    }
}

function formatDate(iso: string, locale?: string): string {
    try {
        return formatGovernanceDate(iso, locale);
    } catch {
        return iso;
    }
}

// ── Component ───────────────────────────────────────────────────────────────

export function PolicyListView({
    policies,
    onSelect,
    onCreate,
}: PolicyListViewProps) {
    const locale = useLocale();
    const copy =
        resolveGovernanceCopyLocale(locale) === "de"
            ? {
                emptyTitle: "Keine Richtlinien vorhanden",
                emptyDescription:
                    "Erstellen Sie Ihre erste KI-Richtlinie mit der Smart Policy Engine. Der Assistent führt Sie Schritt für Schritt.",
                createFirst: "Neue Richtlinie erstellen",
                title: "KI-Richtlinien",
                create: "Neue Richtlinie",
                sections: "Abschnitte",
            }
            : {
                emptyTitle: "No policies yet",
                emptyDescription:
                    "Create your first AI policy with the Smart Policy Engine. The assistant guides you step by step.",
                createFirst: "Create new policy",
                title: "AI policies",
                create: "New policy",
                sections: "sections",
            };

    if (policies.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                    <div className="rounded-full bg-muted p-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="font-semibold">{copy.emptyTitle}</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {copy.emptyDescription}
                        </p>
                    </div>
                    <Button onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {copy.createFirst}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{copy.title}</h2>
                <Button size="sm" onClick={onCreate}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    {copy.create}
                </Button>
            </div>

            <div className="grid gap-3">
                {policies.map((policy) => (
                    <Card
                        key={policy.policyId}
                        className="cursor-pointer hover:border-foreground/30 transition-colors"
                        onClick={() => onSelect(policy.policyId)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{policy.title}</CardTitle>
                                <Badge variant={statusVariant(policy.status)}>
                                    {getPolicyStatusLabel(policy.status, locale)}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center flex-wrap gap-2 text-xs">
                                <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-muted/50 border-none font-normal">
                                    Level {policy.level}
                                </Badge>
                                <Badge
                                    variant={statusVariant(policy.status)}
                                    className={`text-[10px] py-0 h-4 font-normal ${policy.status === 'approved' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            policy.status === 'review' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                ''
                                        }`}
                                >
                                    {getPolicyStatusLabel(policy.status, locale)}
                                </Badge>
                                <span>•</span>
                                <span>v{policy.metadata.version}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(policy.metadata.updatedAt, locale)}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            <p className="text-xs text-muted-foreground">
                                {policy.sections.length} {copy.sections} •{" "}
                                {policy.orgContextSnapshot.organisationName || "–"}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
