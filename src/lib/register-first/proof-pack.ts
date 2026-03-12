import { ensureV1_1Shape } from "./migration";
import {
  resolvePrimaryDataCategory,
  type DataCategory,
  type UseCaseCard,
} from "./types";
import type { ToolType } from "./tool-registry-types";

export interface ProofPackDocument {
  schemaVersion: "1.0";
  generatedAt: string;
  useCaseId: string;
  status: "PROOF_READY";
  purpose: string;
  verifyLink: {
    url: string;
    isReal: boolean;
    isCurrent: boolean;
    scope: string;
  };
}

export interface ProofPackV11Document {
  schemaVersion: "1.1";
  generatedAt: string;
  globalUseCaseId: string;
  useCaseId: string;
  status: "PROOF_READY";
  purpose: string;
  tool: {
    toolId: string;
    vendor: string | null;
    productName: string | null;
    toolType: ToolType | null;
    freeText: string | null;
  };
  dataCategory: DataCategory;
  publicHashId: string | null;
  verifyLink: {
    url: string;
    isReal: boolean;
    isCurrent: boolean;
    scope: string;
  };
}

function toPdfAscii(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const textLines = lines.length > 0 ? lines : ["EUKI Proof Pack"];

  const textCommands = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...textLines.map((line, index) =>
      index === 0 ? `(${toPdfAscii(line)}) Tj` : `0 -16 Td (${toPdfAscii(line)}) Tj`
    ),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${textCommands.length} >>\nstream\n${textCommands}\nendstream\nendobj\n`,
  ];

  const encoder = new TextEncoder();
  let content = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(content).length);
    content += obj;
  }

  const xrefOffset = encoder.encode(content).length;
  content += `xref\n0 ${objects.length + 1}\n`;
  content += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    content += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  content += "trailer\n";
  content += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  content += "startxref\n";
  content += `${xrefOffset}\n`;
  content += "%%EOF\n";

  return encoder.encode(content);
}

export function createProofPackDocument(
  card: UseCaseCard,
  now: Date = new Date()
): ProofPackDocument {
  if (card.status !== "PROOF_READY") {
    throw new Error("Proof Pack requires status PROOF_READY.");
  }

  if (!card.proof) {
    throw new Error("Proof Pack requires verify-link metadata.");
  }

  return {
    schemaVersion: "1.0",
    generatedAt: now.toISOString(),
    useCaseId: card.useCaseId,
    status: "PROOF_READY",
    purpose: card.purpose,
    verifyLink: {
      url: card.proof.verifyUrl,
      isReal: card.proof.verification.isReal,
      isCurrent: card.proof.verification.isCurrent,
      scope: card.proof.verification.scope,
    },
  };
}

export interface ResolvedProofPackToolInfo {
  vendor?: string | null;
  productName?: string | null;
  toolType?: ToolType | null;
}

export function createProofPackV11Document(
  card: UseCaseCard,
  resolvedTool: ResolvedProofPackToolInfo = {},
  now: Date = new Date()
): ProofPackV11Document {
  const normalizedCard = ensureV1_1Shape(card);

  if (normalizedCard.status !== "PROOF_READY") {
    throw new Error("Proof Pack requires status PROOF_READY.");
  }

  if (!normalizedCard.proof) {
    throw new Error("Proof Pack requires verify-link metadata.");
  }

  return {
    schemaVersion: "1.1",
    generatedAt: now.toISOString(),
    globalUseCaseId: normalizedCard.globalUseCaseId ?? normalizedCard.useCaseId,
    useCaseId: normalizedCard.useCaseId,
    status: "PROOF_READY",
    purpose: normalizedCard.purpose,
    tool: {
      toolId: normalizedCard.toolId ?? "unknown",
      vendor: resolvedTool.vendor ?? null,
      productName: resolvedTool.productName ?? null,
      toolType: resolvedTool.toolType ?? null,
      freeText: normalizedCard.toolFreeText ?? null,
    },
    dataCategory:
      resolvePrimaryDataCategory(normalizedCard) ?? "INTERNAL_CONFIDENTIAL",
    publicHashId: normalizedCard.publicHashId ?? null,
    verifyLink: {
      url: normalizedCard.proof.verifyUrl,
      isReal: normalizedCard.proof.verification.isReal,
      isCurrent: normalizedCard.proof.verification.isCurrent,
      scope: normalizedCard.proof.verification.scope,
    },
  };
}

export function createProofPackPdfBlob(
  card: UseCaseCard,
  now: Date = new Date()
): Blob {
  const document = createProofPackDocument(card, now);
  const lines = [
    "EUKI Proof Pack",
    `Generated: ${document.generatedAt}`,
    `Use Case ID: ${document.useCaseId}`,
    `Status: ${document.status}`,
    `Purpose: ${document.purpose}`,
    "Verify Link",
    `URL: ${document.verifyLink.url}`,
    `Real: ${document.verifyLink.isReal ? "yes" : "no"}`,
    `Current: ${document.verifyLink.isCurrent ? "yes" : "no"}`,
    `Scope: ${document.verifyLink.scope}`,
  ];

  const pdfBytes = buildMinimalPdf(lines);
  return new Blob([pdfBytes], { type: "application/pdf" });
}

export function createProofPackV11PdfBlob(
  card: UseCaseCard,
  resolvedTool: ResolvedProofPackToolInfo = {},
  now: Date = new Date()
): Blob {
  const document = createProofPackV11Document(card, resolvedTool, now);
  const lines = [
    "EUKI Proof Pack v1.1",
    `Generated: ${document.generatedAt}`,
    `Global ID: ${document.globalUseCaseId}`,
    `Use Case ID: ${document.useCaseId}`,
    `Status: ${document.status}`,
    `Purpose: ${document.purpose}`,
    `Tool: ${document.tool.productName ?? document.tool.toolId}${document.tool.freeText ? ` (${document.tool.freeText})` : ""}`,
    `Data Category: ${document.dataCategory}`,
    "Verify Link",
    `URL: ${document.verifyLink.url}`,
    `Real: ${document.verifyLink.isReal ? "yes" : "no"}`,
    `Current: ${document.verifyLink.isCurrent ? "yes" : "no"}`,
    `Scope: ${document.verifyLink.scope}`,
  ];

  const pdfBytes = buildMinimalPdf(lines);
  return new Blob([pdfBytes], { type: "application/pdf" });
}

export function getProofPackPdfFileName(useCaseId: string): string {
  return `euki-proof-pack-${useCaseId}.pdf`;
}

export function getProofPackV11PdfFileName(globalUseCaseId: string): string {
  return `euki-proof-pack-v11-${globalUseCaseId}.pdf`;
}
