import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logError } from '@/lib/observability/logger';
import { ServerAuthError, requireUser } from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safePlainTextSchema,
} from '@/lib/security/request-security';

const CheckToolComplianceSchema = z.object({
    toolName: safePlainTextSchema('Tool-Name', { max: 160 }),
});

export async function POST(req: Request) {
    try {
        const actor = await requireUser(req.headers.get("authorization"));
        const { toolName } = CheckToolComplianceSchema.parse(await req.json());

        const rateLimit = await enforceRequestRateLimit({
            request: req,
            namespace: 'check-tool-compliance',
            key: buildRateLimitKey(req, actor.uid, toolName),
            limit: 20,
            windowMs: 60 * 60 * 1000,
            logContext: {
                actorUserId: actor.uid,
            },
        });
        if (!rateLimit.ok) {
            return NextResponse.json({ error: 'Zu viele Abfragen in kurzer Zeit.' }, { status: 429 });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const prompt = `Recherchiere öffentliche Compliance-Informationen für das AI-Tool "${toolName}".
Suche spezifisch nach:
1. Privacy Policy & Datenschutzerklärung
2. Trust Center oder Security Portal
3. Statements zum EU AI Act
4. Hinweise zu GDPR/DSGVO, SCCs (Standard Contractual Clauses) oder DPA (Data Processing Agreement).

Antworte bitte im reinen JSON-Format (ohne Markdown Code-Blöcke) mit folgender Struktur:
{
  "gdpr_compliance_claimed": boolean, // Behauptet der Anbieter, DSGVO-konform zu sein?
  "ai_act_mentioned": boolean, // Gibt es explizite Aussagen zum EU AI Act?
  "trust_center_available": boolean, // Wurde ein Trust Center gefunden?
  "key_findings": string[], // 2-4 kurze Stichpunkte auf Deutsch (z.B. "Serverstandort USA", "Nutzt SCCs", "Zertifiziert nach ISO 27001")
  "summary": "string" // Ein neutraler Satz als Zusammenfassung.
}
`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar-pro', // Using a reliable model alias
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful research assistant focusing on AI compliance and data privacy. Always respond in valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Perplexity API Error:", response.status, errorText);
            throw new Error(`Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "{}";

        // Clean up potential markdown formatting
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (_e) {
            console.error("Failed to parse JSON from Perplexity:", content);
            parsedContent = { error: "Failed to parse response", raw: content };
        }

        return NextResponse.json({
            result: parsedContent,
            citations: data.citations || []
        });

    } catch (error) {
        if (error instanceof ServerAuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 });
        }
        logError('check_tool_compliance_failed', {
            errorMessage: error instanceof Error ? error.message : 'unknown_error',
        });
        return NextResponse.json({ error: 'Failed to verify compliance' }, { status: 500 });
    }
}
