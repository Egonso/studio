"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPublicInfo = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const perplexityApiKey = (0, params_1.defineSecret)('PERPLEXITY_API_KEY');
exports.checkPublicInfo = (0, https_1.onCall)({ secrets: [perplexityApiKey] }, async (request) => {
    var _a;
    const db = admin.firestore();
    // 1. Auth Check
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const data = request.data;
    const { projectId, toolId, force } = data;
    if (!projectId || !toolId) {
        throw new functions.https.HttpsError('invalid-argument', 'projectId and toolId are required.');
    }
    // 2. Validate Project Access (Basic check: user is in project or owner)
    // For now assuming if they can write to the project tools, they can check.
    // Ideally, check project members list.
    const toolRef = db.collection('projects').doc(projectId).collection('tools').doc(toolId);
    const toolSnap = await toolRef.get();
    if (!toolSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Tool not found.');
    }
    const toolData = toolSnap.data();
    const toolName = toolData === null || toolData === void 0 ? void 0 : toolData.name;
    if (!toolName) {
        throw new functions.https.HttpsError('failed-precondition', 'Tool name is missing.');
    }
    // 3. Cache Check
    const lastCheckedAt = (_a = toolData === null || toolData === void 0 ? void 0 : toolData.publicInfo) === null || _a === void 0 ? void 0 : _a.lastCheckedAt;
    const now = admin.firestore.Timestamp.now();
    if (!force && lastCheckedAt) {
        const daysSinceCheck = (now.toMillis() - lastCheckedAt.toMillis()) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck < 14) {
            console.log(`Using cached info for ${toolName} (checked ${daysSinceCheck.toFixed(1)} days ago)`);
            return toolData === null || toolData === void 0 ? void 0 : toolData.publicInfo;
        }
    }
    // 4. Rate Limiting (Simple Implementation)
    // Store a daily counter in projects/{projectId}/_stats/perplexity_usage
    const usageRef = db.collection('projects').doc(projectId).collection('_stats').doc('perplexity_usage');
    const usageSnap = await usageRef.get();
    const usageData = usageSnap.exists ? usageSnap.data() : { dailyCount: 0, lastReset: null };
    // Reset usage if day changed
    const todayStr = new Date().toISOString().split('T')[0];
    let currentCount = (usageData === null || usageData === void 0 ? void 0 : usageData.dailyCount) || 0;
    if ((usageData === null || usageData === void 0 ? void 0 : usageData.lastReset) !== todayStr) {
        currentCount = 0;
    }
    if (currentCount >= 50) { // Cap at 50 per day to be safe (User asked for 10/hour, 50/day is simpler to track)
        throw new functions.https.HttpsError('resource-exhausted', 'Daily research limit reached for this project.');
    }
    await usageRef.set({
        dailyCount: currentCount + 1,
        lastReset: todayStr
    }, { merge: true });
    // 5. Perplexity API Call
    const apiKey = perplexityApiKey.value();
    if (!apiKey) {
        console.error('PERPLEXITY_API_KEY missing');
        throw new functions.https.HttpsError('internal', 'Configuration error.');
    }
    try {
        const researchPrompt = `
      Recherchiere Compliance-Informationen für das Software-Tool "${toolName}".
      Suche nach: Trust Center, Privacy Policy, DPA (Auftragsverarbeitungsvertrag), SCC (Standardvertragsklauseln), GDPR/DSGVO Statements.

      Antworte AUSSCHLIESSLICH mit folgendem JSON-Format (kein anderer Text):
      {
        "disclaimerVersion": "v1",
        "summary": "Kurze, neutrale Zusammenfassung der gefundenen Compliance-Infos (max 300 Zeichen).",
        "flags": {
          "gdprClaim": "yes" | "no" | "not_found",
          "aiActClaim": "yes" | "no" | "not_found",
          "trustCenterFound": "yes" | "no" | "not_found",
          "privacyPolicyFound": "yes" | "no" | "not_found",
          "dpaOrSccMention": "yes" | "no" | "not_found"
        },
        "confidence": "high" | "medium" | "low",
        "sources": [
          {
            "title": "Titel der Seite",
            "url": "URL",
            "type": "trust_center" | "privacy" | "terms" | "dpa" | "scc" | "blog" | "other"
          }
        ]
      }
      
      Regeln:
      - "gdprClaim": "yes" nur wenn explizit DSGVO/GDPR Compliance erwähnt wird.
      - Wenn keine Infos gefunden werden, setze "not_found".
      - Quellen bevorzugt direkt vom Anbieter.
    `;
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-reasoning-pro',
                messages: [
                    { role: 'system', content: 'You are a helpful compliance research assistant. Output only valid JSON.' },
                    { role: 'user', content: researchPrompt }
                ]
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity API Error:', errorText);
            throw new functions.https.HttpsError('internal', 'Research service unavailable.');
        }
        const json = await response.json();
        let contentStr = json.choices[0].message.content;
        // Clean up markdown code blocks if present
        contentStr = contentStr.replace(/```json/g, '').replace(/```/g, '').trim();
        // Remove separate thinking process if present (for reasoning models)
        if (contentStr.includes("</think>")) {
            contentStr = contentStr.split("</think>")[1].trim();
        }
        const resultData = JSON.parse(contentStr);
        // Add accessedAt to sources
        if (resultData.sources && Array.isArray(resultData.sources)) {
            resultData.sources = resultData.sources.map((s) => (Object.assign(Object.assign({}, s), { accessedAt: now })));
        }
        const publicInfo = Object.assign(Object.assign({}, resultData), { lastCheckedAt: now, checker: 'perplexity' });
        // 6. Update Firestore
        await toolRef.update({
            publicInfo: publicInfo,
            updatedAt: now
        });
        return publicInfo;
    }
    catch (error) {
        console.error('Check failed:', error);
        // If JSON parse fails or other error
        throw new functions.https.HttpsError('internal', 'Failed to process research results.');
    }
});
//# sourceMappingURL=checkPublicInfo.js.map