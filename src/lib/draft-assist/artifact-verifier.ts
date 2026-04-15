import aiToolsRegistry from '@/data/ai-tools-registry.json';
import type { AiToolsRegistryEntry } from '@/lib/register-first/tool-registry-types';
import { suggestRiskClass, type CaptureUsageContext } from '@/lib/register-first';
import {
  DraftAssistContextSchema,
  DraftAssistDraftMetaSchema,
  DraftAssistDraftSchema,
  DraftAssistVerifierSchema,
  type DraftAssistContext,
  type DraftAssistDraft,
  type DraftAssistDraftMeta,
  type DraftAssistRiskSuggestion,
  type DraftAssistVerifier,
} from './types';
import { buildDraftAssistCaptureHandoff } from './build-capture-handoff';
import { generateDraftAssistQuestions } from './question-generator';

export interface VerifyDraftAssistArtifactInput {
  draft: unknown;
  meta?: unknown;
  context?: DraftAssistContext | null;
}

const TOOL_REGISTRY = aiToolsRegistry as AiToolsRegistryEntry[];

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 4);
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token));
  const union = new Set([...leftTokens, ...rightTokens]);
  return intersection.length / union.size;
}

function hasMeaningfulPurpose(value: string): boolean {
  return value.replace(/\s+/g, '').length >= 18;
}

function isGenericSystemLabel(value: string): boolean {
  const normalized = normalizeText(value);
  return (
    normalized === 'nicht spezifiziertes ki system' ||
    normalized === 'unbekanntes ki system' ||
    normalized === 'ki system nicht spezifiziert'
  );
}

function hasGenericPrimarySystem(draft: DraftAssistDraft): boolean {
  return isGenericSystemLabel(draft.systems[0]?.name ?? '');
}

function findMatchedToolRiskLevel(
  draft: DraftAssistDraft,
): AiToolsRegistryEntry['riskLevel'] | null {
  const primarySystem = draft.systems[0]?.name;
  if (!primarySystem) {
    return null;
  }

  const normalizedPrimarySystem = normalizeText(primarySystem);
  if (!normalizedPrimarySystem || isGenericSystemLabel(primarySystem)) {
    return null;
  }

  for (const entry of TOOL_REGISTRY) {
    const productName = normalizeText(entry.productName);
    const vendor = normalizeText(entry.vendor);
    const aliases = [
      productName,
      normalizeText(`${entry.productName} ${entry.vendor}`),
      vendor,
      normalizeText(`${entry.vendor} ${entry.productName}`),
    ];

    if (
      aliases.some(
        (alias) =>
          alias.length > 0 &&
          (normalizedPrimarySystem === alias ||
            normalizedPrimarySystem.includes(alias) ||
            alias.includes(normalizedPrimarySystem)),
      )
    ) {
      return entry.riskLevel;
    }
  }

  return null;
}

function buildDuplicateHints(
  draft: DraftAssistDraft,
  context: DraftAssistContext | null | undefined,
): string[] {
  if (!context || context.existingUseCases.length === 0) {
    return [];
  }

  const primarySystem = normalizeText(draft.systems[0]?.name);
  const draftPurpose = draft.purpose;
  const hints: Array<{ message: string; score: number }> = [];

  for (const existingUseCase of context.existingUseCases) {
    const similarity = tokenSimilarity(draftPurpose, existingUseCase.purpose);
    const existingSystem = normalizeText(existingUseCase.primarySystem);
    const sameSystem =
      primarySystem.length > 0 &&
      existingSystem.length > 0 &&
      (primarySystem === existingSystem ||
        primarySystem.includes(existingSystem) ||
        existingSystem.includes(primarySystem));
    const hasUsageOverlap = existingUseCase.usageContexts.some((usageContext) =>
      draft.usageContexts.includes(usageContext),
    );

    const shouldFlag =
      similarity >= 0.74 ||
      (sameSystem && similarity >= 0.34) ||
      (hasUsageOverlap && similarity >= 0.58);

    if (!shouldFlag) {
      continue;
    }

    const suffixParts = [`Status: ${existingUseCase.status}`];
    if (existingUseCase.primarySystem) {
      suffixParts.push(`System: ${existingUseCase.primarySystem}`);
    }

    hints.push({
      message: `Aehnlicher bestehender Use Case im Register: "${existingUseCase.purpose}" (${suffixParts.join(' | ')}).`,
      score: similarity + Number(sameSystem) * 0.2 + Number(hasUsageOverlap) * 0.1,
    });
  }

  return hints
    .sort((left, right) => right.score - left.score)
    .map((hint) => hint.message)
    .slice(0, 3);
}

