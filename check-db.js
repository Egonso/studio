const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // We might need this, or use default credential

// Initialize app
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: "ai-act-compass-m6o05"
    });
} catch (e) {
    admin.app(); // Already initialized
}

const db = admin.firestore();
const email = process.argv[2] || "test130@test100.com";

async function checkUser() {
    console.log(`Checking for user: ${email}`);
    try {
        const doc = await db.collection("customers").doc(email).get();
        if (doc.exists) {
            console.log("User FOUND:");
            console.log(JSON.stringify(doc.data(), null, 2));
        } else {
            console.log("User NOT FOUND in customers collection.");

            // valid attempt to list recent added?
            console.log("Checking recent events...");
            const events = await db.collection("stripe_events").orderBy("created", "desc").limit(5).get();
            events.forEach(e => {
                console.log(`Event ${e.id}: ${e.data().type} - ${JSON.stringify(e.data())}`);
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkUser();
