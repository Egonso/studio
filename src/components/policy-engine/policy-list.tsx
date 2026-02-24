"use client";

import { FileText, Plus, Clock } from "lucide-react";
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
    POLICY_LEVEL_LABELS,
    POLICY_STATUS_LABELS,
} from "@/lib/policy-engine/types";

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

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
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
    if (policies.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                    <div className="rounded-full bg-muted p-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="font-semibold">Keine Richtlinien vorhanden</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Erstellen Sie Ihre erste KI-Richtlinie mit der Smart Policy
                            Engine. Der Assistent führt Sie Schritt für Schritt.
                        </p>
                    </div>
                    <Button onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Neue Richtlinie erstellen
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">KI-Richtlinien</h2>
                <Button size="sm" onClick={onCreate}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Neue Richtlinie
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
                                    {POLICY_STATUS_LABELS[policy.status]}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center flex-wrap gap-2 text-xs">
                                <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-muted/50 border-none font-normal">
                                    Level {policy.level}
                                </Badge>
                                <Badge
                                    variant={statusVariant(policy.status)}
                                    className={`text-[10px] py-0 h-4 font-normal ${policy.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                            policy.status === 'review' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                ''
                                        }`}
                                >
                                    {POLICY_STATUS_LABELS[policy.status]}
                                </Badge>
                                <span>•</span>
                                <span>v{policy.metadata.version}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(policy.metadata.updatedAt)}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            <p className="text-xs text-muted-foreground">
                                {policy.sections.length} Abschnitte •{" "}
                                {policy.orgContextSnapshot.organisationName || "–"}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
