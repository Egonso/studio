
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Get Stripe API key from environment configuration
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2024-06-20",
});

// Get Stripe webhook secret from environment configuration
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const stripeWebhook = onRequest(
  {secrets: ["STRIPE_API_KEY", "STRIPE_WEBHOOK_SECRET"]},
  async (request, response) => {
    const sig = request.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const eventLogRef = db.collection("stripe_events").doc(event.id);
    const rawEventData = event.data.object as any;

    try {
      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          // Robustly get customer email from multiple possible locations
          const customerEmail = (session.customer_details?.email || rawEventData.email || session.metadata?.customerEmail)?.toLowerCase();

          if (customerEmail) {
            const userRef = db.collection("customers").doc(customerEmail);
            await userRef.set({
              email: customerEmail,
              stripeId: session.customer, // Can be null, that's okay
              status: "active",
              created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});

            logger.info(`Customer ${customerEmail} created/updated from checkout session.`);

            await eventLogRef.set({
                type: event.type,
                raw: rawEventData,
                email: customerEmail,
                customer: session.customer,
                created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});

          } else {
             logger.warn("Checkout session completed without customer email.", {sessionId: session.id});
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerEmail = invoice.customer_email?.toLowerCase();

          if (customerEmail) {
             const userRef = db.collection("customers").doc(customerEmail);
             await userRef.set({
                email: customerEmail,
                stripeId: invoice.customer,
                status: "active",
                lastInvoicePaid: admin.firestore.FieldValue.serverTimestamp(),
             }, {merge: true});
             logger.info(`Customer ${customerEmail} updated from invoice.paid.`);
          }
           await eventLogRef.set({
                type: event.type,
                raw: rawEventData,
                email: customerEmail,
                customer: invoice.customer,
                created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
          break;
        }

        case "charge.refunded": {
            const charge = event.data.object as Stripe.Charge;
            const customerEmail = charge.billing_details.email?.toLowerCase();

            if (customerEmail) {
                const userRef = db.collection("customers").doc(customerEmail);
                await userRef.update({
                    status: "refunded",
                    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`Customer ${customerEmail} status set to refunded.`);
            }
            await eventLogRef.set({
                type: event.type,
                raw: rawEventData,
                email: customerEmail,
                customer: charge.customer,
                created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
            break;
        }

        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
          await eventLogRef.set({
            type: event.type,
            raw: rawEventData,
            created: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
      }

      response.status(200).json({received: true});

    } catch (error) {
      logger.error("Error processing webhook:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);


/**
 * One-time utility function to backfill the `customers` collection from `stripe_events`.
 * Run this once after deployment by visiting its URL.
 */
export const backfillCustomers = onRequest(async (request, response) => {
    logger.info("Starting backfill of customers collection...");

    try {
        const stripeEventsSnapshot = await db.collection("stripe_events")
            .where("type", "in", ["checkout.session.completed", "invoice.paid"])
            .get();

        if (stripeEventsSnapshot.empty) {
            const message = "No 'checkout.session.completed' or 'invoice.paid' events found to backfill.";
            logger.info(message);
            response.status(200).send(message);
            return;
        }

        const batch = db.batch();
        let customersAdded = 0;
        const processedEmails = new Set<string>();

        stripeEventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            const rawData = eventData.raw || {}; // Fallback to empty object if raw is missing

            // Robustly determine the email from various possible fields, and convert to lower case
            const email = (
                rawData.customer_details?.email ||
                eventData.email ||
                rawData.customer_email ||
                rawData.metadata?.customerEmail
            )?.toLowerCase();


            if (email && !processedEmails.has(email)) {
                const customerRef = db.collection("customers").doc(email);
                
                batch.set(customerRef, {
                    email: email,
                    stripeId: eventData.customer, // This can be null
                    status: "active",
                    created: eventData.created || admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                
                customersAdded++;
                processedEmails.add(email);
            } else if (!email) {
                logger.warn(`Could not find email for event: ${doc.id}`);
            }
        });

        await batch.commit();
        const successMessage = `Backfill complete. Processed ${stripeEventsSnapshot.size} events. Added or updated ${customersAdded} unique customers.`;
        logger.info(successMessage);
        response.status(200).send(successMessage);
    } catch (error) {
        logger.error("Error during customer backfill:", error);
        response.status(500).send("An error occurred during the backfill process. Check logs for details.");
    }
});
