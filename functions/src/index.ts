
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

    try {
      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerEmail = session.customer_details?.email;
          const stripeCustomerId = session.customer as string;

          if (customerEmail) {
            const userRef = db.collection("customers").doc(customerEmail);
            await userRef.set({
              email: customerEmail,
              stripeId: stripeCustomerId,
              status: "active",
              created: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});

            logger.info(`User ${customerEmail} created/updated from checkout session.`);

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
             logger.warn("Checkout session completed without customer email.");
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerEmail = invoice.customer_email;
          const stripeCustomerId = invoice.customer as string;

          if (customerEmail) {
             const userRef = db.collection("customers").doc(customerEmail);
             await userRef.set({
                email: customerEmail,
                stripeId: stripeCustomerId,
                status: "active",
                lastInvoicePaid: admin.firestore.FieldValue.serverTimestamp(),
             }, {merge: true});
             logger.info(`User ${customerEmail} updated from invoice.paid.`);
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
            const charge = event.data.object as Stripe.Charge;
            const customerEmail = charge.billing_details.email;

            if (customerEmail) {
                const userRef = db.collection("customers").doc(customerEmail);
                await userRef.update({
                    status: "refunded",
                    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`User ${customerEmail} status set to refunded.`);
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
          logger.info(`Unhandled Stripe event type: ${event.type}`);
          await eventLogRef.set({
            type: event.type,
            data: event.data.object,
            created: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      response.status(200).json({received: true});

    } catch (error) {
      logger.error("Error processing webhook:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);
