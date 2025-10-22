// index.js (CommonJS)
const functions = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const stripeLib = require("stripe");

// Secrets (über Secret Manager, NICHT in Storage!)
const { defineSecret } = require("firebase-functions/params");
const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// Firebase Admin initialisieren (einmalig)
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

// Express-App
const app = express();

// Stripe RAW-Body für Webhooks nötig:
app.use((req, res, next) => {
  // Nur auf der Webhook-Route raw lassen; für andere Routen gerne json()
  if (req.originalUrl === "/stripe/webhook") {
    // Firebase v2 onRequest: rawBody ist bereits verfügbar
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Webhook-Endpoint
app.post("/stripe/webhook", (req, res) => {
    const stripe = stripeLib(STRIPE_API_KEY.value());
    const sig = req.get("stripe-signature");
    let event;

    try {
      // In v2 ist req.rawBody verfügbar:
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const eventLogRef = db.collection("stripe_events").doc(event.id);
    
    const handleEvent = async () => {
        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
            const session = event.data.object;
            const customerEmail = session.customer_details?.email;
            const stripeCustomerId = session.customer;

            if (customerEmail) {
                const userRef = db.collection("customers").doc(customerEmail);
                await userRef.set({
                email: customerEmail,
                stripeId: stripeCustomerId,
                status: "active",
                created: admin.firestore.FieldValue.serverTimestamp(),
                }, {merge: true});

                console.log(`User ${customerEmail} created/updated from checkout session.`);

                await eventLogRef.set({
                    type: event.type,
                    email: customerEmail,
                    customer: stripeCustomerId,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    metadata: session.metadata,
                    created: admin.firestore.FieldValue.serverTimestamp(),
                });

            } else {
                console.warn("Checkout session completed without customer email.");
            }
            break;
            }

            case "invoice.paid": {
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;
            const stripeCustomerId = invoice.customer;

            if (customerEmail) {
                const userRef = db.collection("customers").doc(customerEmail);
                await userRef.set({
                    email: customerEmail,
                    stripeId: stripeCustomerId,
                    status: "active",
                    lastInvoicePaid: admin.firestore.FieldValue.serverTimestamp(),
                }, {merge: true});
                console.log(`User ${customerEmail} updated from invoice.paid.`);
            }
            await eventLogRef.set({
                    type: event.type,
                    email: customerEmail,
                    customer: stripeCustomerId,
                    amount_paid: invoice.amount_paid,
                    currency: invoice.currency,
                    created: admin.firestore.FieldValue.serverTimestamp(),
                });
            break;
            }

            case "charge.refunded": {
                const charge = event.data.object;
                const customerEmail = charge.billing_details.email;

                if (customerEmail) {
                    const userRef = db.collection("customers").doc(customerEmail);
                    await userRef.update({
                        status: "refunded",
                        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`User ${customerEmail} status set to refunded.`);
                }
                await eventLogRef.set({
                    type: event.type,
                    email: customerEmail,
                    customer: charge.customer,
                    amount_refunded: charge.amount_refunded,
                    currency: charge.currency,
                    created: admin.firestore.FieldValue.serverTimestamp(),
                });
                break;
            }

            default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
            await eventLogRef.set({
                type: event.type,
                data: event.data.object,
                created: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        res.status(200).json({received: true});
    };

    handleEvent().catch(error => {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    });
});


// Optional: einfache Health-Route
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Export der Function (eine einzige HTTPS-Funktion, die Express bedient)
exports.api = onRequest(
  { secrets: [STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET], cors: true },
  app
);
