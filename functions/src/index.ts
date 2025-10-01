
import {onCall, HttpsError} from "firebase-functions/v2/https";
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

export const checkRegistrationEligibility = onCall(async (data) => {
    const email = data.email;

    if (!email || typeof email !== 'string') {
        throw new HttpsError('invalid-argument', 'The function must be called with one arguments "email" containing the email to check.');
    }

    const lowerCaseEmail = email.toLowerCase();

    try {
        // First, check for a purchase event.
        const eventsRef = db.collection('stripe_events');
        const eventQuery = eventsRef.where('email', '==', lowerCaseEmail).limit(1);
        const eventSnapshot = await eventQuery.get();

        if (eventSnapshot.empty) {
            // No purchase event found, user is not eligible.
            return { eligible: false, reason: 'No purchase record found for this email address.' };
        }

        // Second, explicitly check if the customer has been refunded.
        const customerRef = db.collection('customers').doc(lowerCaseEmail);
        const customerDoc = await customerRef.get();

        if (customerDoc.exists && customerDoc.data()?.status === 'refunded') {
            // A purchase exists, but it was refunded. Deny registration.
            return { eligible: false, reason: 'This email address is associated with a refunded purchase.' };
        }

        // If a purchase event exists and there's no refund, they are eligible.
        return { eligible: true };

    } catch (error) {
        logger.error("Error in checkRegistrationEligibility:", error);
        throw new HttpsError('internal', 'An internal error occurred while checking eligibility.');
    }
});


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
