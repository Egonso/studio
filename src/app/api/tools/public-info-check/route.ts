import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { ToolPublicInfo, FlagStatus } from '@/lib/types';

// Rate Limiting: Simple in-memory map (Note: resets on serverless cold start, but better than nothing)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

export const maxDuration = 60; // Allow longer timeout for Perplexity (Free tier might be slow)

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
        // const idToken = authHeader.split('Bearer ')[1];
        // await auth.verifyIdToken(idToken); // TODO: Verify token if passed from client (using getFirebaseAuth().currentUser.getIdToken())

        const body = await req.json();
        const { projectId, toolIds, force } = body;

        if (!projectId || !toolIds || !Array.isArray(toolIds)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // 2. Rate Limiting (User + Project Scope)
        // Using projectId as proxy for scope here
        const now = Date.now();
        const rateData = rateLimitMap.get(projectId) || { count: 0, firstRequest: now };

        if (now - rateData.firstRequest > RATE_LIMIT_WINDOW) {
            rateData.count = 0;
            rateData.firstRequest = now;
        }

        if (rateData.count >= MAX_REQUESTS && !force) { // Allow 'force' admin override or just block
            // For now, strict block
            return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
        }

        rateLimitMap.set(projectId, { ...rateData, count: rateData.count + 1 });

        const results: Record<string, ToolPublicInfo> = {};
        const toolsCollection = db.collection(`projects/${projectId}/tools`);

        // 3. Process each tool
        for (const toolId of toolIds) {
            const toolDocRef = toolsCollection.doc(toolId);
            const toolDoc = await toolDocRef.get();

            if (!toolDoc.exists) continue;

            const toolData = toolDoc.data();
            const existingInfo = toolData?.publicInfo as ToolPublicInfo | undefined;
            const lastChecked = existingInfo?.lastCheckedAt ? new Date(existingInfo.lastCheckedAt).getTime() : 0;
            const daysSinceCheck = (now - lastChecked) / (1000 * 60 * 60 * 24);

            // Cache Check (14 days)
            if (existingInfo && daysSinceCheck < 14 && !force) {
                results[toolId] = existingInfo;
                continue;
            }

            // 4. Perplexity API Call
            const apiKey = process.env.PERPLEXITY_API_KEY;
            if (!apiKey) {
                console.error('PERPLEXITY_API_KEY missing');
                // Return existing or empty on server config error
                results[toolId] = existingInfo || {
                    lastCheckedAt: new Date().toISOString(),
                    checker: 'manual', // Fallback
                    summary: 'System error: API Key missing.',
                    flags: { gdprClaim: 'not_found', aiActClaim: 'not_found', trustCenterFound: 'not_found', privacyPolicyFound: 'not_found', dpaOrSccMention: 'not_found' },
                    confidence: 'low',
                    sources: [],
                    disclaimerVersion: 'v1'
                };
                continue;
            }

            console.log(`Checking Perplexity for tool: ${toolData?.name} by ${toolData?.vendor}`);

            const prompt = `
        Research compliance info for the AI tool "${toolData?.name}" (Vendor: "${toolData?.vendor || 'Unknown'}").
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

            try {
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
                    throw new Error(`Perplexity API error: ${pRes.status}`);
                }

                const pData = await pRes.json();
                let content = pData.choices[0].message.content;

                // Strip markdown code blocks if present
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();

                const research = JSON.parse(content);

                // Sanitize and Map to ToolPublicInfo
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

                // Write to Firestore
                await toolDocRef.update({
                    publicInfo: publicInfo
                });

                results[toolId] = publicInfo;

            } catch (err) {
                console.error('Perplexity Processing Error:', err);
                // Don't fail the whole batch, just this tool? 
                // Or throw partial error? For now, skip update and return empty/error info?
                // We'll leave the old data if any.
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
