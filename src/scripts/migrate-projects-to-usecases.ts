import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// MUST provide path to service account key json
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../../../../service-account.json');

// Initialize Firebase Admin
try {
    let cert;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Allows passing stringified JSON directly via env
        cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        cert = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    }
    admin.initializeApp({ credential: admin.credential.cert(cert) });
    console.log('Firebase Admin initialized successfully.');
} catch (_error) {
    console.error('\n❌ Failed to initialize Firebase Admin.');
    console.error('Migration requires a service account JSON file.');
    console.error('Run: SERVICE_ACCOUNT_PATH=/path/to/key.json ts-node migrate-projects-to-usecases.ts\n');
    process.exit(1);
}

const db = admin.firestore();

// Helpers
const isDryRun = process.argv.includes('--dry-run');

async function migrateUserProjects() {
    console.log(`\n🚀 Starting Migration: Legacy Projects -> Register-First UseCases\n`);
    if (isDryRun) {
        console.log(`⚠️ DRY RUN MODE: No data will be written to Firestore.\n`);
    }

    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total users.\n`);

    let totalProjectsMigrated = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const projectsRef = userDoc.ref.collection('projects');
        const projectsSnapshot = await projectsRef.get();

        if (projectsSnapshot.empty) {
            continue;
        }

        console.log(`👤 User: ${userId} - Found ${projectsSnapshot.size} legacy projects`);

        // We must find or create a Register for this user to hold the new UseCases
        const registersRef = userDoc.ref.collection('registers');
        const registersSnapshot = await registersRef.limit(1).get();

        let targetRegisterId: string;

        if (registersSnapshot.empty) {
            // Create a default register for legacy projects
            const newRegisterRef = registersRef.doc();
            targetRegisterId = newRegisterRef.id;

            const newRegister = {
                registerId: targetRegisterId,
                name: "Hauptregister (Migriert)",
                createdAt: new Date().toISOString(),
                governanceMaturityLevel: 1 // Default baseline
            };

            console.log(`  ➕ Creating default Register: ${targetRegisterId}`);
            if (!isDryRun) {
                await newRegisterRef.set(newRegister);
            }
        } else {
            targetRegisterId = registersSnapshot.docs[0].id;
            console.log(`  🏠 Using existing Register: ${targetRegisterId}`);
        }

        const targetUseCaseCollection = registersRef.doc(targetRegisterId).collection('useCases');

        for (const projectDoc of projectsSnapshot.docs) {
            const data = projectDoc.data();
            const newUseCaseId = projectDoc.id; // Keep the same ID for easy matching

            // Map old fields to new UseCase structure
            const purposeName = data.name || data.purpose || 'Unbenanntes System';
            const createdDate = data.createdAt || new Date().toISOString();
            const orgName = data.organizationName || data.organisation || null;

            const newUseCase = {
                cardVersion: '1.2',
                useCaseId: newUseCaseId,
                createdAt: createdDate,
                updatedAt: new Date().toISOString(),
                purpose: purposeName,
                usageContexts: Array.isArray(data.usageContexts) ? data.usageContexts : ['INTERNAL_ONLY'],

                // Flattening tool info
                toolId: data.toolId || null,
                toolFreeText: data.toolName || data.toolFreeText || null,
                dataCategory: data.dataCategory || 'NONE',

                // New generic tags array wrapping optional features
                labels: data.optionalGroup ? [{ key: 'group', value: data.optionalGroup }] : [],
                organisation: orgName,

                responsibility: {
                    isCurrentlyResponsible: typeof data.isResponsible === 'boolean' ? data.isResponsible : true,
                    responsibleParty: data.responsiblePerson || data.ownerName || null,
                },
                decisionImpact: data.decisionImpact || 'UNSURE',
                affectedParties: Array.isArray(data.affectedParties) ? data.affectedParties : [],

                // Governance Design Engine Mapping
                governanceAssessment: {
                    core: {
                        aiActCategory: data.riskCategory || null,
                        oversightDefined: data.humanOversight ? true : false,
                        reviewCycleDefined: false, // Defaulting required new field
                        documentationLevelDefined: true,
                        coreVersion: 'EUKI-GOV-1.0',
                        assessedAt: new Date().toISOString()
                    },
                    flex: {
                        maturityLevel: "Level 1", // Baseline
                        oversightModel: data.humanOversight || null,
                        reviewFrequency: null,
                        riskControls: [],
                        trainingRequired: false,
                        policyLinks: [],
                        incidentProcessDefined: false
                    }
                },

                status: data.status || 'UNREVIEWED',
                reviewHints: data.reviewHints || [],
                evidences: data.evidences || [],
                reviews: data.reviews || [],
                proof: data.proof || null,

                // Audit trail stub
                statusHistory: [],
                isDeleted: false
            };

            console.log(`    → Migrating Project [${newUseCaseId}]: "${purposeName}"`);

            if (!isDryRun) {
                await targetUseCaseCollection.doc(newUseCaseId).set(newUseCase, { merge: true });
                // NOTE: We do NOT delete the old project doc in Sprint 1 to allow for easy fallback
            }
            totalProjectsMigrated++;
        }
    }

    console.log(`\n✅ Migration Complete.`);
    console.log(`Total projects identified and mapped: ${totalProjectsMigrated}`);
    if (isDryRun) {
        console.log(`Remove --dry-run flag to apply these changes to Firestore.`);
    }
}

migrateUserProjects().catch(console.error);
