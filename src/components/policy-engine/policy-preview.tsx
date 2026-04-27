"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronRight, Info, Printer, Sparkles, Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import type { PolicyDocument, PolicySection } from "@/lib/policy-engine/types";
import { generatePolicyPdf, downloadBlob } from "@/lib/policy-engine/export/policy-pdf";
import { renderPolicyMarkdown } from "@/lib/policy-engine/render-policy-markdown";
import { resolveGovernanceCopyLocale } from "@/lib/i18n/governance-copy";

interface PolicyPreviewProps {
    sections: PolicySection[];
    /** Provide full document to enable PDF export */
    document?: PolicyDocument;
    /** Allow print via window.print() */
    showPrintButton?: boolean;
    /** Callback when sections are updated (e.g. via AI) */
    onSectionsChange?: (sections: PolicySection[]) => void;
}

export function PolicyPreview({
    sections,
    document,
    showPrintButton = true,
    onSectionsChange,
}: PolicyPreviewProps) {
    const locale = useLocale();
    const { toast } = useToast();
    const { allowed: aiAllowed } = useCapability("policyEngine"); // Reusing policyEngine or could add specific 'aiSchreibhilfe'
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    // AI Schreibhilfe State
    const [improvingSections, setImprovingSections] = useState<Set<string>>(new Set());
    const [proposals, setProposals] = useState<Record<string, string>>({});
    const [localSections, setLocalSections] = useState<PolicySection[]>(sections);
    const copy =
        resolveGovernanceCopyLocale(locale) === "de"
            ? {
                proFeature: "Pro-Feature",
                aiUnavailable: "Die KI-Schreibhilfe ist im Pro-Plan verfügbar.",
                authRequired: "Anmeldung erforderlich.",
                industryFallback: "Wirtschaft",
                aiFailed: "KI-Verbesserung fehlgeschlagen",
                proposalGenerated: "Vorschlag generiert",
                proposalGeneratedDescription:
                    "Die KI hat eine defensivere Formulierung erstellt.",
                error: "Fehler",
                serviceUnavailable: "KI-Dienst nicht erreichbar.",
                applied: "Übernommen",
                appliedDescription:
                    "Der KI-Vorschlag wurde in das Dokument übernommen.",
                empty: "Keine Abschnitte vorhanden.",
                generating: "Generiere...",
                exportPdf: "PDF exportieren",
                print: "Drucken",
                aiTitle: "KI-Schreibhilfe: Defensiver formulieren",
                proposal: "KI-Vorschlag",
                apply: "Übernehmen",
                discard: "Verwerfen",
                originalDraft: "Originaler Entwurf:",
            }
            : {
                proFeature: "Pro feature",
                aiUnavailable: "The AI writing assistant is available on the Pro plan.",
                authRequired: "Sign-in required.",
                industryFallback: "General business",
                aiFailed: "AI improvement failed",
                proposalGenerated: "Proposal generated",
                proposalGeneratedDescription:
                    "The AI assistant created a more defensible wording.",
                error: "Error",
                serviceUnavailable: "AI service unavailable.",
                applied: "Applied",
                appliedDescription:
                    "The AI proposal was applied to the document.",
                empty: "No sections available.",
                generating: "Generating...",
                exportPdf: "Export PDF",
                print: "Print",
                aiTitle: "AI writing assistant: make more defensible",
                proposal: "AI proposal",
                apply: "Apply",
                discard: "Discard",
                originalDraft: "Original draft:",
            };

    useEffect(() => {
        setLocalSections(sections);
    }, [sections]);

    const toggle = (id: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePdfExport = async () => {
        if (!document) return;
        try {
            setIsExporting(true);
            const { blob, filename } = await generatePolicyPdf(document, locale);
            downloadBlob(blob, filename);
        } catch (err) {
            console.error("Failed to generate PDF", err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImproveSection = async (section: PolicySection) => {
        if (!aiAllowed) {
            toast({
                title: copy.proFeature,
                description: copy.aiUnavailable,
                variant: "destructive"
            });
            return;
        }

        try {
            setImprovingSections(prev => new Set(prev).add(section.sectionId));
            const { getFirebaseAuth } = await import("@/lib/firebase");
            const auth = await getFirebaseAuth();
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                throw new Error(copy.authRequired);
            }

            const res = await fetch("/api/policy/improve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    section,
                    registerId: document?.registerId,
                    orgName: document?.orgContextSnapshot?.organisationName,
                    industry: copy.industryFallback,
                    locale,
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || copy.aiFailed);

            setProposals(prev => ({ ...prev, [section.sectionId]: data.improvedContent }));

            // Auto-expand if it was collapsed to show result
            if (collapsed.has(section.sectionId)) {
                toggle(section.sectionId);
            }

            toast({
                title: copy.proposalGenerated,
                description: copy.proposalGeneratedDescription
            });

        } catch (err: any) {
            toast({
                title: copy.error,
                description: err.message || copy.serviceUnavailable,
                variant: "destructive"
            });
        } finally {
            setImprovingSections(prev => {
                const next = new Set(prev);
                next.delete(section.sectionId);
                return next;
            });
        }
    };

    const applyProposal = (sectionId: string) => {
        const proposal = proposals[sectionId];
        if (!proposal) return;

        const updatedSections = localSections.map(s =>
            s.sectionId === sectionId ? { ...s, content: proposal } : s
        );
        setLocalSections(updatedSections);
        onSectionsChange?.(updatedSections);

        // Clear proposal
        setProposals(prev => {
            const next = { ...prev };
            delete next[sectionId];
            return next;
        });

        toast({
            title: copy.applied,
            description: copy.appliedDescription
        });
    };

    const discardProposal = (sectionId: string) => {
        setProposals(prev => {
            const next = { ...prev };
            delete next[sectionId];
            return next;
        });
    };

    if (localSections.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                {copy.empty}
            </div>
        );
    }

    const sorted = [...localSections].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-3">
            <div className="flex justify-end gap-2">
                {document && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handlePdfExport()}
                        disabled={isExporting}
                    >
                        {isExporting ? copy.generating : copy.exportPdf}
                    </Button>
                )}
                {showPrintButton && (
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="mr-2 h-3.5 w-3.5" />
                        {copy.print}
                    </Button>
                )}
            </div>

            <div className="space-y-2 print:space-y-4">
                {sorted.map((section) => {
                    const isCollapsed = collapsed.has(section.sectionId);
                    const isImproving = improvingSections.has(section.sectionId);
                    const proposal = proposals[section.sectionId];

                    return (
                        <div
                            key={section.sectionId}
                            className={`rounded-lg border bg-card print:border-none print:rounded-none transition-all ${proposal ? "border-primary/50 shadow-sm ring-1 ring-primary/10" : ""
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-1 pr-3">
                                <button
                                    type="button"
                                    onClick={() => toggle(section.sectionId)}
                                    className="flex flex-1 items-center gap-2 p-2 text-left hover:bg-muted/30 rounded-md transition-colors print:hover:bg-transparent"
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 print:hidden" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 print:hidden" />
                                    )}
                                    <span className="font-medium text-sm">{section.title}</span>
                                    {section.isConditional && section.conditionLabel && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] gap-1 font-normal"
                                        >
                                            <Info className="h-2.5 w-2.5" />
                                            {section.conditionLabel}
                                        </Badge>
                                    )}
                                </button>

                                <div className="flex items-center gap-1 print:hidden">
                                    {!proposal && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => void handleImproveSection(section)}
                                            disabled={isImproving}
                                            title={copy.aiTitle}
                                        >
                                            {isImproving ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {!isCollapsed && (
                                <div className="px-3 pb-3 pl-9">
                                    {proposal ? (
                                        <div className="space-y-4">
                                            <div className="rounded bg-muted/50 p-3 text-xs italic border-l-2 border-primary">
                                                <div className="flex items-center justify-between mb-2 not-italic">
                                                    <span className="font-semibold text-[10px] uppercase tracking-wider text-primary">{copy.proposal}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px] bg-primary text-primary-foreground"
                                                            onClick={() => applyProposal(section.sectionId)}
                                                        >
                                                            <Check className="mr-1 h-3 w-3" /> {copy.apply}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px]"
                                                            onClick={() => discardProposal(section.sectionId)}
                                                        >
                                                            <X className="mr-1 h-3 w-3" /> {copy.discard}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div
                                                    className="prose prose-sm dark:prose-invert"
                                                    dangerouslySetInnerHTML={{
                                                        __html: renderPolicyMarkdown(proposal),
                                                    }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground"> {copy.originalDraft} </div>
                                            <div
                                                className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert opacity-50"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderPolicyMarkdown(section.content),
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert print:px-0 print:pl-0"
                                            dangerouslySetInnerHTML={{
                                                __html: renderPolicyMarkdown(section.content),
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
