import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { sendWelcomeEmailOnPurchase } from './sendWelcomeEmail';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// Initialize Firebase Admin
admin.initializeApp();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeApiKeyLegacy = defineSecret('STRIPE_API_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_API_VERSION = '2025-02-24.acacia' as Stripe.LatestApiVersion;

// ... (existing imports)

function safeSecretValue(secret: { value: () => string }): string {
  try {
    return secret.value();
  } catch {
    return '';
  }
}

function resolveStripeSecretKey(): string | null {
  return (
    safeSecretValue(stripeSecretKey) ||
    process.env.STRIPE_SECRET_KEY ||
    safeSecretValue(stripeApiKeyLegacy) ||
    process.env.STRIPE_API_KEY ||
    null
  );
}

function resolveStripeWebhookSecret(): string | null {
  return safeSecretValue(stripeWebhookSecret) || process.env.STRIPE_WEBHOOK_SECRET || null;
}

export const stripeWebhook = onRequest(
  { cors: true, region: 'europe-west1', secrets: [stripeSecretKey, stripeApiKeyLegacy, stripeWebhookSecret] },
  async (req, res) => {
  const db = admin.firestore();
  const resolvedStripeSecretKey = resolveStripeSecretKey();
  const resolvedWebhookSecret = resolveStripeWebhookSecret();

  if (!resolvedStripeSecretKey || !resolvedWebhookSecret) {
    res.status(500).json({ error: 'Stripe webhook configuration missing' });
    return;
  }

  // Initialize Stripe inside handler to use secret
  const stripe = new Stripe(resolvedStripeSecretKey, {
    // Root and functions can resolve different stripe package versions during builds.
    // Pin the runtime API version explicitly and bind it to the installed SDK type.
    apiVersion: STRIPE_API_VERSION,
  });

  // Set CORS headers (handled by cors: true option in v2 usually, but for custom...)
  // Actually onRequest v2 takes options object.
  // v2 onRequest supports { cors: true } directly!
  // But let's keep manual headers if we want full control or just use option.
  // Let's use the option for cleanliness if possible, or just standard req, res.

  // Note: v2 onRequest signature: onRequest(options, handler) or onRequest(handler).
  // Handler is (req, res) => void | Promise<void>.
  // Req/Res are from Express (but v2 types).

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.get('stripe-signature');
  if (!sig) {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      resolvedWebhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Idempotency check - prevent duplicate processing
  const eventRef = db.collection('_stripe_events').doc(event.id);
  const eventDoc = await eventRef.get();

  if (eventDoc.exists) {
    console.log(`Event ${event.id} already processed`);
    res.json({ received: true, duplicate: true });
    return;
  }

  try {
    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get customer email
      let email = '';
      if (session.customer_details?.email) {
        email = session.customer_details.email.toLowerCase();
      } else if (session.customer_email) {
        email = session.customer_email.toLowerCase();
      } else if (typeof session.customer === 'string') {
        // Fetch customer from Stripe to get email
        const customer = await stripe.customers.retrieve(session.customer);
        if (customer && !customer.deleted && customer.email) {
          email = customer.email.toLowerCase();
        }
      }

      if (email) {
        // Parallel update: Studio 'customers' collection
        const customerRef = db.collection('customers').doc(email);
        await customerRef.set({
          email: email,
          name: session.customer_details?.name || null,
          stripeId: session.customer || null,
          status: 'active',
          purchaseAmount: session.amount_total,
          productId: session.metadata?.productId || 'eu-ai-act-certification',
          canRegister: true,
          created: admin.firestore.FieldValue.serverTimestamp(),
          source: 'stripe-webhook-v2'
        }, { merge: true });

        // Add email to allowlist in Firestore (Compass App)
        const allowlistRef = db.collection('allowlist').doc(email);
        await allowlistRef.set({
          email: email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true,
          source: 'stripe',
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          sessionId: session.id,
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'eur',
          purchases: admin.firestore.FieldValue.arrayUnion({
            type: 'checkout',
            id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });

        console.log(`Updated ${email} in both 'customers' (Studio) and 'allowlist' (Compass)`);
      }
    }

    // Handle invoice.paid for subscriptions
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;

      let email = '';
      if (invoice.customer_email) {
        email = invoice.customer_email.toLowerCase();
      } else if (typeof invoice.customer === 'string') {
        // Fetch customer from Stripe to get email
        const customer = await stripe.customers.retrieve(invoice.customer);
        if (customer && !customer.deleted && customer.email) {
          email = customer.email.toLowerCase();
        }
      }

      if (email) {
        const allowlistRef = db.collection('allowlist').doc(email);

        await allowlistRef.set({
          email: email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true,
          source: 'stripe',
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          purchases: admin.firestore.FieldValue.arrayUnion({
            type: 'invoice',
            id: invoice.id,
            amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });

        console.log(`Added ${email} to allowlist from Stripe subscription`);
      }
    }

    // Handle refunds - deactivate access
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;

      if (typeof charge.customer === 'string') {
        const customer = await stripe.customers.retrieve(charge.customer);
        if (customer && !customer.deleted && customer.email) {
          const email = customer.email.toLowerCase();
          const allowlistRef = db.collection('allowlist').doc(email);

          await allowlistRef.update({
            active: false,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundReason: 'charge_refunded'
          });

          console.log(`Deactivated access for ${email} due to refund`);
        }
      }
    }

    // Mark event as processed
    await eventRef.set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: event.type
    });

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the welcome email function
export { sendWelcomeEmailOnPurchase }; export * from './tools/checkPublicInfo';
export * from './legacyApi';
