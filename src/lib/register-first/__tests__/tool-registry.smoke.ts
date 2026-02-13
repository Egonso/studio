import assert from "node:assert/strict";
import {
  toToolSlug,
  TOOL_ID_OTHER,
  TOOL_TYPES,
  DATA_CATEGORIES,
  toolTypeSchema,
  dataCategorySchema,
  toolRegistryEntrySchema,
  type ToolRegistryEntry,
} from "../tool-registry-types.ts";

export async function runToolRegistrySmoke() {
  // ── Slug generation ─────────────────────────────────────────────────────
  assert.equal(toToolSlug("ChatGPT (OpenAI)"), "chatgpt_openai");
  assert.equal(toToolSlug("Microsoft Copilot"), "microsoft_copilot");
  assert.equal(toToolSlug("Meta Llama (self-hosted)"), "meta_llama_self_hosted");
  assert.equal(toToolSlug("AWS Bedrock"), "aws_bedrock");
  assert.equal(toToolSlug("Otter.ai"), "otter_ai");
  assert.equal(toToolSlug("Beautiful.ai"), "beautiful_ai");
  assert.equal(toToolSlug("  Leading Spaces  "), "leading_spaces");

  // ── TOOL_ID_OTHER sentinel ──────────────────────────────────────────────
  assert.equal(TOOL_ID_OTHER, "other");

  // ── Enum arrays exist and have expected values ──────────────────────────
  assert.ok(TOOL_TYPES.includes("LLM"));
  assert.ok(TOOL_TYPES.includes("GENAI_SUITE"));
  assert.ok(TOOL_TYPES.includes("CODE_ASSISTANT"));
  assert.ok(TOOL_TYPES.includes("IMAGE_GEN"));
  assert.ok(TOOL_TYPES.includes("OTHER"));
  assert.ok(TOOL_TYPES.length >= 10);

  assert.deepEqual([...DATA_CATEGORIES], ["NONE", "INTERNAL", "PERSONAL", "SENSITIVE"]);

  // ── Zod toolType validation ─────────────────────────────────────────────
  assert.equal(toolTypeSchema.parse("LLM"), "LLM");
  assert.equal(toolTypeSchema.parse("SEARCH"), "SEARCH");
  assert.throws(() => toolTypeSchema.parse("INVALID_TYPE"));
  assert.throws(() => toolTypeSchema.parse(""));
  assert.throws(() => toolTypeSchema.parse(42));

  // ── Zod dataCategory validation ─────────────────────────────────────────
  assert.equal(dataCategorySchema.parse("NONE"), "NONE");
  assert.equal(dataCategorySchema.parse("SENSITIVE"), "SENSITIVE");
  assert.throws(() => dataCategorySchema.parse("PUBLIC"));
  assert.throws(() => dataCategorySchema.parse(null));

  // ── Zod toolRegistryEntry validation ────────────────────────────────────
  const validEntry: ToolRegistryEntry = {
    toolId: "openai_chatgpt",
    vendor: "OpenAI",
    productName: "ChatGPT",
    toolType: "LLM",
    homepage: "https://openai.com/chatgpt",
    isActive: true,
    createdAtISO: "2025-01-01T00:00:00.000Z",
  };

  const parsed = toolRegistryEntrySchema.parse(validEntry);
  assert.equal(parsed.toolId, "openai_chatgpt");
  assert.equal(parsed.vendor, "OpenAI");
  assert.equal(parsed.productName, "ChatGPT");
  assert.equal(parsed.toolType, "LLM");
  assert.equal(parsed.homepage, "https://openai.com/chatgpt");

  // Homepage can be null
  const nullHomepage = toolRegistryEntrySchema.parse({
    ...validEntry,
    homepage: null,
  });
  assert.equal(nullHomepage.homepage, null);

  // toolId must match regex (lowercase, alphanumeric, underscores)
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, toolId: "UPPERCASE" })
  );
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, toolId: "has-dashes" })
  );
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, toolId: "" })
  );

  // vendor required
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, vendor: "" })
  );

  // productName required
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, productName: "" })
  );

  // invalid toolType
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, toolType: "MAGIC" })
  );

  // invalid homepage (not a URL)
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, homepage: "not-a-url" })
  );

  // invalid datetime
  assert.throws(() =>
    toolRegistryEntrySchema.parse({ ...validEntry, createdAtISO: "yesterday" })
  );

  console.log("Tool-Registry smoke tests passed.");
}

// Allow direct execution
runToolRegistrySmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
