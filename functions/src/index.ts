// functions/src/index.ts
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const axios = require('axios');

try {
  admin.initializeApp();
} catch (e) {
  // Ignore "app already exists" error
}

const db = admin.firestore();

// --- Documentero AIMS DOCX Generation ---
exports.generateAimsDocument = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // 1. Auth Check (optional but recommended)
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required to generate documents.'
      );
    }

    const aimsData = data.aimsData;
    if (!aimsData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with an "aimsData" argument.'
      );
    }

    // 2. Retrieve API Key from environment variables (set in Firebase Console)
    const documenteroApiKey = functions.config().documentero?.api_key;
    if (!documenteroApiKey) {
        console.error("Documentero API key is not set in Firebase function configuration.");
        throw new functions.https.HttpsError('internal', 'Server configuration error: Missing API key.');
    }
    
    // 3. Prepare the payload for Documentero API
    const requestPayload = {
      document: 'jyhIyFKzOaQps7aWLoyX', // Your template ID
      format: 'docx',
      data: {
        projectName: aimsData.projectName || '',
        departments: aimsData.departments || '',
        systems: aimsData.systems || '',
        scope: aimsData.scope || '',
        policy: aimsData.policy || '',
        auditRhythm: aimsData.auditRhythm || '',
        monitoringProcess: aimsData.monitoringProcess || '',
        kpis: aimsData.kpis || '',
        factors: aimsData.factors || '',
        improvementProcess: aimsData.improvementProcess || '',
        stakeholders: aimsData.stakeholders || [],
        risks: aimsData.risks || [],
        raci: aimsData.raci || [],
        'aimsProgress.step1_complete': aimsData.aimsProgress?.step1_complete ?? false,
        'aimsProgress.step2_complete': aimsData.aimsProgress?.step2_complete ?? false,
        'aimsProgress.step3_complete': aimsData.aimsProgress?.step3_complete ?? false,
        'aimsProgress.step4_complete': aimsData.aimsProgress?.step4_complete ?? false,
        'aimsProgress.step5_complete': aimsData.aimsProgress?.step5_complete ?? false,
        'aimsProgress.step6_complete': aimsData.aimsProgress?.step6_complete ?? false,
        'aimsProgress.updatedAt': aimsData.aimsProgress?.updatedAt ? new Date(aimsData.aimsProgress.updatedAt.seconds * 1000).toLocaleString('de-DE') : '',
        generatedAt: new Date(aimsData.generatedAt).toLocaleString('de-DE'),
      },
    };

    // 4. Call Documentero API
    try {
      const response = await axios.post('https://app.documentero.com/api', requestPayload, {
          headers: {
              'Authorization': `apiKey ${documenteroApiKey}`,
              'Content-Type': 'application/json'
          }
      });
      
      if (response.data && response.data.status === 200 && response.data.data) {
        return { downloadUrl: response.data.data };
      } else {
        console.error('Documentero API returned an error or unexpected response:', response.data);
        throw new functions.https.HttpsError('internal', response.data.message || 'Failed to generate document via Documentero.');
      }
    } catch (error) {
      console.error('Error calling Documentero API:', error.response ? error.response.data : error.message);
      throw new functions.https.HttpsError('internal', 'An error occurred while communicating with the document generation service.');
    }
});


// --- Stripe Webhook Function (existing) ---
const express = require('express');
const stripeLib = require('stripe');

const { defineSecret } = require('firebase-functions/params');
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

const app = express();

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/stripe/webhook')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.post('/stripe/webhook', (req, res) => {
    const stripe = stripeLib(STRIPE_API_KEY.value());
    const sig = req.get('stripe-signature');
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const eventLogRef = db.collection('stripe_events').doc(event.id);
    
    const handleEvent = async () => {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const customerEmail = session.customer_details?.email;
                const stripeCustomerId = session.customer;

                if (customerEmail) {
                    const userRef = db.collection('customers').doc(customerEmail);
                    await userRef.set({
                        email: customerEmail,
                        stripeId: stripeCustomerId,
                        status: 'active',
                        created: admin.firestore.FieldValue.serverTimestamp(),
                    }, {merge: true});
                    await eventLogRef.set({ /* ... event log data ... */ });
                }
                break;
            }
            // ... other event types
            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
        res.status(200).json({received: true});
    };

    handleEvent().catch(error => {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

exports.api = functions.region('europe-west1').https.onRequest(
  { secrets: [STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET], cors: true },
  app
);
