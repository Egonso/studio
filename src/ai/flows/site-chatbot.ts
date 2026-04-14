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

const ARTICLE_REF_REGEX = /(?:article|art\.?|section|§)\s*(\d+)/gi;
const RECITAL_REF_REGEX = /(?:recital|rec\.?|erwägungsgrund|erw\.?)\s*(\d+)/gi;

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'what',
  'how',
  'who',
  'where',
  'says',
  'about',
  'with',
  'from',
  'for',
  'on',
  'in',
  'to',
  'it',
  'its',
  'and',
  'or',
  'but',
  'if',
  'then',
  'can',
  'does',
  'do',
  'not',
  'no',
  'also',
  'after',
  'still',
  'only',
  'when',
  'this',
  'that',
  'which',
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

  const titleMatch = String(article.title ?? '').match(/(?:article|artikel)\s*(\d+)/i);
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
    .replace(/[^a-zäöüß\s\-]/gi, ' ')
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
      sections.push(`- Article ${articleNumber} [[Art. ${articleNumber}]] was not found in the dataset.`);
      continue;
    }

    const body = compactText(article.text ?? article.title ?? 'No text available.', 1300);
    sections.push(`- Article ${articleNumber} [[Art. ${articleNumber}]]: ${body}`);
  }

  for (const recitalNumber of recitalRefs.slice(0, 2)) {
    const recital = findRecitalByNumber(lawData, recitalNumber);
    if (!recital) {
      sections.push(`- Recital ${recitalNumber} [[Rec. ${recitalNumber}]] was not found in the dataset.`);
      continue;
    }

    const body = compactText(recital.text ?? 'No text available.', 1100);
    sections.push(`- Recital ${recitalNumber} [[Rec. ${recitalNumber}]]: ${body}`);
  }

  if (sections.length === 0) {
    return null;
  }

  return [
    'Quick reference from the EU AI Act:',
    ...sections,
    '',
    'If you like, I can summarise the content in 3 bullet points.',
    'Note: This is not legal advice.',
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

  const chunks: string[] = ['EU AI ACT — RELEVANT SECTIONS:\n'];
  if (matchedArticles.length > 0) {
    chunks.push(matchedArticles.join('\n\n'));
  }
  if (matchedRecitals.length > 0) {
    chunks.push(`RECITALS:\n${matchedRecitals.join('\n\n')}`);
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
You are the intelligent assistant for "AI Register" (airegist.com).
Your task: help users navigate the platform, understand the EU AI Act, and find relevant content.
ALWAYS respond in English, professionally and helpfully.

**Citation format for the EU AI Act:**
- For articles: write "Article 5 [[Art. 5]]" — the [[Art. X]] brackets become links in the frontend.
- For recitals: write "Recital 12 [[Rec. 12]]".

**EU AI Act context (relevant sections):**
${lawContext || 'No specific law excerpt pre-selected.'}

**Platform knowledge:**
${SITE_TREE}

${FEATURE_OVERVIEW}

${COMMON_QUESTIONS}

**Navigation:**
When the user asks about a specific feature or page, ALWAYS use the 'navigateTool' to direct them there.
Example: "Where do I document a use case?" → navigateTool with path="/my-register".

**Important:**
- Be proactive: when a user raises a topic, suggest relevant pages and features.
- For legal questions: point out that your answers do not constitute legal advice.
- Use the FAQ scenarios to answer common questions quickly and in a structured way.
- Keep answers concise but informative. Use bullet points.
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
      let finalText = response.text || 'I was unable to generate a response right now. Please try again.';

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
      return 'Sorry, the assistant is currently unavailable. Please try again later.';
    }
  }
);
