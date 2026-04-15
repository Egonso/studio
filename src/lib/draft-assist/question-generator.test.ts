import assert from 'node:assert/strict';
import test from 'node:test';

import { generateDraftAssistQuestions } from './question-generator';

test('question generator deduplicates and limits to the next five useful questions', () => {
  const questions = generateDraftAssistQuestions({
    draft: {
      documentationType: 'application',
      title: 'Recruiting Assist',
      purpose:
        'Ein KI-System soll Bewerbungen vorsortieren und fuer eine menschliche Vorauswahl aufbereiten.',
      ownerRole: 'Unklar / fachliche Leitung',
      usageContexts: ['APPLICANTS'],
      decisionInfluence: 'PREPARATION',
      dataCategories: [],
      systems: [
        {
          position: 1,
          name: 'Nicht spezifiziertes KI-System',
        },
      ],
      triggers: [],
      steps: [],
      humansInLoop: [],
      risks: [],
      controls: [],
      artifacts: [],
      tags: [],
    },
    meta: {
      confidence: 'low',
      missingFacts: [
        'Welches konkrete KI-System oder welcher Anbieter wird fuer die Vorauswahl genutzt?',
        'Welche personenbezogenen oder sensiblen Daten werden fuer die Vorauswahl verarbeitet?',
        'Wer ist fuer diesen KI-Einsatz fachlich verantwortlich?',
      ],
      assumptions: [],
    },
    riskSuggestion: {
      suggestedRiskClass: 'HIGH',
      signalStrength: 'medium',
      reviewRecommended: true,
      reasons: ['Bewerber*innen sind betroffen.'],
      openQuestions: [
        'Unterstuetzt der Einsatzfall nur die Kommunikation mit Bewerber*innen oder auch Auswahl, Ranking oder Scoring?',
        'Welche personenbezogenen oder besondere sensible Daten werden verarbeitet?',
      ],
      sourceSignals: ['usage:APPLICANTS'],
    },
    duplicateHints: ['Aehnlicher bestehender Use Case im Register vorhanden.'],
  });

  assert.equal(questions.length, 5);
  assert.ok(
    questions.some((question) =>
      question.includes('Welches konkrete KI-System'),
    ),
  );
  assert.ok(
    questions.some((question) => question.includes('personenbezogenen')),
  );
  assert.ok(
    questions.some((question) => question.includes('fachlich verantwortlich')),
  );
  assert.ok(
    questions.some((question) => question.includes('Register')),
  );
  assert.ok(questions.every((question) => question.endsWith('?')));
});

test('question generator returns no questions when the draft is already clear', () => {
  const questions = generateDraftAssistQuestions({
    draft: {
      documentationType: 'application',
      title: 'Interne Wissenssuche',
      purpose:
        'Eine interne RAG-Pipeline beantwortet Wissensfragen fuer das IT-Team assistiv.',
      ownerRole: 'IT Lead',
      usageContexts: ['INTERNAL_ONLY'],
      decisionInfluence: 'ASSISTANCE',
      dataCategories: ['NO_PERSONAL_DATA'],
      systems: [
        {
          position: 1,
          name: 'Interne RAG-Pipeline',
          providerType: 'INTERNAL',
        },
      ],
      triggers: [],
      steps: [],
      humansInLoop: [],
      risks: [],
      controls: [],
      artifacts: [],
      tags: [],
    },
    meta: {
      confidence: 'high',
      missingFacts: [],
      assumptions: [],
    },
    riskSuggestion: {
      suggestedRiskClass: 'MINIMAL',
      signalStrength: 'medium',
      reviewRecommended: false,
      reasons: ['Der Einsatzfall wirkt rein intern und assistiv.'],
      openQuestions: [],
      sourceSignals: ['usage:INTERNAL_ONLY'],
    },
    duplicateHints: [],
  });

  assert.deepEqual(questions, []);
});
