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

const DEFAULT_OUT_DIR = path.join("docs", "agent-workflows");
const DEFAULT_SUBMIT_ENDPOINT = "https://kiregister.com/api/agent-kit/submit";
const CONFIG_DIR_NAME = ".studio-agent";
const CONFIG_FILE_NAME = "config.json";

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
    "",
    "Common flags:",
    "  --out-dir <path>        Target folder for generated workflow docs",
    "  --json                  Emit machine-readable JSON output",
    "  --force                 Overwrite an existing slug folder",
    "  --yes                   Skip the final confirmation prompt",
    "  --register-id <id>      Target KI-Register register id for submit",
    "  --endpoint <url>        Agent Kit submit API endpoint",
    "  --api-key <value>       Agent Kit API key (or use KI_REGISTER_API_KEY)",
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

async function postSubmitRequest({ endpoint, apiKey, registerId, manifest }) {
  const endpointUrl = new URL(endpoint);
  const requestBody = JSON.stringify({
    registerId,
    manifest,
  });

  return new Promise((resolve, reject) => {
    const transport = endpointUrl.protocol === "https:" ? httpsRequest : httpRequest;
    const request = transport(
      endpointUrl,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(requestBody),
          authorization: `Bearer ${apiKey}`,
          connection: "close",
        },
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
                : `Submit failed with ${statusCode}`;
            reject(new Error(message));
            return;
          }

          resolve(payload);
        });
      },
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error("Submit request timed out"));
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.write(requestBody);
    request.end();
  });
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