function buildReviewTriggers(input: {
  draft: DraftAssistDraft;
  duplicateHints: string[];
  riskSuggestion: DraftAssistRiskSuggestion | null;
  blockingIssues: string[];
}): string[] {
  const triggers: string[] = [];
  const { draft, duplicateHints, riskSuggestion, blockingIssues } = input;

  if (blockingIssues.length > 0) {
    triggers.push(...blockingIssues);
  }

  if (draft.usageContexts.includes('APPLICANTS')) {
    triggers.push(
      'Bewerberbezug: Auswahl-, Ranking- oder Scoring-Logik manuell pruefen.',
    );
  }

  if (
    draft.usageContexts.includes('CUSTOMERS') ||
    draft.usageContexts.includes('PUBLIC')
  ) {
    triggers.push(
      'Externe Sichtbarkeit: Transparenz- und Kommunikationspflichten manuell pruefen.',
    );
  }

  if (
    draft.dataCategories.includes('PERSONAL_DATA') ||
    draft.dataCategories.includes('SPECIAL_PERSONAL') ||
    draft.dataCategories.includes('HEALTH_DATA') ||
    draft.dataCategories.includes('BIOMETRIC_DATA') ||
    draft.dataCategories.includes('POLITICAL_RELIGIOUS') ||
    draft.dataCategories.includes('OTHER_SENSITIVE')
  ) {
    triggers.push(
      'Personenbezogene oder sensible Daten: Datenkategorien und Schutzmassnahmen manuell pruefen.',
    );
  }

  if (
    draft.decisionInfluence === 'PREPARATION' ||
    draft.decisionInfluence === 'AUTOMATED'
  ) {
    triggers.push(
      'Entscheidungseinfluss: menschliche Kontrolle und Freigabeschritt dokumentieren.',
    );
  }

  if (riskSuggestion?.suggestedRiskClass === 'HIGH') {
    triggers.push(
      'Hohes Risikosignal: Risikoklasse und Zweckgrenzen vor Handoff manuell pruefen.',
    );
  }

  if (riskSuggestion?.suggestedRiskClass === 'PROHIBITED') {
    triggers.push(
      'Potenziell verbotene Praxis: sofortige manuelle Eskalation und Zweckpruefung noetig.',
    );
  }

  if (duplicateHints.length > 0) {
    triggers.push(
      'Moeglicher Doppel-Eintrag: aehnliche bestehende Use Cases im Register abgleichen.',
    );
  }

  if (draft.systems.some((system) => isGenericSystemLabel(system.name))) {
    triggers.push(
      'Konkretes System noch unklar: Anbieter oder Eigenentwicklung vor Uebernahme benennen.',
    );
  }

  return [...new Set(triggers)].slice(0, 8);
}

function buildBlockingIssues(draft: DraftAssistDraft): string[] {
  const issues: string[] = [];

  if (!hasMeaningfulPurpose(draft.purpose)) {
    issues.push(
      'Der Entwurf ist noch zu unkonkret fuer einen sicheren Handoff in den Capture-Flow.',
    );
  }

  if (
    draft.usageContexts.includes('INTERNAL_ONLY') &&
    draft.usageContexts.some((context) => context !== 'INTERNAL_ONLY')
  ) {
    issues.push(
      'Wirkungsbereich widerspruechlich: INTERNAL_ONLY darf nicht mit externen oder mitarbeiterbezogenen Wirkungen kombiniert werden.',
    );
  }

  return issues;
}

