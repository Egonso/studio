#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

const DOCUMENT_TYPES = ["application", "process", "workflow"];
const STATUS_VALUES = ["draft", "active", "archived"];
const USAGE_CONTEXT_VALUES = [
  "INTERNAL_ONLY",
  "EMPLOYEES",
  "CUSTOMERS",
  "APPLICANTS",
  "PUBLIC",
];
const DATA_CATEGORY_VALUES = [
  "NO_PERSONAL_DATA",
  "PERSONAL_DATA",
  "SPECIAL_PERSONAL",
  "INTERNAL_CONFIDENTIAL",
  "PUBLIC_DATA",
  "HEALTH_DATA",
  "BIOMETRIC_DATA",
  "POLITICAL_RELIGIOUS",
  "OTHER_SENSITIVE",
];
const DECISION_INFLUENCE_VALUES = [
  "ASSISTANCE",
  "PREPARATION",
  "AUTOMATED",
];
const CONNECTION_MODE_VALUES = [
  "MANUAL_SEQUENCE",
  "SEMI_AUTOMATED",
  "FULLY_AUTOMATED",
];
const AUTOPILOT_CADENCE_VALUES = [
  "manual",
  "daily",
  "every-3-days",
  "weekly",
];
const AUTOPILOT_MODE_VALUES = [
  "draft-only",
  "review-first",
  "submit-after-confirmation",
];
const AI_DEPENDENCY_HINTS = new Set([
  "@ai-sdk/openai",
  "@anthropic-ai/sdk",
  "@genkit-ai/firebase",
  "@genkit-ai/googleai",
  "@genkit-ai/next",
  "@langchain/openai",
  "ai",
  "genkit",
  "langchain",
  "openai",
]);

const DEFAULT_OUT_DIR = path.join("docs", "agent-workflows");
const DEFAULT_SUBMIT_ENDPOINT = "https://kiregister.com/api/agent-kit/submit";
const DEFAULT_OPERATOR_ENDPOINT = "https://kiregister.com/api/agent/operator";
const CONFIG_DIR_NAME = ".studio-agent";
const CONFIG_FILE_NAME = "config.json";
const REGISTER_USE_CASE_STATUS_VALUES = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];
const AGENT_CANDIDATE_STATUS_VALUES = [
  "needs_review",
  "accepted",
  "rejected",
  "merged",
];

const USAGE_CONTEXT_ALIASES = Object.freeze({
  internal: "INTERNAL_ONLY",
  internal_only: "INTERNAL_ONLY",
  employees: "EMPLOYEES",
  employee_facing: "EMPLOYEES",
  customers: "CUSTOMERS",
  customer_facing: "CUSTOMERS",
  applicants: "APPLICANTS",
  public: "PUBLIC",
  external_public: "PUBLIC",
});

const DATA_CATEGORY_ALIASES = Object.freeze({
  none: "NO_PERSONAL_DATA",
  no_personal_data: "NO_PERSONAL_DATA",
  personal: "PERSONAL_DATA",
  personal_data: "PERSONAL_DATA",
  special: "SPECIAL_PERSONAL",
  special_personal: "SPECIAL_PERSONAL",
  sensitive: "SPECIAL_PERSONAL",
  internal: "INTERNAL_CONFIDENTIAL",
  internal_confidential: "INTERNAL_CONFIDENTIAL",
  public: "PUBLIC_DATA",
  public_data: "PUBLIC_DATA",
  health: "HEALTH_DATA",
  health_data: "HEALTH_DATA",
  biometric: "BIOMETRIC_DATA",
  biometric_data: "BIOMETRIC_DATA",
  political: "POLITICAL_RELIGIOUS",
  political_religious: "POLITICAL_RELIGIOUS",
  other_sensitive: "OTHER_SENSITIVE",
});

const DECISION_INFLUENCE_ALIASES = Object.freeze({
  assistance: "ASSISTANCE",
  assist: "ASSISTANCE",
  preparation: "PREPARATION",
  prepare: "PREPARATION",
  automated: "AUTOMATED",
  auto: "AUTOMATED",
});

const CONNECTION_MODE_ALIASES = Object.freeze({
  manual: "MANUAL_SEQUENCE",
  manual_sequence: "MANUAL_SEQUENCE",
  semi: "SEMI_AUTOMATED",
  semi_automated: "SEMI_AUTOMATED",
  full: "FULLY_AUTOMATED",
  fully_automated: "FULLY_AUTOMATED",
});

