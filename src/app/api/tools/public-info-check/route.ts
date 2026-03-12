import { NextRequest, NextResponse } from 'next/server';
import { ToolPublicInfo, FlagStatus } from '@/lib/types';
import { ServerAuthError, requireUser } from '@/lib/server-auth';

// Rate Limiting: Simple in-memory map (Note: resets on serverless cold start)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

/**
 * Helper to ensure strictly typed FlagStatus
 */
function parseFlag(value: string | undefined): FlagStatus {
    const norm = value?.toLowerCase();
    if (norm === 'yes' || norm === 'true') return 'yes';
    if (norm === 'no' || norm === 'false') return 'no';
    return 'not_found';
}

export async function POST(req: NextRequest) {
    try {
        await requireUser(req.headers.get("authorization"));
        const body = await req.json();
        const { toolName, toolVendor, force } = body;

        if (!toolName) {
            return NextResponse.json({ error: 'Invalid request: toolName required' }, { status: 400 });
        }

        // Rate Limiting (using IP)
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        const now = Date.now();
        const rateData = rateLimitMap.get(ip) || { count: 0, firstRequest: now };

        if (now - rateData.firstRequest > RATE_LIMIT_WINDOW) {
            rateData.count = 0;
            rateData.firstRequest = now;
        }

        if (rateData.count >= MAX_REQUESTS && !force) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
        }

        rateLimitMap.set(ip, { ...rateData, count: rateData.count + 1 });

        // Perplexity API Call
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            console.error('PERPLEXITY_API_KEY missing');
            return NextResponse.json({ error: 'Configuration Error: Perplexity API Key missing.' }, { status: 500 });
        }

        console.log(`Checking Perplexity for: ${toolName} (${toolVendor})`);

        const prompt = `
Act as a strict compliance researcher specialized in the EU AI Act and GDPR.
Research the AI tool "${toolName}" (Vendor: ${toolVendor}).

Focus ONLY on official or highly credible sources (vendor website, privacy policy, trust center, DPA).

Answer these questions:
1. Does the vendor have a public Trust Center or Security Portal?
2. Is there a public Privacy Policy?
3. Does the vendor explicitly claim GDPR compliance?
4. Does the vendor explicitly mention EU AI Act compliance?
5. Does the vendor offer a Data Processing Agreement (DPA) or mention Standard Contractual Clauses (SCCs)?

Respond ONLY with a valid JSON object matching this structure (no markdown formatting, no explanations outside the JSON):
{
  "summary": "A concise 2-3 sentence summary of your findings regarding compliance.",
  "flags": {
    "trustCenterFound": "yes" | "no" | "not_found",
    "privacyPolicyFound": "yes" | "no" | "not_found",
    "gdprClaim": "yes" | "no" | "not_found",
    "aiActClaim": "yes" | "no" | "not_found",
    "dpaOrSccMention": "yes" | "no" | "not_found"
  },
  "confidence": "high" | "medium" | "low",
  "sources": [
    { "url": "https://...", "title": "Page Title" }
  ]
}`;

        const pRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: 'You are a precise JSON-only API.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        });

        if (!pRes.ok) {
            const errText = await pRes.text();
            console.error('Perplexity API Error:', pRes.status, errText);

            if (pRes.status === 401) {
                return NextResponse.json({ error: 'Perplexity API Key invalid or expired.' }, { status: 500 });
            }
            throw new Error(`Perplexity API Error: ${pRes.status}`);
        }

        const pData = await pRes.json();
        let content = pData.choices?.[0]?.message?.content || "";

        // Clean up markdown/think tags
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        let research;
        try {
            research = JSON.parse(content);
        } catch (_e) {
            console.error('Failed to parse Perplexity JSON:', content);
            throw new Error('Invalid JSON response from Perplexity');
        }

        const publicInfo: ToolPublicInfo = {
            lastCheckedAt: new Date().toISOString(),
            checker: 'perplexity',
            summary: research.summary?.substring(0, 300) || "No summary available.",
            flags: {
                trustCenterFound: parseFlag(research.flags?.trustCenterFound),
                privacyPolicyFound: parseFlag(research.flags?.privacyPolicyFound),
                gdprClaim: parseFlag(research.flags?.gdprClaim),
                aiActClaim: parseFlag(research.flags?.aiActClaim),
                dpaOrSccMention: parseFlag(research.flags?.dpaOrSccMention),
            },
            confidence: (['low', 'medium', 'high'].includes(research.confidence) ? research.confidence : 'low') as any,
            sources: (research.sources || []).slice(0, 5).map((s: any) => ({
                title: s.title || 'Source',
                url: s.url || '',
                type: s.type || 'other',
                accessedAt: new Date().toISOString()
            })),
            disclaimerVersion: 'v1'
        };

        return NextResponse.json({ success: true, result: publicInfo });

    } catch (error: any) {
        if (error instanceof ServerAuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
