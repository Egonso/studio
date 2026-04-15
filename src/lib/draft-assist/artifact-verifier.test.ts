import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyDraftAssistArtifact } from './artifact-verifier';

test('artifact verifier marks a fully specified customer-assist case as ready_for_handoff', () => {
  const result = verifyDraftAssistArtifact({
    draft: {
      documentationType: 'application',
      title: 'Support-Antwortentwuerfe mit ChatGPT',
      summary: 'ChatGPT erstellt erste Entwuerfe fuer Support-Antworten.',
      purpose:
        'ChatGPT erstellt erste Antwortentwuerfe fuer Kundenanfragen, die vor dem Versand durch einen Menschen geprueft werden.',
      ownerRole: 'Support Lead',
      usageContexts: ['CUSTOMERS'],
      decisionInfluence: 'PREPARATION',
      dataCategories: ['PERSONAL_DATA'],
      systems: [
        {
          position: 1,
          name: 'ChatGPT',
          providerType: 'MODEL',
        },
      ],
      triggers: [],
      steps: ['Support prueft jede Antwort vor dem Versand'],
      humansInLoop: ['Support-Agent prueft jede Antwort vor dem Versand'],
      risks: [],
      controls: ['Manuelle Freigabe bleibt verpflichtend'],
      artifacts: ['Support-Antwortentwurf'],
      tags: ['support'],
    },
    meta: {
      confidence: 'medium',
      missingFacts: [],
      assumptions: [],
    },
  });

  assert.equal(result.schemaValid, true);
  assert.equal(result.captureMappingValid, true);
  assert.ok(result.riskSuggestion);
  assert.equal(result.riskSuggestion?.suggestedRiskClass, 'LIMITED');
  assert.equal(result.riskSuggestion?.reviewRecommended, true);
  assert.equal(result.verdict, 'ready_for_handoff');
});

test('artifact verifier marks missing core facts as needs_input and adds duplicate hints carefully', () => {
  const result = verifyDraftAssistArtifact({
    draft: {
      documentationType: 'application',
      title: 'KI-gestuetzte Bewerbungs-Vorauswahl',
      purpose:
        'Ein KI-System soll Bewerbungen fuer eine menschliche Vorauswahl strukturieren und priorisieren.',
      ownerRole: 'People Lead',
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
      ],
      assumptions: [
        'Die finale Auswahlentscheidung bleibt bei einem Menschen.',
      ],
    },
    context: {
      registerId: 'reg_demo',
      registerName: 'Demo Register',
      organisationName: 'Acme GmbH',
      organisationUnit: 'HR',
      policyTitles: [],
      existingUseCaseCount: 1,
      existingUseCases: [
        {
          useCaseId: 'uc_existing',
          purpose: 'Bewerbungen fuer eine menschliche Vorauswahl strukturieren',
          status: 'REVIEWED',
          primarySystem: 'Greenhouse + KI-Modul',
          usageContexts: ['APPLICANTS'],
          decisionInfluence: 'PREPARATION',
          dataCategories: ['PERSONAL_DATA'],
        },
      ],
    },
  });

  assert.equal(result.schemaValid, true);
  assert.equal(result.captureMappingValid, true);
  assert.equal(result.verdict, 'needs_input');
  assert.ok(result.duplicateHints.length >= 1);
  assert.ok(result.openQuestions.length >= 2);
  assert.ok(result.riskSuggestion);
  assert.notEqual(result.riskSuggestion?.suggestedRiskClass, undefined);
});

test('artifact verifier blocks contradictory usage contexts even without schema failure', () => {
  const result = verifyDraftAssistArtifact({
    draft: {
      documentationType: 'application',
      title: 'Widerspruechlicher Entwurf',
      purpose:
        'Ein System soll interne Inhalte erzeugen und gleichzeitig direkt an Kunden ausgespielt werden.',
      ownerRole: 'Marketing Lead',
      usageContexts: ['INTERNAL_ONLY', 'CUSTOMERS'],
      decisionInfluence: 'ASSISTANCE',
      dataCategories: ['NO_PERSONAL_DATA'],
      systems: [
        {
          position: 1,
          name: 'ChatGPT',
          providerType: 'MODEL',
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
      confidence: 'medium',
      missingFacts: [],
      assumptions: [],
    },
  });

  assert.equal(result.schemaValid, true);
  assert.equal(result.captureMappingValid, true);
  assert.equal(result.verdict, 'blocked');
  assert.ok(
    result.reviewTriggers.some((trigger) =>
      trigger.toLowerCase().includes('widerspruechlich'),
    ),
  );
});
