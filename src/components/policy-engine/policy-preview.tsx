"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PolicySection } from "@/lib/policy-engine/types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PolicyPreviewProps {
    sections: PolicySection[];
    /** Allow print via window.print() */
    showPrintButton?: boolean;
}

// ── Minimal Markdown Renderer ────────────────────────────────────────────────

function renderMarkdown(md: string): string {
    return md
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\n{2,}/g, '<div class="h-3"></div>')
        .replace(/\n/g, "<br />");
}

// ── Component ───────────────────────────────────────────────────────────────

export function PolicyPreview({
    sections,
    showPrintButton = true,
}: PolicyPreviewProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

    if (sections.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                Keine Abschnitte vorhanden.
            </div>
        );
    }

    const sorted = [...sections].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-3">
            {showPrintButton && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="mr-2 h-3.5 w-3.5" />
                        Drucken
                    </Button>
                </div>
            )}

            <div className="space-y-2 print:space-y-4">
                {sorted.map((section) => {
                    const isCollapsed = collapsed.has(section.sectionId);
                    return (
                        <div
                            key={section.sectionId}
                            className="rounded-lg border bg-card print:border-none print:rounded-none"
                        >
                            {/* Header */}
                            <button
                                type="button"
                                onClick={() => toggle(section.sectionId)}
                                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors print:hover:bg-transparent"
                            >
                                <div className="flex items-center gap-2">
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
                                </div>
                            </button>

                            {/* Content */}
                            {!isCollapsed && (
                                <div
                                    className="px-3 pb-3 pl-9 text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert print:px-0 print:pl-0"
                                    dangerouslySetInnerHTML={{
                                        __html: renderMarkdown(section.content),
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
