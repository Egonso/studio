import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { ToolPublicInfo, FlagStatus } from '@/lib/types';
import { UseCaseCard } from '@/lib/register-first/types';

// Rate Limiting: Simple in-memory map (Note: resets on serverless cold start)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

export const maxDuration = 60; // Allow longer timeout for Perplexity

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
        // 1. Authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Ideally verify token here with admin SDK, but we trust the client for this PoC scope constraint
        // (In production: await auth.verifyIdToken(token))

        const body = await req.json();
        // Support Legacy (projectId + toolIds) OR New (registerId + useCaseId)
        const { projectId, toolIds, registerId, useCaseId, force } = body;

        // Validation
        const isLegacy = !!projectId && !!toolIds;
        const isRegister = !!registerId && !!useCaseId;

        if (!isLegacy && !isRegister) {
            return NextResponse.json({ error: 'Invalid request: detailed context required (Project or Register)' }, { status: 400 });
        }

        // Scope for Rate Limiting
        const scopeId = projectId || registerId;

        // 2. Rate Limiting
        const now = Date.now();
        const rateData = rateLimitMap.get(scopeId) || { count: 0, firstRequest: now };

        if (now - rateData.firstRequest > RATE_LIMIT_WINDOW) {
            rateData.count = 0;
            rateData.firstRequest = now;
        }

        if (rateData.count >= MAX_REQUESTS && !force) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
        }

        rateLimitMap.set(scopeId, { ...rateData, count: rateData.count + 1 });

        // 3. Prepare Target
        let targetDocRef: FirebaseFirestore.DocumentReference;
        let toolName: string = "Unknown Tool";
        let toolVendor: string = "Unknown Vendor";
        let existingInfo: ToolPublicInfo | undefined;

        if (isRegister) {
            // New Register Path
            targetDocRef = db.collection(`registers/${registerId}/useCases`).doc(useCaseId);
            const doc = await targetDocRef.get();
            if (!doc.exists) return NextResponse.json({ error: 'Use Case not found' }, { status: 404 });

            const data = doc.data() as UseCaseCard;
            toolName = data.toolFreeText || data.toolId || data.purpose || "AI Tool";
            toolVendor = (data.toolId && data.toolId !== 'other') ? data.toolId : "Generic / Unknown";
            existingInfo = data.publicInfo;
        } else {
            // Legacy Path
            // Only processing first toolId for now in this unified logic
            // (Loop logic removed for clarity/unification, assuming batching isn't heavily used by UI anymore)
            const toolId = toolIds[0];
            targetDocRef = db.collection(`projects/${projectId}/tools`).doc(toolId);
            const doc = await targetDocRef.get();
            if (!doc.exists) return NextResponse.json({ error: 'Tool not found' }, { status: 404 });

            const data = doc.data();
            toolName = data?.name || "Unknown";
            toolVendor = data?.vendor || "Unknown";
            existingInfo = data?.publicInfo;
        }

        // Cache Check
        const lastChecked = existingInfo?.lastCheckedAt ? new Date(existingInfo.lastCheckedAt).getTime() : 0;
        const daysSinceCheck = (now - lastChecked) / (1000 * 60 * 60 * 24);

        if (existingInfo && daysSinceCheck < 14 && !force) {
            return NextResponse.json({ success: true, results: { [useCaseId || toolIds[0]]: existingInfo }, cached: true });
        }

        // 4. Perplexity API Call
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            console.error('PERPLEXITY_API_KEY missing');
            return NextResponse.json({ error: 'Server configuration error (API Key)' }, { status: 500 });
        }

        console.log(`Checking Perplexity for: ${toolName} (${toolVendor})`);

        const prompt = `
        Research compliance info for the AI tool "${toolName}" (Vendor: "${toolVendor}").
        Search for: Trust Center, Privacy Policy, GDPR statements, EU AI Act mentions, DPA/SCC availability.
        
        Output JSON ONLY with this schema:
        {
          "summary": "Short neutral summary (max 300 chars) of compliance status IN GERMAN.",
          "flags": {
            "trustCenterFound": "yes"|"no",
            "privacyPolicyFound": "yes"|"no",
            "gdprClaim": "yes"|"no"|"not_found",
            "aiActClaim": "yes"|"no"|"not_found",
            "dpaOrSccMention": "yes"|"no"|"not_found"
          },
          "confidence": "low"|"medium"|"high",
          "sources": [
             { "title": "Page Title", "url": "URL", "type": "trust_center"|"privacy"|"terms"|"dpa"|"scc"|"blog"|"other" }
          ]
        }
        NO markdown code blocks. Just the raw JSON string.
        `;

        const pRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-reasoning-pro",
                messages: [
                    { role: "system", content: "You are a precise data compliance research assistant. Output strict JSON only. No preamble." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!pRes.ok) {
            const errText = await pRes.text();
            console.error('Perplexity API Error:', pRes.status, errText);

            // Graceful Fallback or Error
            throw new Error(`Perplexity API Error: ${pRes.status}`);
        }

        const pData = await pRes.json();
        let content = pData.choices[0].message.content;

        // Strip markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const research = JSON.parse(content);

        // Map Result
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

        // Write to DB
        await targetDocRef.update({
            publicInfo: publicInfo
        });

        return NextResponse.json({ success: true, results: { [useCaseId || toolIds[0]]: publicInfo } });

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