function printHelp() {
  const lines = [
    "studio-agent",
    "",
    "Document AI applications, processes, and workflows in a portable agent format.",
    "",
    "Commands:",
    "  onboard                 Save local defaults for low-friction capture",
    "  capture                 Low-friction create flow for work done during coding",
    "  interview               Guided interview for a detailed new workflow",
    "  create                  Create docs from --input JSON or direct flags",
    "  validate <manifest>     Validate an existing manifest.json",
    "  submit <manifest>       Submit a manifest.json directly to KI-Register",
    "  operator registers      List registers visible to a read-only Operator key",
    "  operator use-cases      List use cases in the configured register",
    "  operator use-case <id>  Read one use case from the configured register",
    "  operator candidates     List candidate review objects in a register",
    "  operator candidate <id> Read one candidate review object",
    "  operator candidate submit <manifest> Submit a manifest as a review candidate",
    "  autopilot plan          Draft a local KI-Register Autopilot run policy",
    "  autopilot run           Run the local draft-only Autopilot against allowed sources",
    "  list                    List generated workflow folders",
    "  template                Print a starter manifest template",
    "  help                    Show this help text",
    "",
    "Examples:",
    "  studio-agent onboard",
    "  studio-agent capture --title \"Marketing assistant\" --systems \"HubSpot, Claude\"",
    "  studio-agent create --input ./examples/sample-use-case.json --out-dir ./docs/agent-workflows",
    "  studio-agent validate ./docs/agent-workflows/marketing-assistant/manifest.json",
    "  studio-agent submit ./docs/agent-workflows/marketing-assistant/manifest.json --register-id reg_123",
    "  studio-agent operator registers --json",
    "  studio-agent operator use-cases --register-id reg_123 --json",
    "  studio-agent operator use-case uc_123 --register-id reg_123 --json",
    "  studio-agent operator candidate submit ./docs/agent-workflows/marketing-assistant/manifest.json --register-id reg_123",
    "  studio-agent autopilot plan --cadence every-3-days --out-file ./autopilot-plan.json",
    "  studio-agent autopilot run --policy ./autopilot-plan.json",
    "",
    "Common flags:",
    "  --out-dir <path>        Target folder for generated workflow docs",
    "  --json                  Emit machine-readable JSON output",
    "  --force                 Overwrite an existing slug folder",
    "  --yes                   Skip the final confirmation prompt",
    "  --register-id <id>      Target KI-Register register id for submit",
    "  --endpoint <url>        Agent Kit submit API endpoint",
    "  --operator-endpoint <url> Agent Operator API base endpoint",
    "  --api-key <value>       Agent Kit API key (or use KI_REGISTER_API_KEY)",
    "  --status <value>        Optional operator use-case or candidate status filter",
    "  --search-text <value>   Optional operator use-case text filter",
    "  --limit <number>        Optional operator use-case list limit",
    "  --cadence <value>       Autopilot cadence: manual, daily, every-3-days, weekly",
    "  --mode <value>          Autopilot mode: draft-only, review-first, submit-after-confirmation",
    "  --sources <list>        Comma-separated read sources for Autopilot planning",
    "  --policy <file>         Autopilot policy file for local runs",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

function parseArgs(rawArgs) {
  const flags = {};
  const positionals = [];
  const booleanFlags = new Set([
    "json",
    "force",
    "help",
    "yes",
    "confirm",
  ]);

  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");

    if (equalsIndex >= 0) {
      const key = withoutPrefix.slice(0, equalsIndex);
      const value = withoutPrefix.slice(equalsIndex + 1);
      flags[key] = value;
      continue;
    }

    if (booleanFlags.has(withoutPrefix)) {
      flags[withoutPrefix] = true;
      continue;
    }

    const nextValue = rawArgs[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for --${withoutPrefix}`);
    }

    flags[withoutPrefix] = nextValue;
    index += 1;
  }

  return { flags, positionals };
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStringList(value) {
  const rawValues = Array.isArray(value)
    ? value
    : normalizeText(typeof value === "number" ? String(value) : value)
      ?.split(/[\n,;|]/g) ?? [];

  return [...new Set(
    rawValues
      .map((entry) => normalizeText(String(entry)))
      .filter((entry) => Boolean(entry)),
  )];
}

function slugify(value) {
  const input = normalizeText(value) ?? "untitled";
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80) || "untitled";
}

function randomIdSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeEnum(value, allowedValues, aliases = {}) {
  const direct = normalizeText(value);
  if (!direct) {
    return undefined;
  }

  if (allowedValues.includes(direct)) {
    return direct;
  }

  const aliasKey = direct.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const mapped = aliases[aliasKey];
  return allowedValues.includes(mapped) ? mapped : undefined;
}

function normalizeEnumList(value, allowedValues, aliases = {}) {
  return [...new Set(
    normalizeStringList(value)
      .map((entry) => normalizeEnum(entry, allowedValues, aliases))
      .filter((entry) => Boolean(entry)),
  )];
}

function toBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value);
  if (!normalized) {
    return defaultValue;
  }

  const lowered = normalized.toLowerCase();
  if (["true", "yes", "y", "1"].includes(lowered)) {
    return true;
  }

  if (["false", "no", "n", "0"].includes(lowered)) {
    return false;
  }

  return defaultValue;
}

function ensureDirectory(targetPath) {
  mkdirSync(targetPath, { recursive: true });
}

function resolveOutputDirectory(outDirFlag) {
  return path.resolve(process.cwd(), outDirFlag ?? DEFAULT_OUT_DIR);
}

function deriveOperatorEndpoint(submitEndpoint) {
  const endpoint = normalizeText(submitEndpoint);
  if (!endpoint) {
    return DEFAULT_OPERATOR_ENDPOINT;
  }

  return endpoint.replace(/\/api\/agent-kit\/submit\/?$/u, "/api/agent/operator");
}

function resolveConfigPath(cwd = process.cwd()) {
  return path.join(cwd, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function loadConfig(cwd = process.cwd()) {
  const configPath = resolveConfigPath(cwd);
  if (!existsSync(configPath)) {
    return null;
  }

  const rawConfig = readJsonFile(configPath);
  return normalizeConfig(rawConfig);
}

function normalizeConfig(config) {
  const raw = config && typeof config === "object" ? config : {};
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0.0",
    createdAt: normalizeText(raw.createdAt) ?? now,
    updatedAt: now,
    profile: {
      name: normalizeText(raw.profile?.name),
      role: normalizeText(raw.profile?.role),
      team: normalizeText(raw.profile?.team),
      contactPersonName: normalizeText(raw.profile?.contactPersonName),
    },
    defaults: {
      outDir: normalizeText(raw.defaults?.outDir) ?? DEFAULT_OUT_DIR,
      ownerRole: normalizeText(raw.defaults?.ownerRole) ?? normalizeText(raw.profile?.role),
      documentationType:
        normalizeEnum(raw.defaults?.documentationType, DOCUMENT_TYPES) ??
        "application",
      usageContexts:
        normalizeEnumList(
          raw.defaults?.usageContexts,
          USAGE_CONTEXT_VALUES,
          USAGE_CONTEXT_ALIASES,
        ) || [],
      decisionInfluence: normalizeEnum(
        raw.defaults?.decisionInfluence,
        DECISION_INFLUENCE_VALUES,
        DECISION_INFLUENCE_ALIASES,
      ),
      dataCategories: normalizeEnumList(
        raw.defaults?.dataCategories,
        DATA_CATEGORY_VALUES,
        DATA_CATEGORY_ALIASES,
      ),
      connectionMode: normalizeEnum(
        raw.defaults?.connectionMode,
        CONNECTION_MODE_VALUES,
        CONNECTION_MODE_ALIASES,
      ),
      confirmBeforeWrite:
        raw.defaults?.confirmBeforeWrite === undefined
          ? true
          : Boolean(raw.defaults.confirmBeforeWrite),
    },
    submission: {
      endpoint:
        normalizeText(raw.submission?.endpoint) ?? DEFAULT_SUBMIT_ENDPOINT,
      operatorEndpoint:
        normalizeText(raw.submission?.operatorEndpoint) ??
        deriveOperatorEndpoint(
          normalizeText(raw.submission?.endpoint) ?? DEFAULT_SUBMIT_ENDPOINT,
        ),
      registerId: normalizeText(raw.submission?.registerId),
    },
  };
}

function saveConfig(config, cwd = process.cwd()) {
  const configPath = resolveConfigPath(cwd);
  ensureDirectory(path.dirname(configPath));
  writeFileSync(`${configPath}`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return configPath;
}

function buildTemplate() {
  return {
    schemaVersion: "1.0.0",
    documentationType: "application",
    status: "draft",
    title: "Customer support triage with AI",
    summary:
      "First-level support uses AI to draft responses before a human sends them.",
    purpose: "Support team drafts ticket replies and internal summaries.",
    ownerRole: "Support Lead",
    contactPersonName: "Alex Example",
    isCurrentlyResponsible: true,
    responsibleParty: null,
    usageContexts: ["CUSTOMERS", "EMPLOYEES"],
    decisionInfluence: "PREPARATION",
    dataCategories: ["PERSONAL_DATA", "INTERNAL_CONFIDENTIAL"],
    systems: [
      {
        position: 1,
        name: "Zendesk",
        providerType: "TOOL",
      },
      {
        position: 2,
        name: "ChatGPT Enterprise",
        providerType: "MODEL",
      },
    ],
    workflow: {
      connectionMode: "SEMI_AUTOMATED",
      summary:
        "Tickets enter Zendesk, AI drafts a response, and a human agent approves the final answer.",
    },
    triggers: [
      "New inbound support ticket",
      "Escalation request from the support queue",
    ],
    steps: [
      "Ticket is categorised in Zendesk",
      "Relevant ticket data is copied into the AI prompt",
      "AI drafts response and summary",
      "Human agent edits and approves the final reply",
    ],
    humansInLoop: [
      "Support agent reviews every external answer before sending",
      "Team lead audits sensitive escalations weekly",
    ],
    risks: [
      "Hallucinated answers",
      "Unnecessary personal data in prompts",
      "Inconsistent escalation handling",
    ],
    controls: [
      "Prompt template excludes secrets and payment data",
      "Human approval is mandatory for outbound communication",
      "Quarterly review of prompt and escalation guidance",
    ],
    artifacts: [
      "Prompt template",
      "Support SOP",
      "Escalation checklist",
    ],
    tags: ["support", "customer-service", "human-review"],
  };
}

function normalizeChoice(value, allowedValues, fallback, flagName) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return fallback;
  }

  if (allowedValues.includes(normalized)) {
    return normalized;
  }

  throw new Error(
    `${flagName} must be one of ${allowedValues.join(", ")}`,
  );
}

function buildAutopilotPlan(flags, config) {
  const now = new Date().toISOString();
  const cadence = normalizeChoice(
    flags.cadence,
    AUTOPILOT_CADENCE_VALUES,
    "every-3-days",
    "--cadence",
  );
  const mode = normalizeChoice(
    flags.mode,
    AUTOPILOT_MODE_VALUES,
    "draft-only",
    "--mode",
  );
  const outputDirectory = resolveOutputDirectory(
    flags["out-dir"] ?? config?.defaults.outDir,
  );
  const explicitSources = normalizeStringList(flags.sources);
  const allowedSources =
    explicitSources.length > 0
      ? explicitSources
      : [
          "docs/agent-workflows",
          "repository files explicitly reviewed by the operator",
        ];
  const registerId = resolveRegisterId(flags, config) ?? null;

  return {
    schemaVersion: "1.0.0",
    kind: "kiregister.autopilot.plan",
    generatedBy: "studio-agent",
    generatedAt: now,
    cadence,
    mode,
    scope: normalizeText(flags.scope) ?? "local-workstation",
    target: {
      registerId,
      submitEndpoint: resolveSubmitEndpoint(flags, config),
      outputDirectory,
      candidateDirectory: path.join(outputDirectory, "_autopilot-candidates"),
      evidenceDirectory: path.join(outputDirectory, "_autopilot-evidence"),
    },
    policy: {
      defaultWriteBehavior:
        mode === "submit-after-confirmation"
          ? "submit only after explicit local confirmation"
          : "write local draft evidence and candidate manifests only",
      mayRead: allowedSources,
      mayWrite: [
        "local candidate manifests",
        "local evidence summaries",
        ...(mode === "submit-after-confirmation"
          ? ["confirmed KI-Register submissions after explicit local confirmation"]
          : []),
      ],
      neverDo: [
        "make final legal or compliance decisions",
        "mark a high-risk classification as final",
        "submit personal or special-category data without review",
        "change existing register records silently",
        "read sources that were not explicitly allowed",
      ],
    },
    humanReviewTriggers: [
      {
        id: "unknown-owner",
        question: "Who owns this AI use case?",
        blocks: "submission",
      },
      {
        id: "external-or-public-context",
        question: "Is this internal, employee-facing, customer-facing, applicant-facing, or public?",
        blocks: "risk-and-register-status",
      },
      {
        id: "personal-or-sensitive-data",
        question: "Which data categories are actually processed?",
        blocks: "submission",
      },
      {
        id: "decision-influence-unclear",
        question: "Does the system assist, prepare, or automate a decision?",
        blocks: "risk-and-register-status",
      },
      {
        id: "low-confidence-evidence",
        question: "Is the detected evidence enough to document a real use case?",
        blocks: "submission",
      },
    ],
    runSteps: [
      "read only explicitly allowed sources",
      "detect new or changed AI-use evidence",
      "map evidence to a candidate manifest",
      "write candidate manifest and evidence summary locally",
      "ask only the unresolved human-review questions",
      "submit only after confirmation when mode allows it",
    ],
    suggestedScheduler: {
      owner: "operator",
      note: "studio-agent creates the plan but does not install a background scheduler by itself.",
      launchdCadence:
        cadence === "daily"
          ? "StartCalendarInterval every day"
          : cadence === "every-3-days"
            ? "StartInterval 259200"
            : cadence === "weekly"
              ? "StartCalendarInterval once per week"
              : "manual run only",
    },
  };
}

function normalizeAutopilotPolicy(rawPolicy) {
  if (!rawPolicy || typeof rawPolicy !== "object") {
    throw new Error("Autopilot policy must be a JSON object.");
  }

  if (rawPolicy.kind !== "kiregister.autopilot.plan") {
    throw new Error("Autopilot policy kind must be kiregister.autopilot.plan.");
  }

  return {
    ...rawPolicy,
    policy: {
      mayRead: normalizeStringList(rawPolicy.policy?.mayRead),
      mayWrite: normalizeStringList(rawPolicy.policy?.mayWrite),
      neverDo: normalizeStringList(rawPolicy.policy?.neverDo),
      defaultWriteBehavior: normalizeText(rawPolicy.policy?.defaultWriteBehavior),
    },
    target: {
      registerId: normalizeText(rawPolicy.target?.registerId) ?? null,
      submitEndpoint:
        normalizeText(rawPolicy.target?.submitEndpoint) ??
        DEFAULT_SUBMIT_ENDPOINT,
      outputDirectory:
        normalizeText(rawPolicy.target?.outputDirectory) ??
        path.resolve(process.cwd(), DEFAULT_OUT_DIR),
      candidateDirectory:
        normalizeText(rawPolicy.target?.candidateDirectory) ??
        path.resolve(process.cwd(), DEFAULT_OUT_DIR, "_autopilot-candidates"),
      evidenceDirectory:
        normalizeText(rawPolicy.target?.evidenceDirectory) ??
        path.resolve(process.cwd(), DEFAULT_OUT_DIR, "_autopilot-evidence"),
    },
  };
}

function loadAutopilotPolicy(flags, config) {
  const policyPath = normalizeText(flags.policy);
  if (policyPath) {
    return normalizeAutopilotPolicy(
      readJsonFile(path.resolve(process.cwd(), policyPath)),
    );
  }

  return normalizeAutopilotPolicy(buildAutopilotPlan(flags, config));
}

function createRunId(now = new Date()) {
  return `apr_${now.toISOString().replace(/[^0-9]/g, "").slice(0, 14)}_${randomIdSuffix()}`;
}

function isWorkspaceLocalPath(candidatePath) {
  const workspaceRoot = path.resolve(process.cwd());
  const resolved = path.resolve(process.cwd(), candidatePath);
  return (
    resolved === workspaceRoot ||
    resolved.startsWith(`${workspaceRoot}${path.sep}`)
  );
}

function resolveAllowedSource(source) {
  const sourceText = normalizeText(source);
  if (!sourceText) {
    return {
      ok: false,
      source,
      reason: "empty-source",
    };
  }

  if (sourceText.includes("://")) {
    return {
      ok: false,
      source: sourceText,
      reason: "remote-sources-not-supported-in-local-run",
    };
  }

  if (!isWorkspaceLocalPath(sourceText)) {
    return {
      ok: false,
      source: sourceText,
      reason: "outside-workspace",
    };
  }

  const resolvedPath = path.resolve(process.cwd(), sourceText);
  if (!existsSync(resolvedPath)) {
    return {
      ok: false,
      source: sourceText,
      resolvedPath,
      reason: "not-found",
    };
  }

  return {
    ok: true,
    source: sourceText,
    resolvedPath,
  };
}

function readPackageJsonEvidence(source, resolvedPath, runId, observedAt) {
  const packageData = readJsonFile(resolvedPath);
  const dependencyBlocks = [
    packageData.dependencies,
    packageData.devDependencies,
    packageData.peerDependencies,
    packageData.optionalDependencies,
  ].filter((entry) => entry && typeof entry === "object");
  const dependencyNames = [
    ...new Set(dependencyBlocks.flatMap((entry) => Object.keys(entry))),
  ].sort();
  const aiDependencies = dependencyNames.filter((name) =>
    AI_DEPENDENCY_HINTS.has(name),
  );

  if (aiDependencies.length === 0) {
    return {
      evidence: [],
      candidates: [],
    };
  }

  const evidenceId = `ev_${runId}_package_ai_deps`;
  const candidateId = `cand_${runId}_package_ai_deps`;

  return {
    evidence: [
      {
        evidenceId,
        source,
        sourceRef: resolvedPath,
        observedAt,
        claim: `Repository declares AI-related dependencies: ${aiDependencies.join(", ")}`,
        confidence: 0.68,
        excerpt: aiDependencies.join(", "),
        sensitive: false,
      },
    ],
    candidates: [
      {
        candidateId,
        title: "AI SDK usage in repository",
        purpose:
          "Repository declares AI-related SDK dependencies; review whether this represents a KI-Register use case.",
        systems: aiDependencies.map((name, index) => ({
          position: index + 1,
          name,
          providerType: "SDK",
        })),
        confidence: 0.62,
        status: "needs_review",
        blockedBy: [
          "unknown-owner",
          "decision-influence-unclear",
          "low-confidence-evidence",
        ],
        evidenceIds: [evidenceId],
      },
    ],
  };
}

function readWorkflowEvidence(source, resolvedPath, runId, observedAt) {
  if (!statSync(resolvedPath).isDirectory()) {
    return {
      evidence: [],
      candidates: [],
    };
  }

  const evidence = [];
  for (const entry of readdirSync(resolvedPath)) {
    const manifestPath = path.join(resolvedPath, entry, "manifest.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = readJsonFile(manifestPath);
    evidence.push({
      evidenceId: `ev_${runId}_workflow_${slugify(entry)}`,
      source,
      sourceRef: manifestPath,
      observedAt,
      claim: `Existing workflow manifest found: ${manifest.title ?? entry}`,
      confidence: 0.9,
      excerpt: manifest.purpose ?? manifest.summary ?? manifest.title ?? entry,
      sensitive: false,
    });
  }

  return {
    evidence,
    candidates: [],
  };
}

function scanAutopilotSource(sourceInfo, runId, observedAt) {
  if (!sourceInfo.ok) {
    return {
      evidence: [],
      candidates: [],
      skipped: sourceInfo,
    };
  }

  if (path.basename(sourceInfo.resolvedPath) === "package.json") {
    return readPackageJsonEvidence(
      sourceInfo.source,
      sourceInfo.resolvedPath,
      runId,
      observedAt,
    );
  }

  if (sourceInfo.source.includes("agent-workflows")) {
    return readWorkflowEvidence(
      sourceInfo.source,
      sourceInfo.resolvedPath,
      runId,
      observedAt,
    );
  }

  return {
    evidence: [],
    candidates: [],
    skipped: {
      source: sourceInfo.source,
      resolvedPath: sourceInfo.resolvedPath,
      reason: "source-type-not-yet-supported",
    },
  };
}

function writeAutopilotRunArtifacts({ policy, run }) {
  ensureDirectory(policy.target.candidateDirectory);
  ensureDirectory(policy.target.evidenceDirectory);

  const runPath = path.join(
    policy.target.evidenceDirectory,
    `${run.runId}.json`,
  );
  writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");

  const candidatePaths = run.candidates.map((candidate) => {
    const candidatePath = path.join(
      policy.target.candidateDirectory,
      `${candidate.candidateId}.json`,
    );
    writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    return candidatePath;
  });

  return {
    runPath,
    candidatePaths,
  };
}

function runAutopilotLocalDraft(flags, config) {
  const policy = loadAutopilotPolicy(flags, config);
  const now = new Date();
  const observedAt = now.toISOString();
  const runId = createRunId(now);
  const sourceResults = policy.policy.mayRead.map((source) =>
    scanAutopilotSource(resolveAllowedSource(source), runId, observedAt),
  );
  const evidence = sourceResults.flatMap((result) => result.evidence);
  const candidates = sourceResults.flatMap((result) => result.candidates);
  const skippedSources = sourceResults
    .map((result) => result.skipped)
    .filter((entry) => Boolean(entry));
  const run = {
    schemaVersion: "1.0.0",
    kind: "kiregister.autopilot.run",
    runId,
    startedAt: observedAt,
    completedAt: new Date().toISOString(),
    status: candidates.length > 0 ? "needs_review" : "no_candidates",
    mode: policy.mode,
    cadence: policy.cadence,
    sourceCount: policy.policy.mayRead.length,
    evidenceCount: evidence.length,
    candidateCount: candidates.length,
    reviewQuestionCount: candidates.reduce(
      (total, candidate) => total + candidate.blockedBy.length,
      0,
    ),
    evidence,
    candidates,
    skippedSources,
    nextAction:
      candidates.length > 0
        ? "Review local candidates before any KIRegister submission."
        : "No candidate detected from supported local sources.",
  };

  const files = writeAutopilotRunArtifacts({ policy, run });
  return {
    policy,
    run,
    files,
  };
}

function resolveManifestPath(manifestTarget) {
  const resolvedTarget = path.resolve(process.cwd(), manifestTarget);

  if (
    existsSync(resolvedTarget) &&
    statSync(resolvedTarget).isDirectory()
  ) {
    return path.join(resolvedTarget, "manifest.json");
  }

  return resolvedTarget;
}

function resolveSubmitEndpoint(flags, config) {
  return (
    normalizeText(flags.endpoint) ??
    normalizeText(process.env.KI_REGISTER_SUBMIT_ENDPOINT) ??
    normalizeText(config?.submission?.endpoint) ??
    DEFAULT_SUBMIT_ENDPOINT
  );
}

function resolveOperatorEndpoint(flags, config) {
  return (
    normalizeText(flags["operator-endpoint"]) ??
    normalizeText(process.env.KI_REGISTER_OPERATOR_ENDPOINT) ??
    normalizeText(config?.submission?.operatorEndpoint) ??
    deriveOperatorEndpoint(resolveSubmitEndpoint(flags, config))
  );
}

function buildOperatorUrl(endpoint, pathSuffix, params = {}) {
  const baseEndpoint = normalizeText(endpoint) ?? DEFAULT_OPERATOR_ENDPOINT;
  const normalizedBase = baseEndpoint.replace(/\/+$/u, "");
  const normalizedSuffix = pathSuffix.replace(/^\/+/u, "");
  const url = new URL(`${normalizedBase}/${normalizedSuffix}`);

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeText(value == null ? undefined : String(value));
    if (normalizedValue) {
      url.searchParams.set(key, normalizedValue);
    }
  });

  return url.toString();
}

function resolveRegisterId(flags, config) {
  return (
    normalizeText(flags["register-id"]) ??
    normalizeText(process.env.KI_REGISTER_REGISTER_ID) ??
    normalizeText(config?.submission?.registerId)
  );
}

function resolveApiKey(flags) {
  return normalizeText(flags["api-key"]) ?? normalizeText(process.env.KI_REGISTER_API_KEY);
}

function normalizeOptionalNumber(value, flagName) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${flagName} must be a number.`);
  }

  return parsed;
}

function normalizeSystemEntries(value) {
  const rawEntries = Array.isArray(value)
    ? value
    : normalizeStringList(value);

  return rawEntries
    .map((entry, index) => {
      if (typeof entry === "string") {
        return {
          position: index + 1,
          name: entry,
          providerType: "OTHER",
        };
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const name = normalizeText(entry.name);
      if (!name) {
        return null;
      }

      return {
        position:
          Number.isInteger(entry.position) && entry.position > 0
            ? entry.position
            : index + 1,
        name,
        providerType: normalizeText(entry.providerType) ?? "OTHER",
      };
    })
    .filter((entry) => Boolean(entry))
    .sort((left, right) => left.position - right.position)
    .map((entry, index) => ({
      position: index + 1,
      name: entry.name,
      providerType: entry.providerType,
    }));
}

function buildManifestFromFlags(flags) {
  return {
    documentationType: flags.type,
    title: flags.title,
    slug: flags.slug,
    summary: flags.summary,
    purpose: flags.purpose,
    ownerRole: flags["owner-role"],
    contactPersonName: flags.contact,
    isCurrentlyResponsible: flags["currently-responsible"],
    responsibleParty: flags["responsible-party"],
    usageContexts: flags["usage-contexts"],
    decisionInfluence: flags["decision-influence"],
    dataCategories: flags["data-categories"],
    systems: flags.systems,
    workflow: {
      connectionMode: flags["connection-mode"],
      summary: flags["workflow-summary"],
    },
    triggers: flags.triggers,
    steps: flags.steps,
    humansInLoop: flags.humans,
    risks: flags.risks,
    controls: flags.controls,
    artifacts: flags.artifacts,
    tags: flags.tags,
    status: flags.status,
  };
}

function normalizeManifest(input, options = {}) {
  const base = input && typeof input === "object" ? input : {};
  const config = options.config ?? null;
  const now = new Date().toISOString();

  const documentationType =
    normalizeEnum(
      base.documentationType ??
        options.documentationType ??
        config?.defaults.documentationType,
      DOCUMENT_TYPES,
    ) ?? "application";
  const title = normalizeText(base.title ?? options.title);
  const slug =
    normalizeText(base.slug ?? options.slug) ?? slugify(title ?? "untitled");
  const status =
    normalizeEnum(base.status ?? options.status, STATUS_VALUES) ?? "draft";
  const isCurrentlyResponsible = toBoolean(
    base.isCurrentlyResponsible ?? options.isCurrentlyResponsible,
    true,
  );
  const connectionMode =
    normalizeEnum(
      base.workflow?.connectionMode ??
        options.workflow?.connectionMode ??
        options.connectionMode ??
        config?.defaults.connectionMode,
      CONNECTION_MODE_VALUES,
      CONNECTION_MODE_ALIASES,
    ) ?? undefined;
  const workflowSummary = normalizeText(
    base.workflow?.summary ??
      options.workflow?.summary ??
      options.workflowSummary,
  );

  return {
    schemaVersion: "1.0.0",
    generatedBy: "studio-agent",
    generatedAt: normalizeText(base.generatedAt) ?? now,
    updatedAt: now,
    documentationType,
    status,
    slug,
    title,
    summary: normalizeText(base.summary ?? options.summary),
    purpose:
      normalizeText(base.purpose ?? options.purpose) ??
      title,
    ownerRole:
      normalizeText(base.ownerRole ?? options.ownerRole) ??
      config?.defaults.ownerRole,
    contactPersonName:
      normalizeText(base.contactPersonName ?? options.contactPersonName) ??
      config?.profile.contactPersonName ??
      config?.profile.name,
    isCurrentlyResponsible,
    responsibleParty: isCurrentlyResponsible
      ? null
      : normalizeText(base.responsibleParty ?? options.responsibleParty) ?? null,
    usageContexts: normalizeEnumList(
      base.usageContexts ??
        options.usageContexts ??
        config?.defaults.usageContexts,
      USAGE_CONTEXT_VALUES,
      USAGE_CONTEXT_ALIASES,
    ),
    decisionInfluence:
      normalizeEnum(
        base.decisionInfluence ??
          options.decisionInfluence ??
          config?.defaults.decisionInfluence,
        DECISION_INFLUENCE_VALUES,
        DECISION_INFLUENCE_ALIASES,
      ) ?? undefined,
    dataCategories: normalizeEnumList(
      base.dataCategories ??
        options.dataCategories ??
        config?.defaults.dataCategories,
      DATA_CATEGORY_VALUES,
      DATA_CATEGORY_ALIASES,
    ),
    systems: normalizeSystemEntries(base.systems ?? options.systems),
    workflow:
      connectionMode || workflowSummary
        ? {
            connectionMode: connectionMode ?? "MANUAL_SEQUENCE",
            summary: workflowSummary,
          }
        : undefined,
    triggers: normalizeStringList(base.triggers ?? options.triggers),
    steps: normalizeStringList(base.steps ?? options.steps),
    humansInLoop: normalizeStringList(
      base.humansInLoop ?? options.humansInLoop,
    ),
    risks: normalizeStringList(base.risks ?? options.risks),
    controls: normalizeStringList(base.controls ?? options.controls),
    artifacts: normalizeStringList(base.artifacts ?? options.artifacts),
    tags: normalizeStringList(base.tags ?? options.tags).map((entry) =>
      slugify(entry),
    ),
    capturedBy:
      config?.profile.name || config?.profile.role || config?.profile.team
        ? {
            name: config?.profile.name ?? null,
            role: config?.profile.role ?? null,
            team: config?.profile.team ?? null,
          }
        : undefined,
  };
}

function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!DOCUMENT_TYPES.includes(manifest.documentationType)) {
    errors.push(
      `documentationType must be one of ${DOCUMENT_TYPES.join(", ")}`,
    );
  }

  if (!manifest.title) {
    errors.push("title is required");
  }

  if (!manifest.purpose || manifest.purpose.length < 3) {
    errors.push("purpose must contain at least 3 characters");
  }

  if (!manifest.ownerRole || manifest.ownerRole.length < 2) {
    errors.push("ownerRole must contain at least 2 characters");
  }

  if (!Array.isArray(manifest.usageContexts) || manifest.usageContexts.length === 0) {
    errors.push("usageContexts must contain at least one value");
  }

  if (
    manifest.usageContexts.some(
      (entry) => !USAGE_CONTEXT_VALUES.includes(entry),
    )
  ) {
    errors.push("usageContexts contains unsupported values");
  }

  if (
    manifest.decisionInfluence &&
    !DECISION_INFLUENCE_VALUES.includes(manifest.decisionInfluence)
  ) {
    errors.push("decisionInfluence contains an unsupported value");
  }

  if (
    manifest.dataCategories.some(
      (entry) => !DATA_CATEGORY_VALUES.includes(entry),
    )
  ) {
    errors.push("dataCategories contains unsupported values");
  }

  if (!Array.isArray(manifest.systems) || manifest.systems.length === 0) {
    errors.push("systems must contain at least one named system");
  }

  manifest.systems.forEach((system, index) => {
    if (!system || typeof system !== "object") {
      errors.push(`systems[${index}] is invalid`);
      return;
    }

    if (!normalizeText(system.name)) {
      errors.push(`systems[${index}].name is required`);
    }

    if (
      !Number.isInteger(system.position) ||
      Number(system.position) < 1
    ) {
      errors.push(`systems[${index}].position must be a positive integer`);
    }
  });

  if (
    manifest.workflow?.connectionMode &&
    !CONNECTION_MODE_VALUES.includes(manifest.workflow.connectionMode)
  ) {
    errors.push("workflow.connectionMode contains an unsupported value");
  }

  if (!manifest.isCurrentlyResponsible && !manifest.responsibleParty) {
    errors.push("responsibleParty is required when isCurrentlyResponsible is false");
  }

  if (manifest.steps.length === 0) {
    warnings.push("steps is empty; process flow will be hard to follow");
  }

  if (manifest.controls.length === 0) {
    warnings.push("controls is empty; governance coverage may be too weak");
  }

  if (manifest.humansInLoop.length === 0) {
    warnings.push("humansInLoop is empty; document review checkpoints if they exist");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function renderBulletList(values, fallbackText = "None documented yet.") {
  if (!values || values.length === 0) {
    return `- ${fallbackText}`;
  }

  return values.map((entry) => `- ${entry}`).join("\n");
}

function renderOrderedList(values, fallbackText = "No process steps documented yet.") {
  if (!values || values.length === 0) {
    return `1. ${fallbackText}`;
  }

  return values.map((entry, index) => `${index + 1}. ${entry}`).join("\n");
}

function renderMarkdown(manifest) {
  const systemLines = manifest.systems
    .map(
      (system) =>
        `${system.position}. ${system.name} (${system.providerType ?? "OTHER"})`,
    )
    .join("\n");

  const metadataLines = [
    `- Type: ${manifest.documentationType}`,
    `- Status: ${manifest.status}`,
    `- Owner role: ${manifest.ownerRole}`,
    `- Contact person: ${manifest.contactPersonName ?? "Not documented"}`,
    `- Responsible today: ${manifest.isCurrentlyResponsible ? "Yes" : "No"}`,
    `- Responsible party: ${manifest.responsibleParty ?? "Current team"}`,
    `- Usage contexts: ${manifest.usageContexts.join(", ")}`,
    `- Decision influence: ${manifest.decisionInfluence ?? "Not documented"}`,
    `- Data categories: ${
      manifest.dataCategories.length > 0
        ? manifest.dataCategories.join(", ")
        : "Not documented"
    }`,
    `- Captured by: ${
      manifest.capturedBy?.name ??
      manifest.capturedBy?.role ??
      "Not documented"
    }`,
    `- Generated: ${manifest.generatedAt}`,
  ];

  const workflowLines = manifest.workflow
    ? [
        `- Connection mode: ${manifest.workflow.connectionMode}`,
        `- Summary: ${manifest.workflow.summary ?? "No additional workflow summary."}`,
      ]
    : ["- No multi-system workflow metadata documented."];

  return [
    `# ${manifest.title}`,
    "",
    manifest.summary ?? manifest.purpose,
    "",
    "## Metadata",
    metadataLines.join("\n"),
    "",
    "## Purpose",
    manifest.purpose,
    "",
    "## Systems",
    systemLines,
    "",
    "## Workflow",
    workflowLines.join("\n"),
    "",
    "## Triggers",
    renderBulletList(manifest.triggers),
    "",
    "## Process Steps",
    renderOrderedList(manifest.steps),
    "",
    "## Human Oversight",
    renderBulletList(manifest.humansInLoop),
    "",
    "## Risks",
    renderBulletList(manifest.risks),
    "",
    "## Controls",
    renderBulletList(manifest.controls),
    "",
    "## Artifacts",
    renderBulletList(manifest.artifacts),
    "",
    "## Tags",
    renderBulletList(manifest.tags, "No tags assigned."),
    "",
    "## Machine Files",
    "- `manifest.json` is the canonical machine-readable source.",
    "- `README.md` is the human-readable summary for reviewers and agents.",
  ].join("\n");
}

function writeManifestBundle(manifest, targetRoot, force = false) {
  ensureDirectory(targetRoot);

  const slugDirectory = path.join(targetRoot, manifest.slug);
  const manifestPath = path.join(slugDirectory, "manifest.json");
  const readmePath = path.join(slugDirectory, "README.md");

  if (existsSync(slugDirectory) && !force) {
    throw new Error(
      `Target folder already exists: ${slugDirectory}. Re-run with --force to overwrite.`,
    );
  }

  ensureDirectory(slugDirectory);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  writeFileSync(readmePath, `${renderMarkdown(manifest)}\n`, "utf8");

  return {
    slugDirectory,
    manifestPath,
    readmePath,
  };
}

async function createPromptSession() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Interactive mode needs a TTY.");
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = async (label, options = {}) => {
    const suffix = options.defaultValue ? ` [${options.defaultValue}]` : "";
    const raw = await rl.question(`${label}${suffix}: `);
    const normalized = normalizeText(raw);

    if (!normalized && options.required && !options.defaultValue) {
      process.stdout.write("This field is required.\n");
      return ask(label, options);
    }

    return normalized ?? options.defaultValue ?? "";
  };

  return { rl, ask };
}

async function confirmWrite(manifest, outDir, flags, config) {
  if (flags.yes) {
    return true;
  }

  const shouldConfirm =
    flags.confirm ||
    config?.defaults.confirmBeforeWrite !== false;

  if (!shouldConfirm) {
    return true;
  }

  const summaryLines = [
    "",
    "Review before write:",
    `- Title: ${manifest.title ?? "Missing"}`,
    `- Type: ${manifest.documentationType}`,
    `- Owner role: ${manifest.ownerRole ?? "Missing"}`,
    `- Systems: ${manifest.systems.map((system) => system.name).join(", ") || "Missing"}`,
    `- Output folder: ${path.join(outDir, manifest.slug)}`,
    "",
  ];

  process.stdout.write(`${summaryLines.join("\n")}\n`);

  const { rl, ask } = await createPromptSession();
  try {
    const answer = await ask("Create or update this documentation? (yes/no)", {
      defaultValue: "no",
    });
    return toBoolean(answer, false);
  } finally {
    rl.close();
  }
}

async function fillMissingFields(manifest, config) {
  const needsPrompt =
    !manifest.title ||
    !manifest.purpose ||
    !manifest.ownerRole ||
    manifest.systems.length === 0 ||
    manifest.usageContexts.length === 0;

  if (!needsPrompt) {
    return manifest;
  }

  const { rl, ask } = await createPromptSession();

  try {
    const title = manifest.title ?? (await ask("Title", { required: true }));
    const purpose =
      manifest.purpose ??
      (await ask("Purpose", { defaultValue: title, required: true }));
    const ownerRole =
      manifest.ownerRole ??
      (await ask("Owner role", {
        required: true,
        defaultValue: config?.defaults.ownerRole,
      }));
    const systems =
      manifest.systems.length > 0
        ? manifest.systems
        : normalizeSystemEntries(
            await ask("Systems in execution order (comma separated)", {
              required: true,
            }),
          );
    const usageContexts =
      manifest.usageContexts.length > 0
        ? manifest.usageContexts
        : normalizeEnumList(
            await ask(
              `Usage contexts (${USAGE_CONTEXT_VALUES.join(", ")})`,
              {
                defaultValue:
                  config?.defaults.usageContexts.join(", ") ||
                  "INTERNAL_ONLY",
              },
            ),
            USAGE_CONTEXT_VALUES,
            USAGE_CONTEXT_ALIASES,
          );

    return normalizeManifest(
      {
        ...manifest,
        title,
        purpose,
        ownerRole,
        systems,
        usageContexts,
      },
      { config },
    );
  } finally {
    rl.close();
  }
}

function emitResult(payload, asJson = false) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (payload.message) {
    process.stdout.write(`${payload.message}\n`);
  }
}