function blockedResult(input: {
  meta: DraftAssistDraftMeta;
  reviewTriggers: string[];
  openQuestions?: string[];
}): DraftAssistVerifier {
  return DraftAssistVerifierSchema.parse({
    schemaValid: false,
    captureMappingValid: false,
    missingFacts: input.meta.missingFacts,
    duplicateHints: [],
    reviewTriggers: input.reviewTriggers,
    riskSuggestion: null,
    openQuestions: input.openQuestions ?? [],
    verdict: 'blocked',
  });
}

export function verifyDraftAssistArtifact(
  input: VerifyDraftAssistArtifactInput,
): DraftAssistVerifier {
  const parsedMeta = DraftAssistDraftMetaSchema.parse(
    input.meta ?? {
      confidence: 'low',
      missingFacts: [],
      assumptions: [],
    },
  );
  const context = input.context
    ? DraftAssistContextSchema.parse(input.context)
    : null;

  let parsedDraft: DraftAssistDraft;
  try {
    parsedDraft = DraftAssistDraftSchema.parse(input.draft);
  } catch {
    return blockedResult({
      meta: parsedMeta,
      reviewTriggers: [
        'Der Entwurf ist nicht manifest-konform und muss neu erzeugt oder ueberarbeitet werden.',
      ],
      openQuestions: [
        'Kannst du den KI-Einsatz bitte noch einmal konkret in 2-5 Saetzen beschreiben?',
      ],
    });
  }

  let schemaValid = true;
  let captureMappingValid = true;

  try {
    buildDraftAssistCaptureHandoff(parsedDraft);
  } catch {
    schemaValid = false;
    captureMappingValid = false;
  }

  const duplicateHints = buildDuplicateHints(parsedDraft, context);
  const blockingIssues = buildBlockingIssues(parsedDraft);

  let riskSuggestion: DraftAssistRiskSuggestion | null = null;
  if (captureMappingValid) {
    const handoff = buildDraftAssistCaptureHandoff(parsedDraft);
    riskSuggestion = suggestRiskClass({
      purpose: handoff.captureInput.purpose,
      usageContexts: handoff.captureInput.usageContexts as CaptureUsageContext[],
      decisionInfluence: handoff.captureInput.decisionInfluence ?? null,
      dataCategories: handoff.captureInput.dataCategories ?? null,
      toolId: handoff.captureInput.toolId ?? null,
      toolFreeText: handoff.captureInput.toolFreeText ?? null,
      toolRiskLevel: findMatchedToolRiskLevel(parsedDraft),
    });
  }

  const reviewTriggers = buildReviewTriggers({
    draft: parsedDraft,
    duplicateHints,
    riskSuggestion,
    blockingIssues,
  });

  const openQuestions = generateDraftAssistQuestions({
    draft: parsedDraft,
    meta: parsedMeta,
    riskSuggestion,
    duplicateHints,
  });

  const verdict =
    !schemaValid || !captureMappingValid || blockingIssues.length > 0
      ? 'blocked'
      : parsedMeta.missingFacts.length > 0 ||
          (hasGenericPrimarySystem(parsedDraft) && openQuestions.length > 0) ||
          (riskSuggestion?.suggestedRiskClass === 'UNASSESSED' &&
            openQuestions.length > 0)
        ? 'needs_input'
        : 'ready_for_handoff';

  return DraftAssistVerifierSchema.parse({
    schemaValid,
    captureMappingValid,
    missingFacts: parsedMeta.missingFacts,
    duplicateHints,
    reviewTriggers,
    riskSuggestion,
    openQuestions,
    verdict,
  });
}
