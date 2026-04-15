import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRegisterCaptureFromManifest,
  parseStudioUseCaseManifest,
} from '@/lib/agent-kit/manifest';

import { generateDraftAssistWith } from '../draft-assist-generate';

test('generateDraftAssistWith rejects descriptions that are too short', async () => {
  await assert.rejects(
    () =>
      generateDraftAssistWith(
        {
          description: 'Zu kurz fuer einen reviewbaren Draft.',
        },
        async () => {
          throw new Error('prompt runner should not be called');
        },
      ),
    /at least 50 character/,
  );
});

test('generateDraftAssistWith returns a manifest-near draft without final governance fields', async () => {
  const result = await generateDraftAssistWith(
    {
      description:
        'Das Support-Team nutzt ChatGPT, um erste Antwortentwuerfe fuer Kundenanfragen zu erstellen. Ein Mensch prueft jede Antwort vor dem Versand und ergaenzt bei Bedarf sensible Details.',
    },
    async () => ({
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
            position: 2,
            name: 'ChatGPT',
            providerType: 'MODEL',
          },
          {
            position: 1,
            name: 'Zendesk',
            providerType: 'TOOL',
          },
        ],
        workflow: {
          connectionMode: 'SEMI_AUTOMATED',
          summary:
            'Support sieht Anfrage in Zendesk, ChatGPT entwirft Antwort, Mensch prueft vor Versand.',
        },
        triggers: [],
        steps: [
          'Kundenanfrage in Zendesk oeffnen',
          'Entwurf mit ChatGPT erstellen',
          'Antwort vor Versand manuell pruefen',
        ],
        controls: ['Manuelle Freigabe bleibt verpflichtend'],
        humansInLoop: ['Support-Agent prueft jede Antwort vor dem Versand'],
        risks: ['Falsche oder unvollstaendige Antworten'],
        artifacts: ['Support-Antwortentwurf'],
        tags: ['support', 'customer-service'],
      },
      meta: {
        confidence: 'medium',
        missingFacts: [],
        assumptions: [],
      },
    }),
  );

  const manifest = parseStudioUseCaseManifest(result.draft);
  const capturePreview = buildRegisterCaptureFromManifest(manifest);

  assert.equal(capturePreview.purpose, result.draft.purpose);
  assert.deepEqual(capturePreview.usageContexts, ['CUSTOMERS']);
  assert.equal(capturePreview.toolFreeText, 'Zendesk');
  assert.equal(capturePreview.workflow?.additionalSystems[0]?.toolFreeText, 'ChatGPT');
  assert.equal(result.draft.systems[0]?.position, 1);
  assert.equal(result.draft.systems[0]?.name, 'Zendesk');
  assert.equal(result.draft.systems[1]?.position, 2);
  assert.equal('riskClass' in result.draft, false);
  assert.equal('status' in result.draft, false);
  assert.equal(result.verifier.schemaValid, true);
  assert.equal(result.verifier.captureMappingValid, true);
  assert.ok(result.handoff);
  assert.equal(result.handoff?.captureInput.purpose, result.draft.purpose);
  assert.deepEqual(result.questions, result.verifier.openQuestions);
});

test('generateDraftAssistWith keeps missing facts in meta instead of pretending they are settled', async () => {
  const result = await generateDraftAssistWith(
    {
      description:
        'Das Recruiting-Team moechte KI fuer die Vorauswahl von Bewerbungen nutzen. Noch ist unklar, welches konkrete System genutzt wird und welche Datenkategorien genau verarbeitet werden.',
    },
    async () => ({
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
    }),
  );

  assert.equal(result.draft.responsibleParty ?? null, null);
  assert.deepEqual(result.meta.missingFacts, [
    'Welches konkrete KI-System oder welcher Anbieter wird fuer die Vorauswahl genutzt?',
    'Welche personenbezogenen oder sensiblen Daten werden fuer die Vorauswahl verarbeitet?',
  ]);
  assert.deepEqual(result.meta.assumptions, [
    'Die finale Auswahlentscheidung bleibt bei einem Menschen.',
  ]);
  assert.equal('governanceAssessment' in result.draft, false);
  assert.equal(result.verifier.verdict, 'needs_input');
  assert.ok(result.questions.length >= 2);
  assert.ok(result.handoff);
});
