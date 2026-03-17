import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logError } from '@/lib/observability/logger';
import { ServerAuthError, requireUser } from '@/lib/server-auth';
import {
    buildRateLimitKey,
    enforceRequestRateLimit,
    safePlainTextSchema,
} from '@/lib/security/request-security';

const DraftAssessmentSchema = z.object({
    systemName: safePlainTextSchema('Systemname', { max: 160 }).optional(),
    vendor: safePlainTextSchema('Hersteller', { max: 160 }).optional(),
    purpose: safePlainTextSchema('Einsatzzweck', { max: 4000 }).optional(),
    usageContexts: z.array(safePlainTextSchema('Nutzungskontext', { max: 160 })).max(25).optional().default([]),
    dataCategories: z.array(safePlainTextSchema('Datenkategorie', { max: 160 })).max(25).optional().default([]),
});

export async function POST(req: Request) {
    try {
        const actor = await requireUser(req.headers.get("authorization"));
        const { systemName, vendor, purpose, usageContexts, dataCategories } =
          DraftAssessmentSchema.parse(await req.json());

        if (!systemName && !purpose) {
            return NextResponse.json({ error: 'System name or purpose is required' }, { status: 400 });
        }

        const rateLimit = await enforceRequestRateLimit({
            request: req,
            namespace: 'draft-assessment',
            key: buildRateLimitKey(req, actor.uid, systemName ?? purpose ?? 'unknown'),
            limit: 20,
            windowMs: 60 * 60 * 1000,
            logContext: {
                actorUserId: actor.uid,
            },
        });
        if (!rateLimit.ok) {
            return NextResponse.json({ error: 'Zu viele Draft-Anfragen in kurzer Zeit.' }, { status: 429 });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const contextInfo = [
            systemName ? `System: ${systemName}` : "",
            vendor ? `Hersteller: ${vendor}` : "",
            purpose ? `Einsatzzweck: ${purpose}` : "",
            usageContexts?.length ? `Nutzungskontexte: ${usageContexts.join(', ')}` : "",
            dataCategories?.length ? `Datenkategorien: ${dataCategories.join(', ')}` : "",
        ].filter(Boolean).join('\n');

        const prompt = `Erstelle einen objektiven juristischen Bewertungs-Draft (Pre-Audit) für folgendes KI-System im Kontext des EU AI Acts:
        
${contextInfo}

Schreibe maximal 3 kurze, prägnante Absätze auf Deutsch, die objektiv das System bewerten. 
- Absatz 1: Kurze Zusammenfassung der Kernfunktion und des Einsatzzwecks.
- Absatz 2: Ersteinschätzung zur Risikoklasse nach EU AI Act (z.B. vermutlich Minimales Risiko, potenziell Hochrisiko nach Anhang III, etc.) mit kurzer Begründung.
- Absatz 3: Wichtige erste Handlungsempfehlungen für die Governance (z. B. "Human in the Loop sicherstellen", "Auf Transparenz achten").

Verwende einen sachlichen, gutachtlichen Stil. Keine Floskeln, keine Einleitung wie "Gewiss, hier ist...". Der Text soll direkt in ein offizielles Assessment-Dokument eingefügt und editiert werden können.`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an objective legal AI compliance assistant specialized in the EU AI Act. You provide concise, professional pre-audit assessments.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Perplexity API Error:", response.status, errorText);
            throw new Error(`Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "";

        // Ensure no markdown block quotes or extra wrapping
        content = content.trim();

        return NextResponse.json({
            draft: content,
            citations: data.citations || []
        });

    } catch (error) {
        if (error instanceof ServerAuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 });
        }
        logError('draft_assessment_failed', {
            errorMessage: error instanceof Error ? error.message : 'unknown_error',
        });
        return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
    }
}