function emitOperatorResult(payload, asJson = false) {
  if (asJson) {
    emitResult(payload, true);
    return;
  }

  if (payload.message) {
    process.stdout.write(`${payload.message}\n`);
  }

  if (Array.isArray(payload.registers)) {
    payload.registers.forEach((register) => {
      process.stdout.write(
        `- ${register.registerId}: ${register.name ?? register.organisationName ?? "Unnamed register"}\n`,
      );
    });
  }

  if (Array.isArray(payload.useCases)) {
    payload.useCases.forEach((useCase) => {
      process.stdout.write(
        `- ${useCase.useCaseId}: ${useCase.purpose} [${useCase.status}]\n`,
      );
    });
  }

  if (Array.isArray(payload.candidates)) {
    payload.candidates.forEach((candidate) => {
      process.stdout.write(
        `- ${candidate.candidateId}: ${candidate.title ?? candidate.purpose} [${candidate.status}]\n`,
      );
    });
  }

  if (payload.useCase) {
    process.stdout.write(
      [
        `Use case: ${payload.useCase.useCaseId}`,
        `Purpose: ${payload.useCase.purpose}`,
        `Status: ${payload.useCase.status}`,
        `Systems: ${payload.useCase.systemSummary ?? "Not documented"}`,
      ].join("\n") + "\n",
    );
  }

  if (payload.candidate) {
    process.stdout.write(
      [
        `Candidate: ${payload.candidate.candidateId}`,
        `Title: ${payload.candidate.title}`,
        `Status: ${payload.candidate.status}`,
        `Systems: ${payload.candidate.systemSummary ?? "Not documented"}`,
      ].join("\n") + "\n",
    );
  }
}

