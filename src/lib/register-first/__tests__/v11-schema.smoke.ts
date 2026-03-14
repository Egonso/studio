import assert from "node:assert/strict";
import {
  parseCaptureInput,
  parseUseCaseCard,
  createUseCaseCardDraft,
  createUseCaseCardV11Draft,
} from "../schema";
import {
  generatePublicHashId,
  generateGlobalUseCaseId,
  isValidGlobalUseCaseId,
  isValidPublicHashId,
} from "../id-generation";
import {
  migrateCardToV1_1,
  needsMigrationToV1_1,
  ensureV1_1Shape,
} from "../migration";
import {
  resolveOrderedSystemsFromCard,
  splitOrderedSystemsForStorage,
} from "../card-model";
import {
  createEmptyCaptureDraft,
  validateCaptureDraft,
  toCaptureInput,
} from "../capture-flow";

export async function runV11SchemaSmoke() {
  const now = new Date("2026-02-10T10:00:00.000Z");

  // ── 1. Canonical draft creation ───────────────────────────────────────
  const v10Card = createUseCaseCardDraft(
    {
      purpose: "Kundenfeedback analysieren",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
    },
    { useCaseId: "uc_v10_test", now }
  );
  assert.equal(v10Card.cardVersion, "1.1");
  assert.ok(v10Card.globalUseCaseId);
  assert.ok(v10Card.publicHashId);
  assert.equal(v10Card.toolId, undefined);
  assert.equal(v10Card.origin?.source, "manual");

  // ── 2. v1.1 card creation ─────────────────────────────────────────────
  const globalId = generateGlobalUseCaseId(now);
  const hashId = generatePublicHashId();

  assert.ok(isValidGlobalUseCaseId(globalId), `Invalid globalUseCaseId: ${globalId}`);
  assert.ok(isValidPublicHashId(hashId), `Invalid publicHashId: ${hashId}`);

  const v11Card = createUseCaseCardV11Draft(
    {
      purpose: "E-Mails automatisch kategorisieren",
      usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "UNSURE",
      affectedParties: ["GROUPS_OR_TEAMS"],
      toolId: "chatgpt_openai",
      dataCategory: "INTERNAL",
    },
    {
      useCaseId: "uc_v11_test",
      globalUseCaseId: globalId,
      publicHashId: hashId,
      now,
    }
  );

  assert.equal(v11Card.cardVersion, "1.1");
  assert.equal(v11Card.globalUseCaseId, globalId);
  assert.equal(v11Card.formatVersion, "v1.1");
  assert.equal(v11Card.toolId, "chatgpt_openai");
  assert.equal(v11Card.toolFreeText, undefined);
  assert.equal(v11Card.dataCategory, "INTERNAL_CONFIDENTIAL");
  assert.equal(v11Card.publicHashId, hashId);
  assert.equal(v11Card.isPublicVisible, false);
  // Existing fields unchanged
  assert.equal(v11Card.status, "UNREVIEWED");
  assert.equal(v11Card.purpose, "E-Mails automatisch kategorisieren");

  // ── 3. v1.1 with OTHER tool ──────────────────────────────────────────
  const v11OtherTool = createUseCaseCardV11Draft(
    {
      purpose: "Interne Dokumente zusammenfassen",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
      toolId: "other",
      toolFreeText: "Internes Python Script",
      dataCategory: "SENSITIVE",
    },
    {
      useCaseId: "uc_v11_other",
      globalUseCaseId: "EUKI-UC-123456",
      publicHashId: "abc123defgh9",
      now,
    }
  );
  assert.equal(v11OtherTool.toolId, "other");
  assert.equal(v11OtherTool.toolFreeText, "Internes Python Script");
  assert.equal(v11OtherTool.dataCategory, "SPECIAL_PERSONAL");

  // ── 4. OTHER tool without freeText should fail ────────────────────────
  assert.throws(() =>
    parseCaptureInput({
      purpose: "Dokumente scannen",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
      toolId: "other",
      // toolFreeText missing!
    })
  );

  // ── 5. Invalid globalUseCaseId format rejected ────────────────────────
  assert.throws(() =>
    parseUseCaseCard({
      ...v11Card,
      globalUseCaseId: "INVALID-FORMAT",
    })
  );

  // ── 6. ID generation uniqueness ───────────────────────────────────────
  const ids = new Set<string>();
  for (let i = 0; i < 50; i++) {
    ids.add(generatePublicHashId());
  }
  assert.equal(ids.size, 50, "50 generated publicHashIds must all be unique");

  // ── 7. Migration v1.0 → v1.1 ─────────────────────────────────────────
  assert.equal(needsMigrationToV1_1(v10Card), false);
  assert.equal(needsMigrationToV1_1(v11Card), false);

  const migrated = migrateCardToV1_1(v10Card, now);
  assert.equal(migrated.cardVersion, "1.1");
  assert.ok(migrated.globalUseCaseId);
  assert.ok(isValidGlobalUseCaseId(migrated.globalUseCaseId!));
  assert.ok(migrated.publicHashId);
  assert.ok(isValidPublicHashId(migrated.publicHashId!));
  assert.equal(migrated.formatVersion, "v1.1");
  assert.equal(migrated.dataCategory, "INTERNAL_CONFIDENTIAL");
  assert.equal(migrated.isPublicVisible, false);
  // Original fields preserved
  assert.equal(migrated.purpose, v10Card.purpose);
  assert.equal(migrated.useCaseId, v10Card.useCaseId);
  assert.equal(migrated.status, v10Card.status);

  // ── 8. Migration is idempotent ────────────────────────────────────────
  const migratedAgain = migrateCardToV1_1(migrated, now);
  assert.equal(migratedAgain.globalUseCaseId, migrated.globalUseCaseId);
  assert.equal(migratedAgain.publicHashId, migrated.publicHashId);

  // ── 9. ensureV1_1Shape ────────────────────────────────────────────────
  const shaped = ensureV1_1Shape(v10Card);
  assert.equal(shaped.cardVersion, "1.1");
  assert.ok(shaped.globalUseCaseId);

  const alreadyShaped = ensureV1_1Shape(v11Card);
  assert.equal(alreadyShaped, v11Card); // same reference, no copy

  // ── 10. Capture flow with v1.1 fields ─────────────────────────────────
  const draft = createEmptyCaptureDraft();
  assert.equal(draft.toolId, "");
  assert.equal(draft.toolFreeText, "");
  assert.equal(draft.dataCategory, null);

  // Validate draft with OTHER tool but no freeText
  const draftWithOther = {
    ...draft,
    purpose: "Test Zweck fuer Tool",
    usageContexts: ["INTERNAL_ONLY" as const],
    isCurrentlyResponsible: true,
    decisionImpact: "NO" as const,
    toolId: "other",
    toolFreeText: "",
  };
  const validation = validateCaptureDraft(draftWithOther);
  assert.equal(validation.isValid, false);
  assert.equal(validation.errors.toolFreeText, "Bitte gib den Tool-Namen ein.");

  // Valid draft with tool
  const validDraftWithTool = {
    ...draftWithOther,
    toolId: "google_gemini",
    toolFreeText: "",
    dataCategory: "PERSONAL" as const,
  };
  const validValidation = validateCaptureDraft(validDraftWithTool);
  assert.equal(validValidation.isValid, true);

  // toCaptureInput includes v1.1 fields
  const captureInput = toCaptureInput(validDraftWithTool);
  assert.equal(captureInput.toolId, "google_gemini");
  assert.equal(captureInput.dataCategory, "PERSONAL");

  // toCaptureInput without tool (v1.0-style draft)
  const legacyDraft = {
    ...draft,
    purpose: "Alter Eintrag",
    usageContexts: ["INTERNAL_ONLY" as const],
    isCurrentlyResponsible: true,
    decisionImpact: "NO" as const,
  };
  const legacyInput = toCaptureInput(legacyDraft);
  assert.equal(legacyInput.toolId, undefined);
  assert.equal(legacyInput.dataCategory, undefined);

  // ── 10b. Optional systemPublicInfo remains schema-valid ───────────────
  const withSystemCompliance = parseUseCaseCard({
    ...v11Card,
    systemPublicInfo: [
      {
        systemKey: "name:chatgpt",
        toolId: "chatgpt_openai",
        displayName: "ChatGPT",
        vendor: "OpenAI",
        providerType: "TOOL",
        publicInfo: {
          lastCheckedAt: "2026-03-14T09:00:00.000Z",
          checker: "perplexity",
          summary: "Vendor documents privacy resources publicly.",
          flags: {
            gdprClaim: "yes",
            aiActClaim: "not_found",
            trustCenterFound: "yes",
            privacyPolicyFound: "yes",
            dpaOrSccMention: "yes",
          },
          confidence: "medium",
          sources: [],
          disclaimerVersion: "v1",
        },
      },
    ],
  });
  assert.equal(withSystemCompliance.systemPublicInfo?.length, 1);
  assert.equal(withSystemCompliance.systemPublicInfo?.[0]?.displayName, "ChatGPT");

  // ── 11. dataCategory default ──────────────────────────────────────────
  const v11NoCategory = createUseCaseCardV11Draft(
    {
      purpose: "Ohne Kategorie testen",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
      toolId: "deepl",
      // dataCategory not provided
    },
    {
      useCaseId: "uc_no_cat",
      globalUseCaseId: "EUKI-UC-000099",
      publicHashId: "testdefault9",
      now,
    }
  );
  assert.equal(v11NoCategory.dataCategory, "INTERNAL_CONFIDENTIAL"); // default

  // ── 12. workflow support stays canonical and ordered ─────────────────
  const workflowCapture = parseCaptureInput({
    purpose: "Mehrere Systeme erfassen",
    usageContexts: ["INTERNAL_ONLY"],
    isCurrentlyResponsible: true,
    decisionImpact: "NO",
    toolId: "perplexity_api",
    workflow: {
      additionalSystems: [
        {
          entryId: "step_3",
          position: 9,
          toolFreeText: "Interner Bild-Webhook",
        },
        {
          entryId: "step_2",
          position: 4,
          toolId: "gemini_api",
        },
      ],
      connectionMode: "fully_automated",
      summary: "  Recherche -> Text -> Bild  ",
    },
  });
  assert.equal(workflowCapture.workflow?.connectionMode, "FULLY_AUTOMATED");
  assert.equal(workflowCapture.workflow?.summary, "Recherche -> Text -> Bild");
  assert.deepEqual(workflowCapture.workflow?.additionalSystems, [
    {
      entryId: "step_2",
      position: 2,
      toolId: "gemini_api",
      toolFreeText: undefined,
    },
    {
      entryId: "step_3",
      position: 3,
      toolId: "other",
      toolFreeText: "Interner Bild-Webhook",
    },
  ]);

  const workflowCard = createUseCaseCardV11Draft(
    workflowCapture,
    {
      useCaseId: "uc_workflow",
      globalUseCaseId: "EUKI-UC-123499",
      publicHashId: "workflow1234",
      now,
    }
  );
  assert.equal(workflowCard.toolId, "perplexity_api");
  assert.equal(workflowCard.workflow?.connectionMode, "FULLY_AUTOMATED");
  assert.equal(workflowCard.workflow?.additionalSystems.length, 2);

  const orderedSystems = resolveOrderedSystemsFromCard(workflowCard);
  assert.deepEqual(orderedSystems.map((entry) => entry.toolId), [
    "perplexity_api",
    "gemini_api",
    "other",
  ]);

  const splitSystems = splitOrderedSystemsForStorage(orderedSystems, {
    workflow: workflowCard.workflow,
  });
  assert.equal(splitSystems.toolId, "perplexity_api");
  assert.equal(splitSystems.workflow?.additionalSystems.length, 2);
  assert.equal(splitSystems.workflow?.additionalSystems[0].position, 2);

  console.log("v1.1 schema smoke tests passed.");
}

// Allow direct execution
runV11SchemaSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
