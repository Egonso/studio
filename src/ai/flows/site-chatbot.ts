'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import lawDataRaw from '@/data/eu-ai-act.json';
import { SITE_TREE, FEATURE_OVERVIEW, COMMON_QUESTIONS } from '@/data/chatbot-context';

// Input/Output Schemas
const ChatbotInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model', 'system']),
      content: z.string(),
    })
  ),
  currentPath: z.string().optional(),
});

type LawArticle = {
  id?: string;
  title?: string;
  text?: string;
};

type LawRecital = {
  number?: string | number;
  text?: string;
};

type LawData = {
  chapters?: Array<{
    articles?: LawArticle[];
  }>;
  recitals?: LawRecital[];
};

const ARTICLE_REF_REGEX = /(?:artikel|art\.?|paragraf|paragraph|§)\s*(\d+)/gi;
const RECITAL_REF_REGEX = /(?:erwägungsgrund|erw\.?|recital)\s*(\d+)/gi;

const STOPWORDS = new Set([
  'der',
  'die',
  'das',
  'und',
  'oder',
  'ist',
  'ein',
  'eine',
  'was',
  'wie',
  'wer',
  'wo',
  'sagt',
  'steht',
  'dazu',
  'über',
  'zum',
  'zur',
  'bei',
  'mit',
  'von',
  'für',
  'auf',
  'in',
  'an',
  'zu',
  'es',
  'sich',
  'den',
  'dem',
  'des',
  'als',
  'auch',
  'nach',
  'noch',
  'nur',
  'aber',
  'wenn',
  'dann',
  'kann',
  'muss',
  'wird',
  'hat',
  'sind',
  'ich',
  'du',
  'sie',
  'er',
  'wir',
  'mir',
]);