function collectWorkflowEntries(outDir) {
  if (!existsSync(outDir)) {
    return [];
  }

  return readdirSync(outDir)
    .map((entry) => path.join(outDir, entry))
    .filter((entry) => existsSync(path.join(entry, "manifest.json")))
    .map((entry) => {
      const stats = statSync(entry);
      const manifestPath = path.join(entry, "manifest.json");
      const manifest = readJsonFile(manifestPath);

      return {
        slug: path.basename(entry),
        title: manifest.title ?? path.basename(entry),
        documentationType: manifest.documentationType ?? "application",
        status: manifest.status ?? "draft",
        updatedAt: manifest.updatedAt ?? stats.mtime.toISOString(),
        manifestPath,
      };
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

async function resolveSubmitDefaults(flags, config) {
  const endpoint = resolveSubmitEndpoint(flags, config);
  let registerId = resolveRegisterId(flags, config);

  if (!registerId && process.stdin.isTTY && process.stdout.isTTY) {
    const { rl, ask } = await createPromptSession();
    try {
      registerId = normalizeText(
        await ask("Default KI-Register register id", {
          defaultValue: config?.submission?.registerId,
        }),
      );
    } finally {
      rl.close();
    }
  }

  if (!registerId) {
    throw new Error(
      "Missing register id. Use --register-id, set KI_REGISTER_REGISTER_ID, or save it in onboard.",
    );
  }

  const apiKey = resolveApiKey(flags);
  if (!apiKey) {
    throw new Error(
      "Missing Agent-Kit API key. Use --api-key or set KI_REGISTER_API_KEY.",
    );
  }

  return {
    endpoint,
    registerId,
    apiKey,
  };
}

async function resolveOperatorDefaults(flags, config, options = {}) {
  const endpoint = resolveOperatorEndpoint(flags, config);
  let registerId = resolveRegisterId(flags, config);

  if (
    options.requireRegisterId &&
    !registerId &&
    process.stdin.isTTY &&
    process.stdout.isTTY
  ) {
    const { rl, ask } = await createPromptSession();
    try {
      registerId = normalizeText(
        await ask("KI-Register register id", {
          defaultValue: config?.submission?.registerId,
        }),
      );
    } finally {
      rl.close();
    }
  }

  if (options.requireRegisterId && !registerId) {
    throw new Error(
      "Missing register id. Use --register-id, set KI_REGISTER_REGISTER_ID, or save it in onboard.",
    );
  }

  const apiKey = resolveApiKey(flags);
  if (!apiKey) {
    throw new Error(
      "Missing Agent-Kit API key. Use --api-key or set KI_REGISTER_API_KEY.",
    );
  }

  return {
    endpoint,
    registerId,
    apiKey,
  };
}

async function requestJson({
  endpoint,
  apiKey,
  method = "GET",
  body,
  timeoutMessage = "Request timed out",
  errorFallback = "Request failed",
}) {
  const endpointUrl = new URL(endpoint);
  const requestBody = body === undefined ? null : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const transport = endpointUrl.protocol === "https:" ? httpsRequest : httpRequest;
    const headers = {
      authorization: `Bearer ${apiKey}`,
      connection: "close",
    };

    if (requestBody) {
      headers["content-type"] = "application/json";
      headers["content-length"] = Buffer.byteLength(requestBody);
    }

    const request = transport(
      endpointUrl,
      {
        method,
        headers,
      },
      (response) => {
        response.setEncoding("utf8");
        let rawBody = "";

        response.on("data", (chunk) => {
          rawBody += chunk;
        });
        response.on("end", () => {
          const statusCode = response.statusCode ?? 500;
          let payload;

          try {
            payload = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            payload = { error: rawBody || "Unknown response" };
          }

          if (statusCode >= 400) {
            const message =
              payload &&
              typeof payload === "object" &&
              typeof payload.error === "string"
                ? payload.error
                : `${errorFallback} with ${statusCode}`;
            reject(new Error(message));
            return;
          }

          resolve(payload);
        });
      },
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error(timeoutMessage));
    });
    request.on("error", (error) => {
      reject(error);
    });
    if (requestBody) {
      request.write(requestBody);
    }
    request.end();
  });
}

