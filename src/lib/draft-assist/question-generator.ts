import {
  DraftAssistDraftSchema,
  DraftAssistDraftMetaSchema,
  DraftAssistRiskSuggestionSchema,
  type DraftAssistDraft,
  type DraftAssistDraftMeta,
  type DraftAssistRiskSuggestion,
} from './types';

export interface GenerateDraftAssistQuestionsInput {
  draft: DraftAssistDraft;
  meta: DraftAssistDraftMeta;
  riskSuggestion?: DraftAssistRiskSuggestion | null;
  duplicateHints?: string[];
}

function normalizeQuestionText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withoutTrailingPunctuation = trimmed.replace(/[.!\s]+$/g, '');
  if (!withoutTrailingPunctuation) {
    return null;
  }

  const capitalized =
    withoutTrailingPunctuation.charAt(0).toUpperCase() +
    withoutTrailingPunctuation.slice(1);

  return capitalized.endsWith('?') ? capitalized : `${capitalized}?`;
}

function questionFromMissingFact(value: string): string {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();

  if (/verantwort/i.test(normalized)) {
    return 'Wer ist fuer diesen KI-Einsatz fachlich verantwortlich?';
  }

  if (
    lower.includes('welches konkrete ki-system') ||
    lower.includes('welcher anbieter') ||
    lower.includes('konkrete system')
  ) {
    return 'Welches konkrete KI-System oder welcher Anbieter wird hier eingesetzt?';
  }

  if (
    lower.includes('personenbezogen') ||
    lower.includes('sensible daten') ||
    lower.includes('daten verarbeitet')
  ) {
    return 'Wird mit personenbezogenen oder besonders sensiblen Daten gearbeitet?';
  }

  if (
    lower.includes('kunden') ||
    lower.includes('bewerber') ||
    lower.includes('mitarbeitende') ||
    lower.includes('oeffentlichkeit')
  ) {
    return 'Sehen Kunden, Bewerber oder Mitarbeitende das Ergebnis direkt?';
  }

  return normalizeQuestionText(normalized) ?? 'Was ist fuer diesen KI-Einsatz noch unklar?';
}

export function generateDraftAssistQuestions(
  input: GenerateDraftAssistQuestionsInput,
): string[] {
  const draft = DraftAssistDraftSchema.parse(input.draft);
  const meta = DraftAssistDraftMetaSchema.parse(input.meta);
  const riskSuggestion = input.riskSuggestion
    ? DraftAssistRiskSuggestionSchema.parse(input.riskSuggestion)
    : null;
  const questions: string[] = [];
  const seen = new Set<string>();

  function addQuestion(value: string | null | undefined) {
    const normalized = value ? normalizeQuestionText(value) : null;
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    questions.push(normalized);
  }

  for (const missingFact of meta.missingFacts) {
    addQuestion(questionFromMissingFact(missingFact));
  }

  if ((input.duplicateHints?.length ?? 0) > 0) {
    addQuestion(
      'Gibt es dafuer bereits einen aehnlichen Use Case im Register, der zusammengefuehrt werden sollte?',
    );
  }

  for (const question of riskSuggestion?.openQuestions ?? []) {
    addQuestion(question);
  }

  if (
    draft.ownerRole.toLowerCase().includes('unklar') &&
    !questions.some((question) => question.toLowerCase().includes('verantwort'))
  ) {
    addQuestion('Wer ist fuer diesen KI-Einsatz fachlich verantwortlich?');
  }

  if (
    draft.systems.some((system) =>
      system.name.toLowerCase().includes('nicht spezifiziertes ki-system'),
    ) &&
    !questions.some((question) => question.toLowerCase().includes('ki-system'))
  ) {
    addQuestion('Welches konkrete KI-System oder welcher Anbieter wird hier eingesetzt?');
  }

  return questions.slice(0, 5);
}
