import type { PolicyDocument } from "../types";
import {
    formatGovernanceDate,
    getPolicyLevelLabel,
    getPolicyStatusLabel,
    resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale?: string): string {
    try {
        return formatGovernanceDate(iso, locale);
    } catch {
        return iso;
    }
}

function stripMarkdown(md: string): string {
    return md
        .replace(/^#{1,3}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/^\* /gm, "• ")
        .replace(/^- /gm, "• ");
}

function generateFilename(doc: PolicyDocument, locale?: string): string {
    const date = formatDate(doc.metadata.updatedAt, locale).replace(/[/.]/g, "-");
    const prefix =
        resolveGovernanceCopyLocale(locale) === "de" ? "KI-Richtlinie" : "AI-Policy";
    return `${prefix}_Level${doc.level}_v${doc.metadata.version}_${date}.pdf`;
}

// ── PDF Generation ──────────────────────────────────────────────────────────

export async function generatePolicyPdf(
    doc: PolicyDocument,
    locale?: string,
): Promise<{ blob: Blob; filename: string }> {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 6;
    let y = 0;

    // ── Cover Page ──────────────────────────────────────────────────────
    y = 80;
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(doc.title, pageWidth / 2, y, { align: "center" });

    y += 15;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(
        `Level ${doc.level}: ${getPolicyLevelLabel(doc.level, locale)}`,
        pageWidth / 2,
        y,
        { align: "center" },
    );

    y += 10;
    pdf.setFontSize(11);
    if (doc.orgContextSnapshot.organisationName) {
        pdf.text(doc.orgContextSnapshot.organisationName, pageWidth / 2, y, {
            align: "center",
        });
        y += 7;
    }

    y += 5;
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(
        `Version ${doc.metadata.version} - Status: ${getPolicyStatusLabel(doc.status, locale)} - ${formatDate(doc.metadata.updatedAt, locale)}`,
        pageWidth / 2,
        y,
        { align: "center" },
    );
    pdf.setTextColor(0);

    // ── Table of Contents ──────────────────────────────────────────────
    pdf.addPage();
    y = margin;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(resolveGovernanceCopyLocale(locale) === "de" ? "Inhaltsverzeichnis" : "Table of Contents", margin, y);
    y += 10;

    const sorted = [...doc.sections].sort((a, b) => a.order - b.order);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    for (const section of sorted) {
        pdf.text(`${section.order}. ${section.title}`, margin + 5, y);
        y += lineHeight;
        if (y > 270) {
            pdf.addPage();
            y = margin;
        }
    }

    // ── Sections ───────────────────────────────────────────────────────
    for (const section of sorted) {
        pdf.addPage();
        y = margin;

        // Section title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${section.order}. ${section.title}`, margin, y);
        y += 8;

        // Conditional label
        if (section.isConditional && section.conditionLabel) {
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(100);
            pdf.text(`[${section.conditionLabel}]`, margin, y);
            pdf.setTextColor(0);
            y += 7;
        }

        // Section content
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const plain = stripMarkdown(section.content);
        const lines = pdf.splitTextToSize(plain, contentWidth);

        for (const line of lines) {
            if (y > 275) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += lineHeight - 1;
        }
    }

    // ── Footer on all pages ────────────────────────────────────────────
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `${doc.orgContextSnapshot.organisationName || "AI Policy"} - ${
                resolveGovernanceCopyLocale(locale) === "de" ? "Seite" : "Page"
            } ${i} ${
                resolveGovernanceCopyLocale(locale) === "de" ? "von" : "of"
            } ${totalPages}`,
            pageWidth / 2,
            290,
            { align: "center" },
        );
        pdf.setTextColor(0);
    }

    const filename = generateFilename(doc, locale);
    const blob = pdf.output("blob");
    return { blob, filename };
}

// ── Download Helper ──────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
