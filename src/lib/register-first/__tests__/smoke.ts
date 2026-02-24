import assert from "node:assert/strict";
import {
  assertManualGovernanceDecision,
  createUseCaseCardDraft,
  parseCaptureInput,
} from "../schema";
import {
  getRegisterFirstFeatureFlags,
  registerFirstDefaultFlags,
} from "../flags";
import {
  getNextManualStatuses,
  getOutputProfileByStatus,
} from "../status-flow";
import {
  buildCaptureHref,
  buildRegisterHref,
  isHybridEntryEnabled,
} from "../entry-links";
import {
  createProofPackDraftExport,
  createUseCasePassExport,
  getProofPackPdfState,
  getProofPackDraftFileName,
  getStatusGatedOutputState,
  getUseCasePassFileName,
} from "../output";
import {
  createProofPackDocument,
  createProofPackPdfBlob,
  getProofPackPdfFileName,
} from "../proof-pack";
import { validateVerifyLinkInput } from "../verify-link";
import {
  createEmptyCaptureDraft,
  shouldShowAffectedParties,
  submitCaptureDraft,
  type CaptureFormDraft,
  validateCaptureDraft,
} from "../capture-flow";

export async function runFoundationSmoke() {
  const parsed = parseCaptureInput({
    purpose: "Support-Anfragen priorisieren",
    usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
    isCurrentlyResponsible: true,
    decisionImpact: "UNSURE",
    affectedParties: ["GROUPS_OR_TEAMS"],
  });

  assert.equal(parsed.purpose, "Support-Anfragen priorisieren");
  assert.deepEqual(parsed.usageContexts, ["INTERNAL_ONLY", "EMPLOYEE_FACING"]);

  assert.throws(() =>
    parseCaptureInput({
      purpose: "Bewerbungen vorsortieren",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: false,
      decisionImpact: "YES",
      affectedParties: ["INDIVIDUALS"],
    })
  );

  const card = createUseCaseCardDraft(
    {
      purpose: "Marketing-Texte erstellen",
      usageContexts: ["CUSTOMER_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
    },
    {
      useCaseId: "uc_001",
      now: new Date("2026-02-07T12:00:00.000Z"),
    }
  );

  assert.equal(card.status, "UNREVIEWED");
  assert.equal(card.cardVersion, "1.0");

  assert.doesNotThrow(() => assertManualGovernanceDecision("HUMAN"));
  assert.throws(() => assertManualGovernanceDecision("AUTOMATION"));

  const defaultFlags = getRegisterFirstFeatureFlags({});
  assert.deepEqual(defaultFlags, registerFirstDefaultFlags);

  const envFlags = getRegisterFirstFeatureFlags({
    NEXT_PUBLIC_REGISTER_FIRST_ENABLED: "true",
    NEXT_PUBLIC_REGISTER_FIRST_HYBRID_ENTRY: "1",
    NEXT_PUBLIC_REGISTER_FIRST_STICKY_LAUNCHER: "on",
    NEXT_PUBLIC_REGISTER_FIRST_PROOF_GATE: "yes",
  });
  assert.equal(envFlags.enabled, true);
  assert.equal(envFlags.hybridEntry, true);
  assert.equal(envFlags.stickyLauncher, true);
  assert.equal(envFlags.proofGate, true);
  assert.equal(isHybridEntryEnabled(envFlags), true);
  assert.equal(isHybridEntryEnabled(registerFirstDefaultFlags), false);
  assert.equal(buildRegisterHref("project_123"), "/register?projectId=project_123");
  assert.equal(buildRegisterHref(undefined), "/register");
  assert.equal(
    buildCaptureHref("project alpha"),
    "/register/capture?projectId=project%20alpha"
  );
  assert.equal(buildCaptureHref(null), "/register/capture");

  assert.deepEqual(getNextManualStatuses("UNREVIEWED"), [
    "REVIEW_RECOMMENDED",
    "REVIEWED",
  ]);
  assert.deepEqual(getNextManualStatuses("PROOF_READY"), ["REVIEWED"]);
  assert.equal(getOutputProfileByStatus("UNREVIEWED").artifactName, "Raw Register Card");
  assert.equal(getOutputProfileByStatus("PROOF_READY").requiresManualDecision, true);

  const rawOutputState = getStatusGatedOutputState("UNREVIEWED", envFlags);
  assert.equal(rawOutputState.tier, "RAW");
  assert.equal(rawOutputState.cardJsonEnabled, true);
  assert.equal(rawOutputState.proofPackDraftEnabled, false);
  assert.equal(
    rawOutputState.proofPackDraftBlockedReason,
    "Proof-Pack-Entwurf ist erst im Status PROOF_READY verfuegbar."
  );

  const proofDisabledState = getStatusGatedOutputState("PROOF_READY", {
    ...envFlags,
    proofGate: false,
  });
  assert.equal(proofDisabledState.proofPackDraftEnabled, false);
  assert.equal(
    proofDisabledState.proofPackDraftBlockedReason,
    "Proof-Pack-Entwurf ist per Feature-Flag deaktiviert (registerFirst.proofGate=false)."
  );

  const proofEnabledState = getStatusGatedOutputState("PROOF_READY", envFlags);
  assert.equal(proofEnabledState.tier, "PROOF_READY");
  assert.equal(proofEnabledState.proofPackDraftEnabled, true);
  assert.equal(proofEnabledState.proofPackDraftBlockedReason, null);

  const useCasePassExport = createUseCasePassExport({
    ...card,
    status: "PROOF_READY",
  });
  assert.equal(useCasePassExport.schemaVersion, "1.0");
  assert.equal(useCasePassExport.outputTier, "PROOF_READY");
  assert.equal(getUseCasePassFileName("uc_001"), "euki-use-case-pass-uc_001.json");
  assert.equal(
    getProofPackDraftFileName("uc_001"),
    "euki-proof-pack-draft-uc_001.json"
  );
  assert.equal(getProofPackPdfFileName("uc_001"), "euki-proof-pack-uc_001.pdf");

  assert.throws(() => createProofPackDraftExport(card));
  const proofReadyCard = {
    ...card,
    status: "PROOF_READY",
    proof: {
      verifyUrl: "https://example.org/verify/uc_001",
      generatedAt: "2026-02-08T11:00:00.000Z",
      verification: {
        isReal: true,
        isCurrent: true,
        scope: "marketing copy",
      },
    },
  } as const;

  const proofPackDraft = createProofPackDraftExport(proofReadyCard);
  assert.equal(proofPackDraft.status, "PROOF_READY");
  assert.equal(proofPackDraft.verifyLink.url, "https://example.org/verify/uc_001");

  const proofPdfBlockedByStatus = getProofPackPdfState(card, envFlags);
  assert.equal(proofPdfBlockedByStatus.enabled, false);
  assert.equal(
    proofPdfBlockedByStatus.blockedReason,
    "Proof Pack (PDF) ist erst im Status PROOF_READY verfuegbar."
  );

  const proofPdfBlockedByFlag = getProofPackPdfState(proofReadyCard, {
    ...envFlags,
    proofGate: false,
  });
  assert.equal(proofPdfBlockedByFlag.enabled, false);
  assert.equal(
    proofPdfBlockedByFlag.blockedReason,
    "Proof Pack (PDF) ist per Feature-Flag deaktiviert (registerFirst.proofGate=false)."
  );

  const proofPdfEnabled = getProofPackPdfState(proofReadyCard, envFlags);
  assert.equal(proofPdfEnabled.enabled, true);
  assert.equal(proofPdfEnabled.blockedReason, null);

  const proofPackDocument = createProofPackDocument(proofReadyCard);
  assert.equal(proofPackDocument.status, "PROOF_READY");
  assert.equal(proofPackDocument.verifyLink.scope, "marketing copy");
  const proofPackPdfBlob = createProofPackPdfBlob(proofReadyCard);
  assert.equal(proofPackPdfBlob.type, "application/pdf");
  const pdfBytes = new Uint8Array(await proofPackPdfBlob.arrayBuffer());
  const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 8));
  assert.equal(pdfHeader.startsWith("%PDF-1."), true);

  const validVerifyLink = validateVerifyLinkInput({
    verifyUrl: "https://example.org/verify/uc_001",
    scope: "Supportprozess",
  });
  assert.equal(validVerifyLink.isValid, true);
  assert.equal(validVerifyLink.errors.verifyUrl, undefined);
  assert.equal(validVerifyLink.errors.scope, undefined);

  const invalidVerifyLink = validateVerifyLinkInput({
    verifyUrl: "not-a-url",
    scope: "",
  });
  assert.equal(invalidVerifyLink.isValid, false);
  assert.equal(
    invalidVerifyLink.errors.verifyUrl,
    "Verify URL muss eine gueltige http(s)-Adresse sein."
  );
  assert.equal(invalidVerifyLink.errors.scope, "Scope ist erforderlich.");

  const oversizedScope = validateVerifyLinkInput({
    verifyUrl: "https://example.org/verify/uc_001",
    scope: "x".repeat(201),
  });
  assert.equal(oversizedScope.isValid, false);
  assert.equal(
    oversizedScope.errors.scope,
    "Scope darf maximal 200 Zeichen enthalten."
  );

  const emptyDraft = createEmptyCaptureDraft();
  const validation = validateCaptureDraft(emptyDraft);
  assert.equal(validation.isValid, false);
  assert.equal(typeof validation.errors.purpose, "string");
  assert.equal(typeof validation.errors.usageContexts, "string");
  assert.equal(typeof validation.errors.isCurrentlyResponsible, "string");
  assert.equal(typeof validation.errors.decisionInfluence, "string");

  assert.equal(shouldShowAffectedParties("YES"), true);
  assert.equal(shouldShowAffectedParties("UNSURE"), true);
  assert.equal(shouldShowAffectedParties("NO"), false);

  const validDraft: CaptureFormDraft = {
    purpose: "Support-Tickets vorqualifizieren",
    usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
    isCurrentlyResponsible: false,
    responsibleParty: "Leitung Service",
    decisionImpact: "YES",
    decisionInfluence: "PREPARATION",
    affectedParties: ["GROUPS_OR_TEAMS"],
    toolId: "",
    toolFreeText: "",
    dataCategory: null,
    dataCategories: [],
  };

  let capturedPurpose = "";
  const submitOk = await submitCaptureDraft(validDraft, async (payload) => {
    capturedPurpose = payload.purpose;
    return { useCaseId: "uc_test" };
  });

  assert.equal(submitOk.ok, true);
  assert.equal(capturedPurpose, "Support-Tickets vorqualifizieren");

  let saveInvoked = false;
  const submitInvalid = await submitCaptureDraft(createEmptyCaptureDraft(), async () => {
    saveInvoked = true;
    return { useCaseId: "uc_should_not_happen" };
  });

  assert.equal(submitInvalid.ok, false);
  assert.equal(saveInvoked, false);

  console.log("Register-First foundation smoke tests passed.");
}
