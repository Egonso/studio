import { z } from "zod";
import { DATA_CATEGORIES } from "./card-model";

export { DATA_CATEGORIES };

// ── Tool Type Enum ──────────────────────────────────────────────────────────
export const TOOL_TYPES = [
  "LLM",
  "GENAI_SUITE",
  "CODE_ASSISTANT",
  "IMAGE_GEN",
  "VIDEO_GEN",
  "AUDIO_GEN",
  "TRANSLATION",
  "SEARCH",
  "AUTOMATION",
  "OCR",
  "RPA",
  "OTHER",
] as const;

export type ToolType = (typeof TOOL_TYPES)[number];

// DataCategory type is canonically defined in ./types.ts
// DATA_CATEGORIES const and dataCategorySchema are kept here for Zod validation.
// Do NOT re-export DataCategory here – it comes from ./types via index.ts.

// ── Tool Registry Entry ─────────────────────────────────────────────────────
export interface ToolRegistryEntry {
  toolId: string;
  vendor: string;
  productName: string;
  toolType: ToolType;
  homepage: string | null;
  isActive: boolean;
  createdAtISO: string;
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────
export const toolTypeSchema = z.enum(TOOL_TYPES);
export const dataCategorySchema = z.enum(DATA_CATEGORIES);

export const toolRegistryEntrySchema = z.object({
  toolId: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "toolId must be lowercase alphanumeric with underscores"),
  vendor: z.string().min(1).max(200),
  productName: z.string().min(1).max(200),
  toolType: toolTypeSchema,
  homepage: z.string().url().nullable(),
  isActive: z.boolean(),
  createdAtISO: z.string().datetime(),
});

export function parseToolRegistryEntry(input: unknown): ToolRegistryEntry {
  return toolRegistryEntrySchema.parse(input);
}

// ── Slug Generator ──────────────────────────────────────────────────────────
/**
 * Generates a deterministic toolId slug from a product name.
 * Examples:
 *   "ChatGPT (OpenAI)" → "chatgpt_openai"
 *   "Microsoft Copilot" → "microsoft_copilot"
 *   "Meta Llama (self-hosted)" → "meta_llama_self_hosted"
 */
export function toToolSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

// ── EU AI Act Risk Levels ───────────────────────────────────────────────────
export const EU_AI_ACT_RISK_LEVELS = [
  "minimal",
  "limited",
  "high",
  "unacceptable",
] as const;

export type EuAiActRiskLevel = (typeof EU_AI_ACT_RISK_LEVELS)[number];

export const EU_AI_ACT_CATEGORIES = [
  "general_purpose_ai",
  "limited_risk",
  "high_risk",
  "prohibited",
] as const;

export type EuAiActCategory = (typeof EU_AI_ACT_CATEGORIES)[number];

export const riskLevelLabels: Record<EuAiActRiskLevel, string> = {
  minimal: "Minimales Risiko",
  limited: "Begrenztes Risiko",
  high: "Hohes Risiko",
  unacceptable: "Unannehmbares Risiko",
};

export const riskLevelColors: Record<EuAiActRiskLevel, string> = {
  minimal: "bg-gray-100 text-gray-800",
  limited: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  unacceptable: "bg-red-100 text-red-800",
};

// ── AI Tools Registry Entry (with EU AI Act metadata) ───────────────────────
export interface AiToolsRegistryEntry {
  toolId: string;
  productName: string;
  vendor: string;
  category: ToolType;
  homepage: string | null;
  riskLevel: EuAiActRiskLevel;
  gdprCompliant: boolean;
  euAiActCategory: EuAiActCategory;
  description: string;
}

// ── OTHER sentinel ──────────────────────────────────────────────────────────
export const TOOL_ID_OTHER = "other" as const;
