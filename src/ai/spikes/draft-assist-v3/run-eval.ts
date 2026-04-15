import { config as loadDotEnv } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import toolsRegistry from "@/data/ai-tools-registry.json";
import type { CaptureInput } from "@/lib/register-first";
import type { CaptureUsageContext } from "@/lib/register-first/card-model";
import type { CanonicalAiActRiskClass } from "@/lib/register-first/risk-taxonomy";
import type { EuAiActRiskLevel } from "@/lib/register-first/tool-registry-types";

import {
  draftAssistSpikeEvalCases,
  type DraftAssistSpikeEvalCase,
} from "./eval-cases";
import type { DraftAssistSpikeDraft } from "./draft-assist-spike";

interface ToolRegistryEntry {
  toolId: string;
  productName: string;
  vendor: string;
  riskLevel: EuAiActRiskLevel;
}

interface MatchedToolInfo {
  toolId: string;
  productName: string;
  vendor: string;
  riskLevel: EuAiActRiskLevel;
}

interface CaseEvaluation {
  missingFactsCount: number;
  missingExpectedUsageContexts: CaptureUsageContext[];
  unexpectedSpecificSystems: string[];
  inventedCriticalFacts: boolean;
  riskMatch: boolean | null;
  reviewable: boolean;
}

interface CaseResult {
  caseId: string;
  title: string;
  sourceRefs: string[];
  draft: DraftAssistSpikeDraft;
  schemaValid: boolean;
  captureMappingValid: boolean;
  capturePreview: CaptureInput | null;
  matchedTool: MatchedToolInfo | null;
  riskSuggestion:
    | {
        suggestedRiskClass: CanonicalAiActRiskClass;
        signalStrength: string;
        reviewRecommended: boolean;
        openQuestions: string[];
        reasons: string[];
        sourceSignals: string[];
      }
    | null;
  evaluation: CaseEvaluation;
  error: string | null;
}

interface EvalSummary {
  totalCases: number;
  executedCases: number;
  schemaValidCount: number;
  captureMappingValidCount: number;
  reviewableCount: number;
  inventedCriticalFactsCount: number;
  exactRiskMatchCount: number;
}

interface EvalOutput {
  status:
    | "ok"
    | "blocked_missing_api_key"
    | "blocked_provider_key_rejected";
  generatedAt: string;
  model: string;
  outputPath: string;
  blockedReason?: string;
  summary: EvalSummary;
  cases: CaseResult[];
}

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = dirname(CURRENT_FILE);
const REPO_ROOT = resolve(CURRENT_DIR, "../../../../");
const OUTPUT_PATH = resolve(CURRENT_DIR, "eval-results.json");
const API_KEY_NAMES = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GENAI_API_KEY",
] as const;
const GENERIC_SYSTEM_LABELS = new Set([
  "nicht spezifiziertes ki system",
  "unbekanntes ki system",
  "ki system nicht spezifiziert",
]);

function normalizeUsageContext(
  value: string,
): CaptureUsageContext | null {
  switch (value) {
    case "INTERNAL_ONLY":
    case "EMPLOYEES":
    case "CUSTOMERS":
    case "APPLICANTS":
    case "PUBLIC":
      return value;
    case "EMPLOYEE_FACING":
      return "EMPLOYEES";
    case "CUSTOMER_FACING":
      return "CUSTOMERS";
    case "EXTERNAL_PUBLIC":
      return "PUBLIC";
    default:
      return null;
  }
}

interface EvalRuntimeModules {
  buildRegisterCaptureFromManifest: (
    manifestInput: unknown,
  ) => CaptureInput;
  parseStudioUseCaseManifest: (input: unknown) => unknown;
  parseCaptureInput: (input: unknown) => CaptureInput;
  suggestRiskClass: typeof import("@/lib/register-first").suggestRiskClass;
  generateDraftAssistSpike: (
    input: { description: string },
  ) => Promise<DraftAssistSpikeDraft>;
}