async function postSubmitRequest({ endpoint, apiKey, registerId, manifest }) {
  return requestJson({
    endpoint,
    apiKey,
    method: "POST",
    body: {
      registerId,
      manifest,
    },
    timeoutMessage: "Submit request timed out",
    errorFallback: "Submit failed",
  });
}

async function getOperatorRegisters({ endpoint, apiKey }) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, "registers"),
    apiKey,
    timeoutMessage: "Operator registers request timed out",
    errorFallback: "Operator registers request failed",
  });
}

async function getOperatorUseCases({
  endpoint,
  apiKey,
  registerId,
  status,
  searchText,
  limit,
}) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, "use-cases", {
      registerId,
      status,
      searchText,
      limit,
    }),
    apiKey,
    timeoutMessage: "Operator use-cases request timed out",
    errorFallback: "Operator use-cases request failed",
  });
}

async function getOperatorUseCase({ endpoint, apiKey, registerId, useCaseId }) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, `use-cases/${encodeURIComponent(useCaseId)}`, {
      registerId,
    }),
    apiKey,
    timeoutMessage: "Operator use-case request timed out",
    errorFallback: "Operator use-case request failed",
  });
}

async function getOperatorCandidates({ endpoint, apiKey, registerId, status, limit }) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, "candidates", {
      registerId,
      status,
      limit,
    }),
    apiKey,
    timeoutMessage: "Operator candidates request timed out",
    errorFallback: "Operator candidates request failed",
  });
}

