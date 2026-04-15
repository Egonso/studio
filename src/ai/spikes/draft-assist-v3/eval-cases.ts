import type {
  CaptureUsageContext,
  DecisionInfluence,
} from "@/lib/register-first/card-model";
import type { CanonicalAiActRiskClass } from "@/lib/register-first/risk-taxonomy";

export interface DraftAssistSpikeExpectedSignals {
  systems?: string[];
  usageContexts?: CaptureUsageContext[];
  decisionInfluence?: DecisionInfluence;
  riskClass?: CanonicalAiActRiskClass;
}

export interface DraftAssistSpikeEvalCase {
  id: string;
  title: string;
  description: string;
  sourceRefs: string[];
  expected: DraftAssistSpikeExpectedSignals;
}

export const draftAssistSpikeEvalCases: DraftAssistSpikeEvalCase[] = [
  {
    id: "support-ticket-prioritization",
    title: "Support-Tickets priorisieren",
    description:
      "Unser Support-Team nutzt ChatGPT, um eingehende Kundenanfragen kurz zusammenzufassen und eine erste Priorisierung vorzuschlagen. Die Mitarbeitenden pruefen jeden Vorschlag vor der Bearbeitung. In den Tickets koennen personenbezogene Kundendaten enthalten sein.",
    sourceRefs: [
      "src/lib/register-first/__tests__/smoke.ts",
      "src/lib/register-first/__tests__/service-v11.smoke.ts",
    ],
    expected: {
      systems: ["ChatGPT"],
      usageContexts: ["EMPLOYEES", "CUSTOMERS"],
      decisionInfluence: "PREPARATION",
      riskClass: "LIMITED",
    },
  },
  {
    id: "applicant-scoring-ranking",
    title: "Bewerber-Scoring und Ranking",
    description:
      "Im Recruiting soll ein KI-System Bewerbungen automatisch vorsortieren, score-basierte Rankings erstellen und eine Shortlist fuer die erste Auswahl liefern. Recruiter sehen die Ergebnisse und entscheiden am Ende selbst, wer eingeladen wird. Verarbeitet werden Bewerberdaten, Lebenslaeufe und weitere personenbezogene Angaben.",
    sourceRefs: [
      "src/lib/register-first/risk-suggestion-engine.test.ts",
      "src/lib/policy-engine/sections/level-3/15-hr-recruitment.ts",
    ],
    expected: {
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "AUTOMATED",
      riskClass: "HIGH",
    },
  },
  {
    id: "marketing-text-drafting",
    title: "Marketing-Texte entwerfen",
    description:
      "Das Marketing-Team nutzt ChatGPT, um erste Entwuerfe fuer Newsletter und Webseiten-Texte zu schreiben. Eine Mitarbeiterin prueft jeden Text vor der Veroeffentlichung und passt Tonalitaet und Aussagen an. Es werden dabei keine sensiblen Personendaten eingegeben.",
    sourceRefs: [
      "src/lib/register-first/__tests__/smoke.ts",
      "src/components/register/capture-form.tsx",
      "src/data/coverage-assist-seed-library.json",
    ],
    expected: {
      systems: ["ChatGPT"],
      usageContexts: ["CUSTOMERS"],
      decisionInfluence: "ASSISTANCE",
    },
  },
  {
    id: "routine-email-preparation",
    title: "Routine-E-Mails vorbereiten",
    description:
      "Mitarbeitende verwenden Microsoft Copilot, um interne Rueckfragen und erste Antwortentwuerfe fuer Kundenmails vorzubereiten. Die Nachrichten werden immer manuell geprueft, angepasst und erst danach verschickt. Teilweise stehen darin Kundennamen und laufende Vorgangsnummern.",
    sourceRefs: [
      "src/lib/register-first/__tests__/smoke.ts",
      "src/data/coverage-assist-seed-library.json",
    ],
    expected: {
      systems: ["Microsoft Copilot"],
      usageContexts: ["INTERNAL_ONLY", "CUSTOMERS"],
      decisionInfluence: "ASSISTANCE",
    },
  },
  {
    id: "customer-support-chatbot",
    title: "Kundensupport-Chatbot",
    description:
      "Auf der Website beantwortet ein Chatbot haeufige Fragen von Kunden zu Lieferstatus und Standardprozessen. Das Support-Team beobachtet die Antworten, greift bei Unsicherheiten ein und bearbeitet komplexe Faelle manuell weiter. In einzelnen Faellen koennen Kundendaten und Bestellinformationen beruehrt werden.",
    sourceRefs: [
      "src/lib/register-first/risk-suggestion-engine.test.ts",
      "src/components/register/detail/use-case-assessment-wizard-model.test.ts",
    ],
    expected: {
      usageContexts: ["CUSTOMERS"],
      decisionInfluence: "ASSISTANCE",
      riskClass: "LIMITED",
    },
  },
  {
    id: "applicant-communication-scheduling",
    title: "Bewerberkommunikation und Terminabstimmung",
    description:
      "Ein KI-Assistent formuliert Antworten an Bewerber und schlaegt Termine fuer Interviews vor. Recruiter pruefen jeden Entwurf, bevor etwas verschickt wird. Verarbeitet werden Bewerberdaten und Informationen aus dem Recruiting-Prozess.",
    sourceRefs: [
      "src/lib/register-first/risk-suggestion-engine.test.ts",
      "src/components/register/detail/risk-class-assist-model.test.ts",
    ],
    expected: {
      usageContexts: ["APPLICANTS"],
      decisionInfluence: "PREPARATION",
      riskClass: "LIMITED",
    },
  },
  {
    id: "finance-invoice-triage",
    title: "Finance Invoice Triage",
    description:
      "Im Finanzbereich sollen SAP-Daten und Claude genutzt werden, um Rechnungsabweichungen zusammenzufassen und fuer die weitere Pruefung aufzubereiten. Ein Finance Analyst prueft jede Zusammenfassung vor naechsten Schritten. Die Unterlagen koennen interne vertrauliche Rechnungs- und Lieferantendaten enthalten.",
    sourceRefs: [
      "src/lib/dev/studio-agent.test.ts",
      "src/lib/agent-kit/manifest.test.ts",
    ],
    expected: {
      systems: ["SAP", "Claude"],
      usageContexts: ["EMPLOYEES"],
      decisionInfluence: "PREPARATION",
    },
  },
  {
    id: "vendor-due-diligence-assistant",
    title: "Vendor due diligence assistant",
    description:
      "Im Einkauf werden SharePoint-Unterlagen und Claude genutzt, um Lieferantenunterlagen vor einer rechtlichen oder fachlichen Pruefung zusammenzufassen. Die Procurement-Leitung prueft jede Empfehlung und trifft die eigentliche Entscheidung. Es geht um interne vertrauliche Informationen zu Lieferanten und Verträgen.",
    sourceRefs: [
      "src/lib/agent-kit/manifest.test.ts",
    ],
    expected: {
      systems: ["SharePoint", "Claude"],
      usageContexts: ["EMPLOYEES"],
      decisionInfluence: "PREPARATION",
    },
  },
  {
    id: "newsletter-content-workflow",
    title: "Newsletter-Content mit Recherche, Text und Bild",
    description:
      "Im Marketing laeuft ein kleiner Workflow ueber Perplexity API, Gemini API und Sora: erst werden Themen recherchiert, dann Texte vorbereitet und zum Schluss Bildideen erstellt. Die Marketing-Leitung prueft jedes Ergebnis vor der Nutzung. Es werden keine sensiblen Personendaten verarbeitet, aber interne Planungsinformationen koennen eingegeben werden.",
    sourceRefs: [
      "src/lib/register-first/__tests__/service-v11.smoke.ts",
    ],
    expected: {
      systems: ["Perplexity API", "Gemini API", "Sora"],
      usageContexts: ["INTERNAL_ONLY"],
      decisionInfluence: "PREPARATION",
    },
  },
  {
    id: "internal-knowledge-rag",
    title: "Internes Wissensmanagement mit eigener RAG-Pipeline",
    description:
      "Die IT nutzt eine eigene RAG-Pipeline, um interne Wissensdokumente schneller auffindbar zu machen und erste Antworten fuer interne Rueckfragen vorzubereiten. Fachbereiche pruefen die Ergebnisse vor weiterer Nutzung. Im System liegen interne und vertrauliche Unternehmensinformationen.",
    sourceRefs: [
      "src/lib/register-first/__tests__/service-v11.smoke.ts",
    ],
    expected: {
      systems: ["Eigenentwicklung RAG-Pipeline"],
      usageContexts: ["INTERNAL_ONLY"],
      decisionInfluence: "ASSISTANCE",
    },
  },
  {
    id: "github-copilot-code-explanation",
    title: "Code erklaeren mit GitHub Copilot",
    description:
      "Entwickler nutzen GitHub Copilot, um unbekannte Module zusammenfassen und erklaeren zu lassen. Die Erklaerungen werden nur intern genutzt und vor produktiven Aenderungen immer von einem Entwickler geprueft. Verarbeitet wird ausschliesslich interner Code.",
    sourceRefs: [
      "src/data/coverage-assist-seed-library.json",
    ],
    expected: {
      systems: ["GitHub Copilot"],
      usageContexts: ["INTERNAL_ONLY"],
      decisionInfluence: "ASSISTANCE",
      riskClass: "MINIMAL",
    },
  },
  {
    id: "gemini-workshop-agenda",
    title: "Workshop-Agenda skizzieren",
    description:
      "Ein Team nutzt Google Gemini, um aus vorhandenen Notizen eine Workshop-Agenda und Leitfragen vorzubereiten. Die Moderation prueft und aendert den Vorschlag vor dem Termin. Der Einsatz bleibt intern und dient nur der Vorbereitung.",
    sourceRefs: [
      "src/data/coverage-assist-seed-library.json",
    ],
    expected: {
      systems: ["Google Gemini"],
      usageContexts: ["INTERNAL_ONLY", "EMPLOYEES"],
      decisionInfluence: "ASSISTANCE",
      riskClass: "MINIMAL",
    },
  },
  {
    id: "claude-policy-draft",
    title: "Richtlinienentwurf mit Claude",
    description:
      "Fuer interne Arbeitsanweisungen wird Claude genutzt, um erste Richtlinienentwuerfe und Prozessbeschreibungen zu schreiben. Verantwortliche aus dem Fachbereich pruefen jede Fassung vor Freigabe. Es geht um interne Prozessinformationen und Vorgaben fuer Mitarbeitende.",
    sourceRefs: [
      "src/data/coverage-assist-seed-library.json",
    ],
    expected: {
      systems: ["Claude"],
      usageContexts: ["INTERNAL_ONLY", "EMPLOYEES"],
      decisionInfluence: "ASSISTANCE",
    },
  },
  {
    id: "support-reply-drafting",
    title: "Support-Antworten mit Zendesk und Claude vorbereiten",
    description:
      "Im Kundenservice werden eingehende Tickets in Zendesk mit Claude vorbearbeitet, damit ein erster Antwortentwurf fuer die Support-Mitarbeitenden vorliegt. Menschen pruefen jeden Entwurf und entscheiden ueber die finale Antwort. In den Tickets stehen haeufig personenbezogene Kundendaten und Vorgangsinformationen.",
    sourceRefs: [
      "src/lib/agent-kit/manifest.test.ts",
      "src/lib/dev/studio-agent.test.ts",
    ],
    expected: {
      systems: ["Zendesk", "Claude"],
      usageContexts: ["CUSTOMERS"],
      decisionInfluence: "PREPARATION",
      riskClass: "LIMITED",
    },
  },
];
