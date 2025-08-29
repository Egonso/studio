/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

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
      logger.error(`Webhook Error: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    let customerEmail: string | null = null;
    let customerId: string | null = null;

    logger.info(`Received Stripe event: ${event.type}`);

    try {
      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.customer_details?.email) {
            customerEmail = session.customer_details.email;
            customerId = session.customer as string;

            await db.collection("customers").doc(customerEmail).set({
              email: customerEmail,
              stripeId: customerId,
              status: "active",
              created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});

            logger.info(`Customer created/updated: ${customerEmail}`);
          }
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.customer_email) {
            customerEmail = invoice.customer_email;
            customerId = invoice.customer as string;

            await db.collection("customers").doc(customerEmail).set({
              email: customerEmail,
              stripeId: customerId,
              status: "active",
              lastInvoicePaid: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
            logger.info(`Customer updated from invoice: ${customerEmail}`);
          }
          break;
        }
        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          if (charge.billing_details.email) {
            customerEmail = charge.billing_details.email;
            const customerRef = db.collection("customers").doc(customerEmail);
            const customerSnap = await customerRef.get();

            if (customerSnap.exists) {
              await customerRef.update({
                status: "refunded",
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(`Customer refunded: ${customerEmail}`);
            } else {
              logger.warn(`Refund for non-existent customer: ${customerEmail}`);
            }
          }
          break;
        }
        default:
          logger.warn(`Unhandled event type ${event.type}`);
      }
      response.status(200).send({received: true});
    } catch (error) {
      logger.error("Error processing webhook:", error);
      response.status(500).send("Internal Server Error");
    }
  });