async function getOperatorCandidate({ endpoint, apiKey, registerId, candidateId }) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, `candidates/${encodeURIComponent(candidateId)}`, {
      registerId,
    }),
    apiKey,
    timeoutMessage: "Operator candidate request timed out",
    errorFallback: "Operator candidate request failed",
  });
}

async function postOperatorCandidate({
  endpoint,
  apiKey,
  registerId,
  payload,
}) {
  return requestJson({
    endpoint: buildOperatorUrl(endpoint, "candidates"),
    apiKey,
    method: "POST",
    body: {
      registerId,
      ...payload,
    },
    timeoutMessage: "Operator candidate submit request timed out",
    errorFallback: "Operator candidate submit failed",
  });
}

function buildOperatorCandidatePayloadFromManifest({
  manifestPath,
  config,
  flags,
}) {
  const manifest = normalizeManifest(readJsonFile(manifestPath), {
    config,
  });
  const validation = validateManifest(manifest);
  if (!validation.isValid) {
    throw new Error(validation.errors.join("; "));
  }

  const confidence = normalizeOptionalNumber(flags.confidence, "--confidence");
  if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
    throw new Error("--confidence must be between 0 and 1.");
  }

  const blockedBy = normalizeStringList(flags["blocked-by"]);
  const localCandidateId =
    normalizeText(flags["local-candidate-id"]) ??
    normalizeText(path.basename(path.dirname(manifestPath)));

  return {
    payload: {
      manifest,
      ...(confidence !== undefined ? { confidence } : {}),
      ...(blockedBy.length > 0 ? { blockedBy } : {}),
      source: {
        agent: normalizeText(flags["source-agent"]) ?? "studio-agent",
        runId: normalizeText(flags["run-id"]) ?? null,
        localCandidateId,
      },
    },
    validation,
  };
}

async function runOnboard(flags) {
  const existingConfig = loadConfig() ?? normalizeConfig({});
  const { rl, ask } = await createPromptSession();

  try {
    const profileName = await ask("Your name", {
      defaultValue: existingConfig.profile.name,
    });
    const profileRole = await ask("Your role", {
      defaultValue: existingConfig.profile.role,
    });
    const profileTeam = await ask("Team or workspace", {
      defaultValue: existingConfig.profile.team,
    });
    const contactPersonName = await ask("Default contact person", {
      defaultValue:
        existingConfig.profile.contactPersonName ??
        existingConfig.profile.name,
    });
    const ownerRole = await ask("Default owner role for new docs", {
      defaultValue:
        existingConfig.defaults.ownerRole ??
        existingConfig.profile.role,
    });
    const outDir = await ask("Default output directory", {
      defaultValue: existingConfig.defaults.outDir,
    });
    const documentationType = await ask("Default documentation type", {
      defaultValue: existingConfig.defaults.documentationType,
    });
    const usageContexts = await ask(
      `Default usage contexts (${USAGE_CONTEXT_VALUES.join(", ")})`,
      {
        defaultValue:
          existingConfig.defaults.usageContexts.join(", ") ||
          "INTERNAL_ONLY",
      },
    );
    const decisionInfluence = await ask(
      `Default decision influence (${DECISION_INFLUENCE_VALUES.join(", ")})`,
      {
        defaultValue:
          existingConfig.defaults.decisionInfluence ??
          "ASSISTANCE",
      },
    );
    const connectionMode = await ask(
      `Default connection mode (${CONNECTION_MODE_VALUES.join(", ")})`,
      {
        defaultValue:
          existingConfig.defaults.connectionMode ??
          "MANUAL_SEQUENCE",
      },
    );
    const confirmBeforeWrite = await ask(
      "Ask for confirmation before every write? (yes/no)",
      {
        defaultValue:
          existingConfig.defaults.confirmBeforeWrite === false ? "no" : "yes",
      },
    );
    const submitEndpoint = await ask("KI-Register submit API endpoint", {
      defaultValue:
        existingConfig.submission?.endpoint ?? DEFAULT_SUBMIT_ENDPOINT,
    });
    const operatorEndpoint = await ask("KI-Register Operator API endpoint", {
      defaultValue:
        existingConfig.submission?.operatorEndpoint ??
        deriveOperatorEndpoint(submitEndpoint),
    });
    const defaultRegisterId = await ask("Default KI-Register register id");

    const config = normalizeConfig({
      profile: {
        name: profileName,
        role: profileRole,
        team: profileTeam,
        contactPersonName,
      },
      defaults: {
        outDir,
        ownerRole,
        documentationType,
        usageContexts: normalizeEnumList(
          usageContexts,
          USAGE_CONTEXT_VALUES,
          USAGE_CONTEXT_ALIASES,
        ),
        decisionInfluence,
        connectionMode,
        confirmBeforeWrite: toBoolean(confirmBeforeWrite, true),
      },
      submission: {
        endpoint: submitEndpoint,
        operatorEndpoint,
        registerId: defaultRegisterId,
      },
    });

    const configPath = saveConfig(config);

    emitResult(
      {
        ok: true,
        command: "onboard",
        configPath,
        config,
        message: `Saved onboarding config to ${configPath}`,
      },
      Boolean(flags.json),
    );
  } finally {
    rl.close();
  }
}

