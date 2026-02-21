import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// import serviceAccount from "../path/to/serviceAccountKey.json"; // User must provide this

if (getApps().length === 0) {
    // initializeApp({ credential: cert(serviceAccount) });
    console.log("Please supply a service account key to run this script.");
}

const db = getFirestore();

async function migrateLegacyProjects() {
    console.log("Starting migration of legacy projects to Register First UseCases...");

    const usersSnapshot = await db.collection("users").get();

    let totalMigrated = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const projectsRef = db.collection(`users/${userId}/projects`);
        const projectsSnapshot = await projectsRef.get();

        // We assume the FIRST project is the "Register" or we migrate all projects as UseCases into the first one.
        // Based on the new design, a user has a "Register" (which is actually a project document).
        // Let's identify the default register or create one.

        if (projectsSnapshot.empty) continue;

        let defaultRegisterId: string | null = null;

        for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();
            const projectId = projectDoc.id;

            // If it's the first project we encounter, mark it as the default register
            if (!defaultRegisterId) {
                defaultRegisterId = projectId;
            }

            // Is this project an old-style project that needs converting to a use-case?
            // Old projects have 'projectName'. New UseCases are stored in the registerUseCases subcollection.
            if (projectData.projectName && defaultRegisterId) {
                const useCaseId = `uc_migrated_${projectId}`;
                const targetUseCaseRef = db.collection(`users/${userId}/projects/${defaultRegisterId}/registerUseCases`).doc(useCaseId);

                const existingUseCase = await targetUseCaseRef.get();
                if (!existingUseCase.exists) {

                    // Map legacy project -> new UseCaseCard
                    const newCard = {
                        useCaseId,
                        cardVersion: "1.2",
                        createdAt: projectData.metadata?.createdAt ? projectData.metadata.createdAt : new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        purpose: projectData.projectName,
                        status: "UNREVIEWED",
                        responsibility: {
                            responsibleParty: "Automatisch migriert",
                            contactEmail: ""
                        },
                        toolId: "other",
                        toolFreeText: "Legacy Projekt",
                        usageContexts: [],
                        isDeleted: false,
                        isPublicVisible: false,
                        reviews: []
                    };

                    await targetUseCaseRef.set(newCard);
                    console.log(`Migrated legacy project '${projectData.projectName}' (${projectId}) to UseCase '${useCaseId}' under Register '${defaultRegisterId}'`);
                    totalMigrated++;
                }
            }
        }
    }

    console.log(`Migration completed. Total migrated legacy projects: ${totalMigrated}`);
}

// migrateLegacyProjects().catch(console.error);
