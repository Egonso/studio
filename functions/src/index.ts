import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { sendWelcomeEmailOnPurchase } from './sendWelcomeEmail';
import { scheduledSupplierReminders } from './scheduledSupplierReminders';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import {
  buildCustomerEntitlementRecord,
  inferCheckoutEntitlement,
  inferEntitlementPlanFromHints,
  type BillingLineItemHint,
} from './billing-entitlements';
import {
  applyCustomerEntitlementToProductModels,
  setCustomerEntitlementStatus,
  upsertCustomerEntitlement,
} from './product-entitlement-sync';
import { processAffiliateCommission } from './affiliate-commission';

// Initialize Firebase Admin
admin.initializeApp();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeApiKeyLegacy = defineSecret('STRIPE_API_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_API_VERSION = '2026-02-25.clover' as Stripe.LatestApiVersion;

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
  return (
    safeSecretValue(stripeWebhookSecret) ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    null
  );
}

function toLineItemHints(
  lineItems: Stripe.ApiList<Stripe.LineItem>,
): BillingLineItemHint[] {
  return lineItems.data.map((item) => {
    const product = item.price?.product;
    return {
      priceId: item.price?.id ?? null,
      lookupKey: item.price?.lookup_key ?? null,
      productId: typeof product === 'string' ? product : (product?.id ?? null),
      productName:
        typeof product === 'object' && product && 'name' in product
          ? (product.name ?? null)
          : null,
      description: item.description ?? null,
    };
  });
}

