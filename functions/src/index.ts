// functions/src/index.ts
// This file is now empty as we are not using Cloud Functions for the export.
// The client-side implementation handles the API call directly.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {
  admin.initializeApp();
} catch (e) {
  // Ignore "app already exists" error
}
const db = admin.firestore();

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