async function runCapture(flags) {
  const config = loadConfig();

  if (!config && !flags["skip-onboard"] && process.stdin.isTTY && process.stdout.isTTY) {
    process.stdout.write(
      "No onboarding config found. Running studio-agent onboard first.\n",
    );
    await runOnboard({ json: false });
  }

  const activeConfig = loadConfig();
  const sourceManifest = flags.input
    ? readJsonFile(path.resolve(process.cwd(), flags.input))
    : {};
  let manifest = normalizeManifest(sourceManifest, {
    ...buildManifestFromFlags(flags),
    config: activeConfig,
  });

  manifest = await fillMissingFields(manifest, activeConfig);

  const validation = validateManifest(manifest);
  if (!validation.isValid) {
    throw new Error(validation.errors.join("; "));
  }

  const outputDirectory = resolveOutputDirectory(
    flags["out-dir"] ?? activeConfig?.defaults.outDir,
  );

  const approved = await confirmWrite(
    manifest,
    outputDirectory,
    flags,
    activeConfig,
  );

  if (!approved) {
    emitResult(
      {
        ok: false,
        command: "capture",
        manifest,
        message: "Capture cancelled before write.",
      },
      Boolean(flags.json),
    );
    return;
  }

  const files = writeManifestBundle(manifest, outputDirectory, Boolean(flags.force));

  emitResult(
    {
      ok: true,
      command: "capture",
      manifest,
      files,
      warnings: validation.warnings,
      message: `Created ${files.slugDirectory}`,
    },
    Boolean(flags.json),
  );
}

async function runInterview(flags) {
  const config = loadConfig();
  const { rl, ask } = await createPromptSession();

  try {
    const title = await ask("Title", { required: true });
    const documentationType = await ask("Type (application/process/workflow)", {
      defaultValue: config?.defaults.documentationType ?? "application",
    });
    const summary = await ask("Short summary");
    const purpose = await ask("Purpose", { defaultValue: title });
    const ownerRole = await ask("Owner role", {
      defaultValue: config?.defaults.ownerRole,
      required: true,
    });
    const contactPersonName = await ask("Contact person", {
      defaultValue:
        config?.profile.contactPersonName ??
        config?.profile.name,
    });
    const responsibleAnswer = await ask("Currently responsible? (yes/no)", {
      defaultValue: "yes",
    });
    const isCurrentlyResponsible = toBoolean(responsibleAnswer, true);
    const responsibleParty = isCurrentlyResponsible
      ? null
      : await ask("Responsible party");
    const usageContexts = await ask(
      `Usage contexts (${USAGE_CONTEXT_VALUES.join(", ")})`,
      {
        defaultValue:
          config?.defaults.usageContexts.join(", ") ||
          "INTERNAL_ONLY",
      },
    );
    const systems = await ask("Systems in execution order (comma separated)", {
      required: true,
    });
    const connectionMode = await ask(
      `Connection mode (${CONNECTION_MODE_VALUES.join(", ")})`,
      {
        defaultValue:
          config?.defaults.connectionMode ?? "MANUAL_SEQUENCE",
      },
    );
    const workflowSummary = await ask("Workflow summary");
    const decisionInfluence = await ask(
      `Decision influence (${DECISION_INFLUENCE_VALUES.join(", ")})`,
      {
        defaultValue:
          config?.defaults.decisionInfluence ?? "ASSISTANCE",
      },
    );
    const dataCategories = await ask(
      `Data categories (${DATA_CATEGORY_VALUES.join(", ")})`,
    );
    const triggers = await ask("Trigger events (semicolon separated)");
    const steps = await ask("Process steps (semicolon separated)");
    const humansInLoop = await ask("Human checkpoints (semicolon separated)");
    const risks = await ask("Risks (semicolon separated)");
    const controls = await ask("Controls (semicolon separated)");
    const artifacts = await ask("Artifacts or evidence (semicolon separated)");
    const tags = await ask("Tags (comma separated)");
    const outDir = await ask("Output directory", {
      defaultValue: config?.defaults.outDir ?? DEFAULT_OUT_DIR,
    });

    const manifest = normalizeManifest(
      {
        title,
        documentationType,
        summary,
        purpose,
        ownerRole,
        contactPersonName,
        isCurrentlyResponsible,
        responsibleParty,
        usageContexts,
        systems,
        workflow: {
          connectionMode,
          summary: workflowSummary,
        },
        decisionInfluence,
        dataCategories,
        triggers,
        steps,
        humansInLoop,
        risks,
        controls,
        artifacts,
        tags,
      },
      { config },
    );

    const validation = validateManifest(manifest);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    const outputDirectory = resolveOutputDirectory(outDir);
    const approved = await confirmWrite(
      manifest,
      outputDirectory,
      flags,
      config,
    );

    if (!approved) {
      emitResult(
        {
          ok: false,
          command: "interview",
          manifest,
          message: "Interview cancelled before write.",
        },
        Boolean(flags.json),
      );
      return;
    }

    const files = writeManifestBundle(manifest, outputDirectory, Boolean(flags.force));

    emitResult(
      {
        ok: true,
        command: "interview",
        manifest,
        files,
        warnings: validation.warnings,
        message: `Created ${files.slugDirectory}`,
      },
      Boolean(flags.json),
    );
  } finally {
    rl.close();
  }
}

function runCreate(flags) {
  const config = loadConfig();
  const sourceManifest = flags.input
    ? readJsonFile(path.resolve(process.cwd(), flags.input))
    : {};
  const manifest = normalizeManifest(sourceManifest, {
    ...buildManifestFromFlags(flags),
    config,
  });
  const validation = validateManifest(manifest);

  if (!validation.isValid) {
    throw new Error(validation.errors.join("; "));
  }

  const outputDirectory = resolveOutputDirectory(
    flags["out-dir"] ?? config?.defaults.outDir,
  );
  const files = writeManifestBundle(manifest, outputDirectory, Boolean(flags.force));

  emitResult(
    {
      ok: true,
      command: "create",
      manifest,
      files,
      warnings: validation.warnings,
      message: `Created ${files.slugDirectory}`,
    },
    Boolean(flags.json),
  );
}

function runValidate(flags, positionals) {
  const manifestTarget = positionals[1] ?? flags.input;
  if (!manifestTarget) {
    throw new Error("validate requires a manifest path");
  }

  const manifestPath = path.resolve(process.cwd(), manifestTarget);
  const manifest = normalizeManifest(readJsonFile(manifestPath), {
    config: loadConfig(),
  });
  const validation = validateManifest(manifest);

  emitResult(
    {
      ok: validation.isValid,
      command: "validate",
      manifestPath,
      errors: validation.errors,
      warnings: validation.warnings,
      manifest,
      message: validation.isValid
        ? `Manifest valid: ${manifestPath}`
        : `Manifest invalid: ${manifestPath}`,
    },
    Boolean(flags.json),
  );

  if (!validation.isValid) {
    process.exitCode = 1;
  }
}

async function runSubmit(flags, positionals) {
  const config = loadConfig();
  const manifestTarget = positionals[1] ?? flags.input;
  if (!manifestTarget) {
    throw new Error("submit requires a manifest path or workflow folder");
  }

  const manifestPath = resolveManifestPath(manifestTarget);
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest = normalizeManifest(readJsonFile(manifestPath), {
    config,
  });
  const validation = validateManifest(manifest);
  if (!validation.isValid) {
    throw new Error(validation.errors.join("; "));
  }

  const submission = await resolveSubmitDefaults(flags, config);
  const result = await postSubmitRequest({
    endpoint: submission.endpoint,
    apiKey: submission.apiKey,
    registerId: submission.registerId,
    manifest,
  });

  emitResult(
    {
      ok: true,
      command: "submit",
      manifestPath,
      endpoint: submission.endpoint,
      registerId: submission.registerId,
      response: result,
      warnings: validation.warnings,
      message:
        typeof result?.detailUrl === "string"
          ? `Submitted ${manifest.title} to ${result.detailUrl}`
          : `Submitted ${manifest.title} to KI-Register`,
    },
    Boolean(flags.json),
  );
}

