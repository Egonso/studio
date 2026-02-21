import fetch from 'node-fetch';

// Run with: ts-node scripts/test-perplexity.ts
// Ensure studio server is running locally or target deployed URL

const API_URL = 'http://localhost:3000/api/tools/public-info-check';
const MOCK_PROJECT_ID = 'test-project-newsletter';
const MOCK_TOOL_ID = 'chatgpt-test';

// Needs PERPLEXITY_API_KEY in server environment

async function testApi() {
    console.log('Testing Perplexity Integration...');

    // 1. Create a Mock Tool in Firestore first (optional, but API checks ID)
    // We assume the tool exists or we manually create it in Firestore Console 
    // OR we just rely on API caching logic (it tries to read doc). 

    // Ideally we skip Firestore setup here and just hit the endpoint if we want to confirm connectivity.
    // BUT the endpoint logic requires 'toolDoc.exists'.
    // So we assume 'test-project-newsletter' exists or we handle the empty case?
    // The API logic: "if (!toolDoc.exists) continue;"

    console.log('Ensure you have a document at: projects/' + MOCK_PROJECT_ID + '/tools/' + MOCK_TOOL_ID);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Auth check mocked or skipped locally?
            },
            body: JSON.stringify({
                projectId: MOCK_PROJECT_ID,
                toolIds: [MOCK_TOOL_ID],
                force: true
            })
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json() as any;
        console.log('Success!', JSON.stringify(data, null, 2));

        // Assertions
        if (data.results && data.results[MOCK_TOOL_ID]) {
            const info = data.results[MOCK_TOOL_ID];
            if (info.checker === 'perplexity') {
                console.log('PASS: Checker is perplexity');
            } else {
                console.log('WARN: Checker is', info.checker);
            }
            if (info.flags.gdprClaim) console.log('PASS: Flags present');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testApi();