function readCheckoutTextField(
  session: Stripe.Checkout.Session,
  key: string,
): string | null {
  const field = session.custom_fields?.find((entry) => entry.key === key);
  const value =
    field && 'text' in field ? field.text?.value?.trim() : undefined;
  return value && value.length > 0 ? value : null;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function resolveSessionAccessExpiresAt(
  session: Stripe.Checkout.Session,
): string | null {
  const metadataExpiry = session.metadata?.accessExpiresAt?.trim();
  if (metadataExpiry && Number.isFinite(Date.parse(metadataExpiry))) {
    return new Date(metadataExpiry).toISOString();
  }

  if (session.metadata?.sourceFlow === 'fortbildung_neulaunch_checkout') {
    return addMonths(new Date(session.created * 1000), 12).toISOString();
  }

  return null;
}

export const stripeWebhook = onRequest(
  {
    cors: true,
    region: 'europe-west1',
    secrets: [stripeSecretKey, stripeApiKeyLegacy, stripeWebhookSecret],
  },
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
        resolvedWebhookSecret,
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
        const isFortbildungCheckout =
          session.metadata?.sourceFlow === 'fortbildung_neulaunch_checkout';
        const checkoutOrganisation = readCheckoutTextField(
          session,
          'organisation',
        );
        const checkoutProjectContext = readCheckoutTextField(
          session,
          'projektkontext',
        );
        const checkoutAccessExpiresAt = isFortbildungCheckout
          ? resolveSessionAccessExpiresAt(session)
          : null;

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
          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id,
            {
              limit: 20,
              expand: ['data.price.product'],
            },
          );
          const resolvedEntitlement = inferCheckoutEntitlement({
            metadata: session.metadata,
            productId: session.metadata?.productId ?? null,
            lineItems: toLineItemHints(lineItems),
          });
          const plan = resolvedEntitlement?.plan ?? null;

          // Parallel update: Studio 'customers' collection
          const customerRef = db.collection('customers').doc(email);
          await customerRef.set(
            {
              email: email,
              name:
                checkoutOrganisation || session.customer_details?.name || null,
              stripeId: session.customer || null,
              status: 'active',
              purchaseAmount: session.amount_total,
              productId:
                session.metadata?.productId || 'eu-ai-act-certification',
              entitlementPlan: plan,
              canRegister: true,
              sourceFlow: session.metadata?.sourceFlow || null,
              projectContext: checkoutProjectContext,
              accessExpiresAt: checkoutAccessExpiresAt,
              checkoutCustomFields: {
                organisation: checkoutOrganisation,
                projektkontext: checkoutProjectContext,
              },
              created: admin.firestore.FieldValue.serverTimestamp(),
              source: 'stripe-webhook-v2',
            },
            { merge: true },
          );

          if (plan && plan !== 'free') {
            const customerEntitlement = await upsertCustomerEntitlement(
              db,
              buildCustomerEntitlementRecord({
                email,
                plan,
                source: 'stripe_checkout',
                productId: session.metadata?.productId || null,
                billingProductKey:
                  resolvedEntitlement?.billingProductKey ?? null,
                checkoutSessionId: session.id,
                accessExpiresAt: checkoutAccessExpiresAt,
                stripeCustomerId:
                  typeof session.customer === 'string'
                    ? session.customer
                    : null,
                subscriptionId:
                  typeof session.subscription === 'string'
                    ? session.subscription
                    : null,
              }),
            );
            await applyCustomerEntitlementToProductModels(
              db,
              email,
              customerEntitlement,
              'stripe_webhook',
            );
          }

          // Add email to allowlist in Firestore (Compass App)
          const allowlistRef = db.collection('allowlist').doc(email);
          await allowlistRef.set(
            {
              email: email,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              active: true,
              source: 'stripe',
              stripeCustomerId:
                typeof session.customer === 'string' ? session.customer : null,
              sessionId: session.id,
              amountPaid: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency || 'eur',
              sourceFlow: session.metadata?.sourceFlow || null,
              projectContext: checkoutProjectContext,
              accessExpiresAt: checkoutAccessExpiresAt,
              purchases: admin.firestore.FieldValue.arrayUnion({
                type: 'checkout',
                id: session.id,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                timestamp: new Date().toISOString(),
              }),
            },
            { merge: true },
          );

          console.log(
            `Updated ${email} in both 'customers' (Studio) and 'allowlist' (Compass)`,
          );

          // Affiliate commission processing
          await processAffiliateCommission(db, stripe, {
            email,
            grossAmount: session.amount_total ?? 0,
            currency: session.currency || 'eur',
            stripeEventId: event.id,
            stripeEventType: event.type,
            checkoutSessionId: session.id,
            invoiceId: null,
            subscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : null,
          });
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
          const invoiceParent = (invoice as unknown as {
            parent?: {
              subscription_details?: {
                metadata?: Record<string, string> | null;
              } | null;
            } | null;
          }).parent ?? null;
          const plan = inferEntitlementPlanFromHints([
            invoiceParent?.subscription_details?.metadata?.plan ?? null,
            invoice.lines?.data?.[0]?.price?.lookup_key ?? null,
            invoice.lines?.data?.[0]?.price?.id ?? null,
          ]);

          const allowlistRef = db.collection('allowlist').doc(email);

          await allowlistRef.set(
            {
              email: email,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              active: true,
              source: 'stripe',
              stripeCustomerId:
                typeof invoice.customer === 'string' ? invoice.customer : null,
              purchases: admin.firestore.FieldValue.arrayUnion({
                type: 'invoice',
                id: invoice.id,
                amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
                timestamp: new Date().toISOString(),
              }),
            },
            { merge: true },
          );

          if (plan && plan !== 'free') {
            const customerEntitlement = await upsertCustomerEntitlement(
              db,
              buildCustomerEntitlementRecord({
                email,
                plan,
                source: 'stripe_webhook',
                productId: null,
                stripeCustomerId:
                  typeof invoice.customer === 'string'
                    ? invoice.customer
                    : null,
                subscriptionId:
                  typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : null,
              }),
            );
            await applyCustomerEntitlementToProductModels(
              db,
              email,
              customerEntitlement,
              'stripe_webhook',
            );
          } else {
            await setCustomerEntitlementStatus(db, {
              email,
              status: 'active',
              source: 'stripe_webhook',
              stripeCustomerId:
                typeof invoice.customer === 'string' ? invoice.customer : null,
              subscriptionId:
                typeof invoice.subscription === 'string'
                  ? invoice.subscription
                  : null,
              fallbackPlanHints: [
                invoiceParent?.subscription_details?.metadata?.plan ?? null,
                invoice.lines?.data?.[0]?.price?.lookup_key ?? null,
                invoice.lines?.data?.[0]?.price?.id ?? null,
              ],
            });
          }

          console.log(`Added ${email} to allowlist from Stripe subscription`);

          // Affiliate commission processing
          await processAffiliateCommission(db, stripe, {
            email,
            grossAmount: invoice.amount_paid ?? 0,
            currency: (invoice.currency as string) || 'eur',
            stripeEventId: event.id,
            stripeEventType: event.type,
            checkoutSessionId: null,
            invoiceId: invoice.id,
            subscriptionId:
              typeof invoice.subscription === 'string'
                ? invoice.subscription
                : null,
          });
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
              refundReason: 'charge_refunded',
            });

            await setCustomerEntitlementStatus(db, {
              email,
              status: 'inactive',
              source: 'stripe_webhook',
              stripeCustomerId: charge.customer,
            });

            console.log(`Deactivated access for ${email} due to refund`);
          }
        }
      }

      if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        if (typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(
            subscription.customer,
          );
          if (customer && !customer.deleted && customer.email) {
            await setCustomerEntitlementStatus(db, {
              email: customer.email.toLowerCase(),
              status: 'inactive',
              source: 'stripe_webhook',
              stripeCustomerId: subscription.customer,
              subscriptionId: subscription.id,
              fallbackPlanHints: [
                subscription.metadata?.plan ?? null,
                subscription.items.data[0]?.price.lookup_key ?? null,
                subscription.items.data[0]?.price.id ?? null,
              ],
            });
          }
        }
      }

      if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        if (typeof subscription.customer === 'string') {
          const customer = await stripe.customers.retrieve(
            subscription.customer,
          );
          if (customer && !customer.deleted && customer.email) {
            const subscriptionStatus = subscription.status;
            if (
              subscriptionStatus === 'active' ||
              subscriptionStatus === 'trialing' ||
              subscriptionStatus === 'past_due' ||
              subscriptionStatus === 'incomplete'
            ) {
              await setCustomerEntitlementStatus(db, {
                email: customer.email.toLowerCase(),
                status: 'active',
                source: 'stripe_webhook',
                stripeCustomerId: subscription.customer,
                subscriptionId: subscription.id,
                fallbackPlanHints: [
                  subscription.metadata?.plan ?? null,
                  subscription.items.data[0]?.price.lookup_key ?? null,
                  subscription.items.data[0]?.price.id ?? null,
                ],
              });
            } else if (
              subscriptionStatus === 'canceled' ||
              subscriptionStatus === 'unpaid' ||
              subscriptionStatus === 'incomplete_expired' ||
              subscriptionStatus === 'paused'
            ) {
              await setCustomerEntitlementStatus(db, {
                email: customer.email.toLowerCase(),
                status: 'inactive',
                source: 'stripe_webhook',
                stripeCustomerId: subscription.customer,
                subscriptionId: subscription.id,
                fallbackPlanHints: [
                  subscription.metadata?.plan ?? null,
                  subscription.items.data[0]?.price.lookup_key ?? null,
                  subscription.items.data[0]?.price.id ?? null,
                ],
              });
            }
          }
        }
      }

      // Mark event as processed
      await eventRef.set({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        type: event.type,
      });

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  },
);

// Export the welcome email function
export { sendWelcomeEmailOnPurchase };
export { scheduledSupplierReminders };
export * from './tools/checkPublicInfo';
export * from './legacyApi';