function loadEnvFiles() {
  loadDotEnv({ path: resolve(REPO_ROOT, ".env.local") });
  loadDotEnv({ path: resolve(REPO_ROOT, ".env") });
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasConfiguredApiKey(): boolean {
  return API_KEY_NAMES.some((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function writeOutputFile(payload: EvalOutput) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, serializeJson(payload), "utf8");
}

function printHelp() {
  console.log(`Draft Assist v3 Spike Runner

Usage:
  npx tsx src/ai/spikes/draft-assist-v3/run-eval.ts

What it does:
  - loads repo-near eval cases
  - calls the Draft Assist spike prompt
  - validates manifest mapping and capture mapping
  - calculates a deterministic risk suggestion
  - writes results to src/ai/spikes/draft-assist-v3/eval-results.json

Required model env:
  - GEMINI_API_KEY
  - or GOOGLE_API_KEY
  - or GOOGLE_GENAI_API_KEY
`);
}

async function loadRuntimeModules(): Promise<EvalRuntimeModules> {
  const [agentKitManifest, registerFirst, draftAssistSpike] = await Promise.all([
    import("@/lib/agent-kit/manifest"),
    import("@/lib/register-first"),
    import("./draft-assist-spike"),
  ]);

  return {
    buildRegisterCaptureFromManifest: (manifestInput) =>
      agentKitManifest.buildRegisterCaptureFromManifest(
        agentKitManifest.parseStudioUseCaseManifest(manifestInput),
      ),
    parseStudioUseCaseManifest: agentKitManifest.parseStudioUseCaseManifest,
    parseCaptureInput: registerFirst.parseCaptureInput,
    suggestRiskClass: registerFirst.suggestRiskClass,
    generateDraftAssistSpike: draftAssistSpike.generateDraftAssistSpike,
  };
}

function findMatchedTool(draft: DraftAssistSpikeDraft): MatchedToolInfo | null {
  const names = draft.systems.map((system) => normalizeText(system.name));

  for (const entry of toolsRegistry as ToolRegistryEntry[]) {
    const productName = normalizeText(entry.productName);
    const vendor = normalizeText(entry.vendor);
    const aliases = [
      productName,
      normalizeText(`${entry.productName} ${entry.vendor}`),
      vendor,
      normalizeText(`${entry.vendor} ${entry.productName}`),
    ];

    if (
      names.some((name) =>
        aliases.some(
          (alias) =>
            alias.length > 0 &&
            (name === alias || name.includes(alias) || alias.includes(name)),
        ),
      )
    ) {
      return {
        toolId: entry.toolId,
        productName: entry.productName,
        vendor: entry.vendor,
        riskLevel: entry.riskLevel,
      };
    }
  }

  return null;
}

function evaluateUnexpectedSystems(
  draft: DraftAssistSpikeDraft,
  testCase: DraftAssistSpikeEvalCase,
): string[] {
  const expectedSystems = new Set(
    (testCase.expected.systems ?? []).map((system) => normalizeText(system)),
  );
  const description = normalizeText(testCase.description);

  return draft.systems
    .map((system) => system.name.trim())
    .filter((systemName) => {
      const normalizedSystem = normalizeText(systemName);
      if (normalizedSystem.length === 0) return false;
      if (GENERIC_SYSTEM_LABELS.has(normalizedSystem)) return false;
      if (expectedSystems.has(normalizedSystem)) return false;
      return !description.includes(normalizedSystem);
    });
}

function computeEvaluation(
  testCase: DraftAssistSpikeEvalCase,
  draft: DraftAssistSpikeDraft,
  riskClass: CanonicalAiActRiskClass | null,
  schemaValid: boolean,
  captureMappingValid: boolean,
): CaseEvaluation {
  const missingFactsCount = draft.missingFacts?.length ?? 0;
  const usageContexts = new Set(
    draft.usageContexts
      .map((context) => normalizeUsageContext(context))
      .filter((context): context is CaptureUsageContext => context !== null),
  );
  const missingExpectedUsageContexts = (testCase.expected.usageContexts ?? [])
    .map((context) => normalizeUsageContext(context))
    .filter((context): context is CaptureUsageContext => context !== null)
    .filter((context) => !usageContexts.has(context));
  const unexpectedSpecificSystems = evaluateUnexpectedSystems(draft, testCase);
  const inventedCriticalFacts = unexpectedSpecificSystems.length > 0;
  const riskMatch = testCase.expected.riskClass
    ? riskClass === testCase.expected.riskClass
    : null;
  const reviewable =
    schemaValid &&
    captureMappingValid &&
    !inventedCriticalFacts &&
    missingFactsCount <= 3 &&
    (riskMatch !== false);

  return {
    missingFactsCount,
    missingExpectedUsageContexts,
    unexpectedSpecificSystems,
    inventedCriticalFacts,
    riskMatch,
    reviewable,
  };
}

async function runCase(
  testCase: DraftAssistSpikeEvalCase,
  runtime: EvalRuntimeModules,
): Promise<CaseResult> {
  let draft: DraftAssistSpikeDraft;

  try {
    draft = await runtime.generateDraftAssistSpike({
      description: testCase.description,
    });
  } catch (error) {
    return {
      caseId: testCase.id,
      title: testCase.title,
      sourceRefs: testCase.sourceRefs,
      draft: {
        documentationType: "application",
        title: testCase.title,
        purpose: testCase.description.slice(0, 500),
        ownerRole: "Unklar / fachliche Leitung",
        usageContexts: ["INTERNAL_ONLY"],
        systems: [{ position: 1, name: "Nicht spezifiziertes KI-System" }],
        confidence: "low",
      },
      schemaValid: false,
      captureMappingValid: false,
      capturePreview: null,
      matchedTool: null,
      riskSuggestion: null,
      evaluation: {
        missingFactsCount: 0,
        missingExpectedUsageContexts: testCase.expected.usageContexts ?? [],
        unexpectedSpecificSystems: [],
        inventedCriticalFacts: false,
        riskMatch: null,
        reviewable: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let schemaValid = false;
  let captureMappingValid = false;
  let capturePreview: CaptureInput | null = null;
  let error: string | null = null;

  try {
    const manifest = runtime.parseStudioUseCaseManifest(draft);
    schemaValid = true;
    const capture = runtime.buildRegisterCaptureFromManifest(manifest);
    capturePreview = runtime.parseCaptureInput(capture);
    captureMappingValid = true;
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : String(caughtError);
  }

  const matchedTool = findMatchedTool(draft);
  const riskSuggestion = capturePreview
    ? runtime.suggestRiskClass({
        purpose: capturePreview.purpose,
        usageContexts: capturePreview.usageContexts,
        decisionInfluence: capturePreview.decisionInfluence ?? null,
        dataCategories:
          capturePreview.dataCategories ??
          (capturePreview.dataCategory ? [capturePreview.dataCategory] : []),
        toolId: matchedTool?.toolId ?? capturePreview.toolId ?? null,
        toolFreeText: capturePreview.toolFreeText ?? draft.systems[0]?.name ?? null,
        toolRiskLevel: matchedTool?.riskLevel ?? null,
      })
    : null;
  const evaluation = computeEvaluation(
    testCase,
    draft,
    riskSuggestion?.suggestedRiskClass ?? null,
    schemaValid,
    captureMappingValid,
  );

  return {
    caseId: testCase.id,
    title: testCase.title,
    sourceRefs: testCase.sourceRefs,
    draft,
    schemaValid,
    captureMappingValid,
    capturePreview,
    matchedTool,
    riskSuggestion: riskSuggestion
      ? {
          suggestedRiskClass: riskSuggestion.suggestedRiskClass,
          signalStrength: riskSuggestion.signalStrength,
          reviewRecommended: riskSuggestion.reviewRecommended,
          openQuestions: riskSuggestion.openQuestions,
          reasons: riskSuggestion.reasons,
          sourceSignals: riskSuggestion.sourceSignals,
        }
      : null,
    evaluation,
    error,
  };
}

function summarize(results: CaseResult[]): EvalSummary {
  return {
    totalCases: results.length,
    executedCases: results.filter((result) => result.error === null).length,
    schemaValidCount: results.filter((result) => result.schemaValid).length,
    captureMappingValidCount: results.filter((result) => result.captureMappingValid).length,
    reviewableCount: results.filter((result) => result.evaluation.reviewable).length,
    inventedCriticalFactsCount: results.filter(
      (result) => result.evaluation.inventedCriticalFacts,
    ).length,
    exactRiskMatchCount: results.filter(
      (result) => result.evaluation.riskMatch === true,
    ).length,
  };
}

function detectBlockedReason(results: CaseResult[]): string | null {
  if (results.length === 0) {
    return null;
  }

  const errors = results
    .map((result) => result.error)
    .filter((error): error is string => typeof error === "string" && error.length > 0);

  if (errors.length !== results.length) {
    return null;
  }

  const leakedKeyErrors = errors.filter(
    (error) =>
      error.includes("reported as leaked") ||
      (error.includes("[403 Forbidden]") && error.includes("Please use another API key")),
  );

  if (leakedKeyErrors.length === results.length) {
    return "Provider rejected the configured Gemini/Google API key because it was reported as leaked.";
  }

  return null;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  loadEnvFiles();

  if (!hasConfiguredApiKey()) {
    const blockedPayload: EvalOutput = {
      status: "blocked_missing_api_key",
      generatedAt: new Date().toISOString(),
      model: "googleai/gemini-2.0-flash",
      outputPath: OUTPUT_PATH,
      blockedReason:
        "Missing GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY in the current environment.",
      summary: {
        totalCases: draftAssistSpikeEvalCases.length,
        executedCases: 0,
        schemaValidCount: 0,
        captureMappingValidCount: 0,
        reviewableCount: 0,
        inventedCriticalFactsCount: 0,
        exactRiskMatchCount: 0,
      },
      cases: [],
    };
    writeOutputFile(blockedPayload);
    console.error(blockedPayload.blockedReason);
    console.error(`Prepared blocked result file at ${OUTPUT_PATH}`);
    process.exitCode = 1;
      return;
  }

  const runtime = await loadRuntimeModules();
  const results: CaseResult[] = [];
  for (const testCase of draftAssistSpikeEvalCases) {
    results.push(await runCase(testCase, runtime));
  }

  const payload: EvalOutput = {
    status: "ok",
    generatedAt: new Date().toISOString(),
    model: "googleai/gemini-2.0-flash",
    outputPath: OUTPUT_PATH,
    summary: summarize(results),
    cases: results,
  };

  const providerBlockedReason = detectBlockedReason(results);
  if (providerBlockedReason) {
    payload.status = "blocked_provider_key_rejected";
    payload.blockedReason = providerBlockedReason;
  }

  writeOutputFile(payload);
  if (payload.status === "blocked_provider_key_rejected") {
    console.error(payload.blockedReason);
  }
  console.log(
    `Draft Assist v3 spike finished: ${payload.summary.reviewableCount}/${payload.summary.totalCases} reviewable.`,
  );
  console.log(`Results written to ${OUTPUT_PATH}`);
}

void main();
