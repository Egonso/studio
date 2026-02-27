import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Admin SDK
// Run with: TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' ts-node scripts/seed-tool-catalog.ts
// Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'ai-act-compass-m6o05'
    });
}

const db = admin.firestore();

async function seedCatalog() {
    const catalogPath = path.join(__dirname, '../../eukigesetz/src/data/tool-catalog.json');

    if (!fs.existsSync(catalogPath)) {
        console.error('Catalog file not found at:', catalogPath);
        process.exit(1);
    }

    const rawData = fs.readFileSync(catalogPath, 'utf8');
    const tools = JSON.parse(rawData);

    console.log(`Found ${tools.length} tools to seed.`);

    const batch = db.batch();
    let count = 0;

    for (const tool of tools) {
        // Create a clean ID from the name
        const id = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const ref = db.collection('tool_catalog').doc(id);

        batch.set(ref, {
            name: tool.name,
            vendor: tool.vendor,
            type: tool.defaultType || 'saas',
            url: tool.homepageUrl || null,
            category: tool.category || null,
            popularity: 0, // Sort order
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        count++;
    }

    await batch.commit();
    console.log(`Seeded ${count} tools to 'tool_catalog' collection.`);
}

seedCatalog().catch(console.error);