function runList(flags) {
  const config = loadConfig();
  const outputDirectory = resolveOutputDirectory(
    flags["out-dir"] ?? config?.defaults.outDir,
  );
  const items = collectWorkflowEntries(outputDirectory);

  if (flags.json) {
    process.stdout.write(
      `${JSON.stringify(
        { ok: true, command: "list", outDir: outputDirectory, items },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (items.length === 0) {
    process.stdout.write(`No workflow folders found in ${outputDirectory}\n`);
    return;
  }

  process.stdout.write(`Workflows in ${outputDirectory}\n`);
  items.forEach((item) => {
    process.stdout.write(
      `- ${item.slug}: ${item.title} [${item.documentationType}, ${item.status}]\n`,
    );
  });
}

function runTemplate(flags) {
  const template = buildTemplate();

  if (flags["out-file"]) {
    const targetFile = path.resolve(process.cwd(), flags["out-file"]);
    ensureDirectory(path.dirname(targetFile));
    writeFileSync(targetFile, `${JSON.stringify(template, null, 2)}\n`, "utf8");

    emitResult(
      {
        ok: true,
        command: "template",
        targetFile,
        message: `Wrote ${targetFile}`,
      },
      Boolean(flags.json),
    );
    return;
  }

  process.stdout.write(`${JSON.stringify(template, null, 2)}\n`);
}

function runAutopilot(flags, positionals) {
  const subcommand = positionals[1] ?? "help";

  if (subcommand === "help") {
    process.stdout.write(
      [
        "studio-agent autopilot",
        "",
        "Commands:",
        "  plan    Draft a local KI-Register Autopilot run policy",
        "  run     Run the local draft-only Autopilot against allowed sources",
        "",
        "Example:",
        "  studio-agent autopilot plan --cadence every-3-days --mode draft-only --out-file ./autopilot-plan.json",
        "  studio-agent autopilot run --policy ./autopilot-plan.json",
      ].join("\n") + "\n",
    );
    return;
  }

  if (subcommand === "run") {
    const config = loadConfig();
    const result = runAutopilotLocalDraft(flags, config);

    emitResult(
      {
        ok: true,
        command: "autopilot run",
        policy: result.policy,
        run: result.run,
        files: result.files,
        message: `Autopilot run ${result.run.runId}: ${result.run.candidateCount} candidate(s), ${result.run.evidenceCount} evidence item(s).`,
      },
      Boolean(flags.json),
    );
    return;
  }

  if (subcommand !== "plan") {
    throw new Error(`Unknown autopilot command: ${subcommand}`);
  }

  const config = loadConfig();
  const plan = buildAutopilotPlan(flags, config);
  const outFile = normalizeText(flags["out-file"]);

  if (outFile) {
    const targetFile = path.resolve(process.cwd(), outFile);
    ensureDirectory(path.dirname(targetFile));
    writeFileSync(targetFile, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

    emitResult(
      {
        ok: true,
        command: "autopilot plan",
        targetFile,
        plan,
        message: `Wrote Autopilot plan to ${targetFile}`,
      },
      Boolean(flags.json),
    );
    return;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        command: "autopilot plan",
        plan,
      },
      null,
      2,
    )}\n`,
  );
}

async function runOperator(flags, positionals) {
  const subcommand = positionals[1] ?? "help";

  if (subcommand === "help") {
    process.stdout.write(
      [
        "studio-agent operator",
        "",
        "Commands:",
        "  registers         List registers visible to a read-only Operator key",
        "  use-cases         List use cases in a register",
        "  use-case <id>     Read one use case in a register",
        "  candidates        List candidate review objects in a register",
        "  candidate <id>    Read one candidate review object",
        "  candidate submit <manifest> Submit a manifest as a review candidate",
        "",
        "Examples:",
        "  studio-agent operator registers --json",
        "  studio-agent operator use-cases --register-id reg_123 --json",
        "  studio-agent operator use-case uc_123 --register-id reg_123 --json",
        "  studio-agent operator candidates --register-id reg_123 --json",
        "  studio-agent operator candidate cand_123 --register-id reg_123 --json",
        "  studio-agent operator candidate submit ./docs/agent-workflows/<slug>/manifest.json --register-id reg_123",
        "",
        "Required:",
        "  --api-key or KI_REGISTER_API_KEY",
        "  --operator-endpoint or KI_REGISTER_OPERATOR_ENDPOINT for non-production targets",
      ].join("\n") + "\n",
    );
    return;
  }

  const config = loadConfig();

  if (subcommand === "registers") {
    const defaults = await resolveOperatorDefaults(flags, config);
    const response = await getOperatorRegisters(defaults);
    const registers = Array.isArray(response?.registers)
      ? response.registers
      : [];

    emitOperatorResult(
      {
        ok: true,
        command: "operator registers",
        endpoint: defaults.endpoint,
        response,
        registers,
        message: `Loaded ${registers.length} register(s) from KI-Register.`,
      },
      Boolean(flags.json),
    );
    return;
  }

  if (subcommand === "use-cases" || subcommand === "usecases") {
    const defaults = await resolveOperatorDefaults(flags, config, {
      requireRegisterId: true,
    });
    const status = normalizeChoice(
      flags.status,
      REGISTER_USE_CASE_STATUS_VALUES,
      undefined,
      "--status",
    );
    const limit = normalizeText(flags.limit);
    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
      throw new Error("--limit must be a positive integer.");
    }

    const response = await getOperatorUseCases({
      ...defaults,
      status,
      searchText: normalizeText(flags["search-text"]),
      limit,
    });
    const useCases = Array.isArray(response?.useCases)
      ? response.useCases
      : [];

    emitOperatorResult(
      {
        ok: true,
        command: "operator use-cases",
        endpoint: defaults.endpoint,
        registerId: defaults.registerId,
        response,
        useCases,
        message: `Loaded ${useCases.length} use case(s) from register ${defaults.registerId}.`,
      },
      Boolean(flags.json),
    );
    return;
  }

  if (subcommand === "use-case" || subcommand === "usecase") {
    const useCaseId = normalizeText(positionals[2] ?? flags["use-case-id"]);
    if (!useCaseId) {
      throw new Error("operator use-case requires a use case id.");
    }

    const defaults = await resolveOperatorDefaults(flags, config, {
      requireRegisterId: true,
    });
    const response = await getOperatorUseCase({
      ...defaults,
      useCaseId,
    });

    emitOperatorResult(
      {
        ok: true,
        command: "operator use-case",
        endpoint: defaults.endpoint,
        registerId: defaults.registerId,
        useCaseId,
        response,
        useCase: response?.useCase ?? null,
        message: `Loaded use case ${useCaseId} from register ${defaults.registerId}.`,
      },
      Boolean(flags.json),
    );
    return;
  }

  if (subcommand === "candidates") {
    const defaults = await resolveOperatorDefaults(flags, config, {
      requireRegisterId: true,
    });
    const status = normalizeChoice(
      flags.status,
      AGENT_CANDIDATE_STATUS_VALUES,
      undefined,
      "--status",
    );
    const limit = normalizeText(flags.limit);
    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
      throw new Error("--limit must be a positive integer.");
    }

    const response = await getOperatorCandidates({
      ...defaults,
      status,
      limit,
    });
    const candidates = Array.isArray(response?.candidates)
      ? response.candidates
      : [];

    emitOperatorResult(
      {
        ok: true,
        command: "operator candidates",
        endpoint: defaults.endpoint,
        registerId: defaults.registerId,
        response,
        candidates,
        message: `Loaded ${candidates.length} candidate(s) from register ${defaults.registerId}.`,
      },
      Boolean(flags.json),
    );
    return;
  }

  if (subcommand === "candidate") {
    const action = normalizeText(positionals[2] ?? flags["candidate-id"]);
    if (!action) {
      throw new Error("operator candidate requires a candidate id or submit.");
    }

    const defaults = await resolveOperatorDefaults(flags, config, {
      requireRegisterId: true,
    });

    if (action === "submit") {
      const manifestTarget = normalizeText(positionals[3] ?? flags.input);
      if (!manifestTarget) {
        throw new Error("operator candidate submit requires a manifest path or workflow folder.");
      }

      const manifestPath = resolveManifestPath(manifestTarget);
      if (!existsSync(manifestPath)) {
        throw new Error(`Manifest not found: ${manifestPath}`);
      }

      const candidate = buildOperatorCandidatePayloadFromManifest({
        manifestPath,
        config,
        flags,
      });
      const response = await postOperatorCandidate({
        ...defaults,
        payload: candidate.payload,
      });

      emitOperatorResult(
        {
          ok: true,
          command: "operator candidate submit",
          endpoint: defaults.endpoint,
          registerId: defaults.registerId,
          manifestPath,
          response,
          candidate: response?.candidate ?? null,
          warnings: candidate.validation.warnings,
          message:
            typeof response?.candidate?.candidateId === "string"
              ? `Submitted candidate ${response.candidate.candidateId} for review.`
              : "Submitted candidate for review.",
        },
        Boolean(flags.json),
      );
      return;
    }

    const response = await getOperatorCandidate({
      ...defaults,
      candidateId: action,
    });

    emitOperatorResult(
      {
        ok: true,
        command: "operator candidate",
        endpoint: defaults.endpoint,
        registerId: defaults.registerId,
        candidateId: action,
        response,
        candidate: response?.candidate ?? null,
        message: `Loaded candidate ${action} from register ${defaults.registerId}.`,
      },
      Boolean(flags.json),
    );
    return;
  }

  throw new Error(`Unknown operator command: ${subcommand}`);
}

async function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  const command = positionals[0] ?? "help";

  if (flags.help || command === "help") {
    printHelp();
    return;
  }

  if (command === "onboard") {
    await runOnboard(flags);
    return;
  }

  if (command === "capture") {
    await runCapture(flags);
    return;
  }

  if (command === "interview") {
    await runInterview(flags);
    return;
  }

  if (command === "create") {
    runCreate(flags);
    return;
  }

  if (command === "validate") {
    runValidate(flags, positionals);
    return;
  }

  if (command === "submit") {
    await runSubmit(flags, positionals);
    return;
  }

  if (command === "operator") {
    await runOperator(flags, positionals);
    return;
  }

  if (command === "autopilot") {
    runAutopilot(flags, positionals);
    return;
  }

  if (command === "list") {
    runList(flags);
    return;
  }

  if (command === "template") {
    runTemplate(flags);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`studio-agent error: ${message}\n`);
  process.exit(1);
});
