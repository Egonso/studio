"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { registerService } from "@/lib/register-first/register-service";
import type { UseCaseCard } from "@/lib/register-first/types";
import { useToast } from "@/hooks/use-toast";

interface BatchSealingViewProps {
    useCases: UseCaseCard[];
    onRefresh: () => Promise<void>;
}

export function BatchSealingView({ useCases, onRefresh }: BatchSealingViewProps) {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const { toast } = useToast();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSealing, setIsSealing] = useState(false);

    // We show only use cases that are NOT sealed yet, but are PROOF_READY or already have some content
    // actually, let's just show all unsealed and let the officer decide
    const unsealedUseCases = useCases.filter(uc => !uc.sealedAt);

    const toggleAll = () => {
        if (selectedIds.size === unsealedUseCases.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(unsealedUseCases.map((uc) => uc.useCaseId)));
        }
    };

    const toggleOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleBatchSeal = async () => {
        if (!profile?.isOfficer || !user || selectedIds.size === 0) return;

        setIsSealing(true);
        try {
            const promises = Array.from(selectedIds).map(id =>
                registerService.sealUseCaseManual({
                    useCaseId: id,
                    officerId: user.uid,
                    officerName: user.displayName || user.email || "EUKI Officer",
                })
            );

            await Promise.all(promises);

            toast({
                title: "Successfully sealed",
                description: `${selectedIds.size} use cases have been cryptographically sealed.`,
            });

            setSelectedIds(new Set());
            await onRefresh();
        } catch (error) {
            console.error("Batch sealing error", error);
            toast({
                variant: "destructive",
                title: "Sealing error",
                description: "Some use cases could not be sealed.",
            });
        } finally {
            setIsSealing(false);
        }
    };

    if (!profile?.isOfficer) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed text-slate-500">
                <ShieldCheck className="w-12 h-12 mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">Verified officers only</h3>
                <p className="mt-2 text-sm max-w-md">
                    The batch sealing function allows certified EUKI officers to approve and seal multiple use cases
                    simultaneously.
                </p>
            </div>
        );
    }

    if (unsealedUseCases.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                All current use cases in this register have already been sealed.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Select use cases to sign them collectively as "Legally reviewed".
                </p>
                <Button
                    onClick={handleBatchSeal}
                    disabled={isSealing || selectedIds.size === 0}
                    className="bg-slate-800 hover:bg-slate-700 text-white"
                >
                    {isSealing ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                    )}
                    {selectedIds.size} Use Case{selectedIds.size !== 1 && 's'} seal
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={
                                        unsealedUseCases.length > 0 &&
                                        selectedIds.size === unsealedUseCases.length
                                    }
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Use case / System</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created on</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unsealedUseCases.map((uc) => (
                            <TableRow key={uc.useCaseId}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(uc.useCaseId)}
                                        onCheckedChange={() => toggleOne(uc.useCaseId)}
                                        aria-label={`Use Case ${uc.purpose} select`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{uc.purpose || "No title"}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {uc.toolFreeText || uc.toolId || "Unknown system"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                                        {uc.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(uc.createdAt).toLocaleDateString("en-GB")}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