function uniqueNumbersFromRegex(text: string, regex: RegExp): number[] {
  const numbers = [...text.matchAll(regex)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((n) => Number.isFinite(n));
  return Array.from(new Set(numbers));
}

function compactText(text: string, maxLength = 1100): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function parseArticleNumber(article: LawArticle): number | null {
  const idMatch = String(article.id ?? '').match(/(\d+)/);
  if (idMatch) {
    const parsed = Number.parseInt(idMatch[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }

  const titleMatch = String(article.title ?? '').match(/artikel\s*(\d+)/i);
  if (titleMatch) {
    const parsed = Number.parseInt(titleMatch[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function findArticleByNumber(lawData: LawData, articleNumber: number): LawArticle | null {
  for (const chapter of lawData.chapters ?? []) {
    for (const article of chapter.articles ?? []) {
      if (parseArticleNumber(article) === articleNumber) return article;
    }
  }
  return null;
}

function findRecitalByNumber(lawData: LawData, recitalNumber: number): LawRecital | null {
  for (const recital of lawData.recitals ?? []) {
    const parsed = Number.parseInt(String(recital.number ?? ''), 10);
    if (Number.isFinite(parsed) && parsed === recitalNumber) return recital;
  }
  return null;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
}

function buildDirectLawAnswer(lawData: LawData, userMessage: string): string | null {
  const articleRefs = uniqueNumbersFromRegex(userMessage, ARTICLE_REF_REGEX);
  const recitalRefs = uniqueNumbersFromRegex(userMessage, RECITAL_REF_REGEX);

  if (articleRefs.length === 0 && recitalRefs.length === 0) {
    return null;
  }

  const sections: string[] = [];

  for (const articleNumber of articleRefs.slice(0, 3)) {
    const article = findArticleByNumber(lawData, articleNumber);
    if (!article) {
      sections.push(`- Artikel ${articleNumber} [[Art. ${articleNumber}]] wurde im Datensatz nicht gefunden.`);
      continue;
    }

    const body = compactText(article.text ?? article.title ?? 'Kein Text verfügbar.', 1300);
    sections.push(`- Artikel ${articleNumber} [[Art. ${articleNumber}]]: ${body}`);
  }

  for (const recitalNumber of recitalRefs.slice(0, 2)) {
    const recital = findRecitalByNumber(lawData, recitalNumber);
    if (!recital) {
      sections.push(`- Erwägungsgrund ${recitalNumber} [[Erw. ${recitalNumber}]] wurde im Datensatz nicht gefunden.`);
      continue;
    }

    const body = compactText(recital.text ?? 'Kein Text verfügbar.', 1100);
    sections.push(`- Erwägungsgrund ${recitalNumber} [[Erw. ${recitalNumber}]]: ${body}`);
  }

  if (sections.length === 0) {
    return null;
  }

  return [
    'Schnellzugriff auf den EU AI Act:',
    ...sections,
    '',
    'Wenn du willst, fasse ich dir den Inhalt in 3 Bullet Points zusammen.',
    'Hinweis: Das ist keine Rechtsberatung.',
  ].join('\n');
}

function buildLawContext(lawData: LawData, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  const explicitArticleRefs = uniqueNumbersFromRegex(lowerMessage, ARTICLE_REF_REGEX);
  const explicitRecitalRefs = uniqueNumbersFromRegex(lowerMessage, RECITAL_REF_REGEX);
  const keywords = extractKeywords(lowerMessage);

  const matchedArticles: string[] = [];
  const matchedRecitals: string[] = [];

  for (const chapter of lawData.chapters ?? []) {
    for (const article of chapter.articles ?? []) {
      const articleNumber = parseArticleNumber(article);
      const articleText = `${article.title ?? ''}\n${article.text ?? ''}`.trim();

      if (articleNumber && explicitArticleRefs.includes(articleNumber)) {
        matchedArticles.push(`[ARTICLE ${articleNumber}] ${compactText(articleText, 800)}`);
        continue;
      }

      if (keywords.length > 0 && matchedArticles.length < 4) {
        const searchable = articleText.toLowerCase();
        const hits = keywords.filter((kw) => searchable.includes(kw));
        if (hits.length >= 2 || (hits.length >= 1 && keywords.length <= 2)) {
          matchedArticles.push(
            `[ARTICLE ${articleNumber ?? '?'}] ${compactText(articleText, 500)}`
          );
        }
      }
    }
  }

  for (const recital of lawData.recitals ?? []) {
    const recitalNumber = Number.parseInt(String(recital.number ?? ''), 10);
    const recitalText = String(recital.text ?? '');

    if (Number.isFinite(recitalNumber) && explicitRecitalRefs.includes(recitalNumber)) {
      matchedRecitals.push(`[RECITAL ${recitalNumber}] ${compactText(recitalText, 700)}`);
      continue;
    }

    if (keywords.length > 0 && matchedRecitals.length < 3) {
      const searchable = recitalText.toLowerCase();
      const hits = keywords.filter((kw) => searchable.includes(kw));
      if (hits.length >= 2) {
        matchedRecitals.push(`[RECITAL ${recitalNumber}] ${compactText(recitalText, 420)}`);
      }
    }
  }

  if (matchedArticles.length === 0 && matchedRecitals.length === 0) {
    return '';
  }

  const chunks: string[] = ['EU AI ACT — RELEVANTE ABSCHNITTE:\n'];
  if (matchedArticles.length > 0) {
    chunks.push(matchedArticles.join('\n\n'));
  }
  if (matchedRecitals.length > 0) {
    chunks.push(`ERWÄGUNGSGRÜNDE:\n${matchedRecitals.join('\n\n')}`);
  }

  return chunks.join('\n\n');
}

// Define the Navigation Tool
export const navigateTool = ai.defineTool(
  {
    name: 'navigateTool',
    description:
      'Use this tool to navigate the user to a specific path in the application. Use it when the user asks to go somewhere or when a specific page is the best answer.',
    inputSchema: z.object({
      path: z
        .string()
        .describe('The relative path to navigate to, e.g., "/my-register", "/academy", "/control".'),
      reason: z.string().describe('Short reason for navigation, for logging purposes.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      command: z.string(),
    }),
  },
  async ({ path, reason: _reason }) => {
    return { success: true, command: `NAVIGATE_TO:${path}` };
  }
);

// Define the Chatbot Flow
export const siteChatbotFlow = ai.defineFlow(
  {
    name: 'siteChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: z.string(),
  },

  async (input, { sendChunk: _sendChunk }) => {
    const lawData = lawDataRaw as LawData;
    const lastUserMessage =
      input.messages
        .filter((m) => m.role === 'user')
        .pop()?.content ?? '';

    const directLawAnswer = buildDirectLawAnswer(lawData, lastUserMessage);
    if (directLawAnswer) {
      return directLawAnswer;
    }

    let lawContext = '';
    try {
      lawContext = buildLawContext(lawData, lastUserMessage);
    } catch (error) {
      console.error('Failed to process law data for chatbot:', error);
    }

    const systemPrompt = `
Du bist der intelligente Assistent für "EuKIGesetz Studio" (kiregister.com).
Deine Aufgabe: Nutzern helfen, die Plattform zu nutzen, den EU AI Act zu verstehen, und relevante Inhalte zu finden.
Antworte IMMER auf Deutsch, professionell und hilfsbereit.

**Zitatformat für EU AI Act:**
- Für Artikel: Schreibe "Artikel 5 [[Art. 5]]" — die [[Art. X]] Klammern werden im Frontend zu Links.
- Für Erwägungsgründe: Schreibe "Erwägungsgrund 12 [[Erw. 12]]".

**EU AI Act Kontext (relevante Abschnitte):**
${lawContext || 'Kein spezifischer Gesetzesausschnitt vorausgewählt.'}

**Plattform-Wissen:**
${SITE_TREE}

${FEATURE_OVERVIEW}

${COMMON_QUESTIONS}

**Navigation:**
Wenn der Nutzer nach einer bestimmten Funktion oder Seite fragt, nutze IMMER das 'navigateTool' um direkt dorthin zu leiten.
Beispiel: "Wo dokumentiere ich einen Use Case?" → navigateTool mit path="/my-register".

**Wichtig:**
- Sei proaktiv: Wenn ein Nutzer ein Thema anspricht, schlage relevante Seiten und Funktionen vor.
- Bei Rechtsfragen: Weise darauf hin, dass deine Antworten keine Rechtsberatung darstellen.
- Nutze die FAQ-Szenarien, um häufige Fragen schnell und strukturiert zu beantworten.
- Halte Antworten kompakt aber informativ. Nutze Aufzählungszeichen.
    `;

    const userHistory = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      }));

    let combinedSystemText = systemPrompt;
    if (input.currentPath) {
      combinedSystemText += `\n\nUser Context:\nUser is currently on page: ${input.currentPath}`;
    }

    const systemMessage = { role: 'system', content: [{ text: combinedSystemText }] };
    const fullMessages = [systemMessage, ...userHistory] as any[];

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        messages: fullMessages,
        tools: [navigateTool],
        config: {
          temperature: 0.45,
          maxOutputTokens: 700,
        },
      });

      const outputToolCalls = (response as any).toolCalls || (response.output as any)?.toolCalls;
      let finalText = response.text || 'Ich konnte gerade keine Antwort erzeugen. Bitte versuche es erneut.';

      if (outputToolCalls && outputToolCalls.length > 0) {
        const navCall = outputToolCalls.find((tc: any) => tc.toolName === 'navigateTool');
        if (navCall) {
          const args = navCall.args as any;
          finalText += `\n[NAVIGATE:${args.path}]`;
        }
      }

      return finalText;
    } catch (genError: any) {
      console.error('Chatbot ai.generate error:', genError);
      return 'Entschuldigung, der Assistent ist momentan nicht erreichbar. Bitte versuche es später erneut.';
    }
  }
);
