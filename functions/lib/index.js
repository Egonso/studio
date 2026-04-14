"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledSupplierReminders = exports.sendWelcomeEmailOnPurchase = exports.stripeWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const sendWelcomeEmail_1 = require("./sendWelcomeEmail");
Object.defineProperty(exports, "sendWelcomeEmailOnPurchase", { enumerable: true, get: function () { return sendWelcomeEmail_1.sendWelcomeEmailOnPurchase; } });
const scheduledSupplierReminders_1 = require("./scheduledSupplierReminders");
Object.defineProperty(exports, "scheduledSupplierReminders", { enumerable: true, get: function () { return scheduledSupplierReminders_1.scheduledSupplierReminders; } });
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const billing_entitlements_1 = require("./billing-entitlements");
const product_entitlement_sync_1 = require("./product-entitlement-sync");
const affiliate_commission_1 = require("./affiliate-commission");
// Initialize Firebase Admin
admin.initializeApp();
const stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const stripeApiKeyLegacy = (0, params_1.defineSecret)('STRIPE_API_KEY');
const stripeWebhookSecret = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
const STRIPE_API_VERSION = '2026-02-25.clover';
function safeSecretValue(secret) {
    try {
        return secret.value();
    }
    catch (_a) {
        return '';
    }
}
function resolveStripeSecretKey() {
    return (safeSecretValue(stripeSecretKey) ||
        process.env.STRIPE_SECRET_KEY ||
        safeSecretValue(stripeApiKeyLegacy) ||
        process.env.STRIPE_API_KEY ||
        null);
}
function resolveStripeWebhookSecret() {
    return (safeSecretValue(stripeWebhookSecret) ||
        process.env.STRIPE_WEBHOOK_SECRET ||
        null);
}
function toLineItemHints(lineItems) {
    return lineItems.data.map((item) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const product = (_a = item.price) === null || _a === void 0 ? void 0 : _a.product;
        return {
            priceId: (_c = (_b = item.price) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null,
            lookupKey: (_e = (_d = item.price) === null || _d === void 0 ? void 0 : _d.lookup_key) !== null && _e !== void 0 ? _e : null,
            productId: typeof product === 'string' ? product : ((_f = product === null || product === void 0 ? void 0 : product.id) !== null && _f !== void 0 ? _f : null),
            productName: typeof product === 'object' && product && 'name' in product
                ? ((_g = product.name) !== null && _g !== void 0 ? _g : null)
                : null,
            description: (_h = item.description) !== null && _h !== void 0 ? _h : null,
        };
    });
}
exports.stripeWebhook = (0, https_1.onRequest)({
    cors: true,
    region: 'europe-west1',
    secrets: [stripeSecretKey, stripeApiKeyLegacy, stripeWebhookSecret],
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30;
    const db = admin.firestore();
    const resolvedStripeSecretKey = resolveStripeSecretKey();
    const resolvedWebhookSecret = resolveStripeWebhookSecret();
    if (!resolvedStripeSecretKey || !resolvedWebhookSecret) {
        res.status(500).json({ error: 'Stripe webhook configuration missing' });
        return;
    }
    // Initialize Stripe inside handler to use secret
    const stripe = new stripe_1.default(resolvedStripeSecretKey, {
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
    let event;
    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.rawBody, sig, resolvedWebhookSecret);
    }
    catch (err) {
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
            const session = event.data.object;
            // Get customer email
            let email = '';
            if ((_a = session.customer_details) === null || _a === void 0 ? void 0 : _a.email) {
                email = session.customer_details.email.toLowerCase();
            }
            else if (session.customer_email) {
                email = session.customer_email.toLowerCase();
            }
            else if (typeof session.customer === 'string') {
                // Fetch customer from Stripe to get email
                const customer = await stripe.customers.retrieve(session.customer);
                if (customer && !customer.deleted && customer.email) {
                    email = customer.email.toLowerCase();
                }
            }
            if (email) {
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                    limit: 20,
                    expand: ['data.price.product'],
                });
                const resolvedEntitlement = (0, billing_entitlements_1.inferCheckoutEntitlement)({
                    metadata: session.metadata,
                    productId: (_c = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.productId) !== null && _c !== void 0 ? _c : null,
                    lineItems: toLineItemHints(lineItems),
                });
                const plan = (_d = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.plan) !== null && _d !== void 0 ? _d : null;
                // Parallel update: Studio 'customers' collection
                const customerRef = db.collection('customers').doc(email);
                await customerRef.set({
                    email: email,
                    name: ((_e = session.customer_details) === null || _e === void 0 ? void 0 : _e.name) || null,
                    stripeId: session.customer || null,
                    status: 'active',
                    purchaseAmount: session.amount_total,
                    productId: ((_f = session.metadata) === null || _f === void 0 ? void 0 : _f.productId) || 'eu-ai-act-certification',
                    entitlementPlan: plan,
                    canRegister: true,
                    created: admin.firestore.FieldValue.serverTimestamp(),
                    source: 'stripe-webhook-v2',
                }, { merge: true });
                if (plan && plan !== 'free') {
                    const customerEntitlement = await (0, product_entitlement_sync_1.upsertCustomerEntitlement)(db, (0, billing_entitlements_1.buildCustomerEntitlementRecord)({
                        email,
                        plan,
                        source: 'stripe_checkout',
                        productId: ((_g = session.metadata) === null || _g === void 0 ? void 0 : _g.productId) || null,
                        billingProductKey: (_h = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.billingProductKey) !== null && _h !== void 0 ? _h : null,
                        checkoutSessionId: session.id,
                        stripeCustomerId: typeof session.customer === 'string'
                            ? session.customer
                            : null,
                        subscriptionId: typeof session.subscription === 'string'
                            ? session.subscription
                            : null,
                    }));
                    await (0, product_entitlement_sync_1.applyCustomerEntitlementToProductModels)(db, email, customerEntitlement, 'stripe_webhook');
                }
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
                        timestamp: new Date().toISOString(),
                    }),
                }, { merge: true });
                console.log(`Updated ${email} in both 'customers' (Studio) and 'allowlist' (Compass)`);
                // Affiliate commission processing
                await (0, affiliate_commission_1.processAffiliateCommission)(db, stripe, {
                    email,
                    grossAmount: (_j = session.amount_total) !== null && _j !== void 0 ? _j : 0,
                    currency: session.currency || 'eur',
                    stripeEventId: event.id,
                    stripeEventType: event.type,
                    checkoutSessionId: session.id,
                    invoiceId: null,
                    subscriptionId: typeof session.subscription === 'string'
                        ? session.subscription
                        : null,
                });
            }
        }
        // Handle invoice.paid for subscriptions
        if (event.type === 'invoice.paid') {
            const invoice = event.data.object;
            let email = '';
            if (invoice.customer_email) {
                email = invoice.customer_email.toLowerCase();
            }
            else if (typeof invoice.customer === 'string') {
                // Fetch customer from Stripe to get email
                const customer = await stripe.customers.retrieve(invoice.customer);
                if (customer && !customer.deleted && customer.email) {
                    email = customer.email.toLowerCase();
                }
            }
            if (email) {
                const invoiceParent = (_k = invoice.parent) !== null && _k !== void 0 ? _k : null;
                const plan = (0, billing_entitlements_1.inferEntitlementPlanFromHints)([
                    (_o = (_m = (_l = invoiceParent === null || invoiceParent === void 0 ? void 0 : invoiceParent.subscription_details) === null || _l === void 0 ? void 0 : _l.metadata) === null || _m === void 0 ? void 0 : _m.plan) !== null && _o !== void 0 ? _o : null,
                    (_t = (_s = (_r = (_q = (_p = invoice.lines) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.price) === null || _s === void 0 ? void 0 : _s.lookup_key) !== null && _t !== void 0 ? _t : null,
                    (_y = (_x = (_w = (_v = (_u = invoice.lines) === null || _u === void 0 ? void 0 : _u.data) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.price) === null || _x === void 0 ? void 0 : _x.id) !== null && _y !== void 0 ? _y : null,
                ]);
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
                        timestamp: new Date().toISOString(),
                    }),
                }, { merge: true });
                if (plan && plan !== 'free') {
                    const customerEntitlement = await (0, product_entitlement_sync_1.upsertCustomerEntitlement)(db, (0, billing_entitlements_1.buildCustomerEntitlementRecord)({
                        email,
                        plan,
                        source: 'stripe_webhook',
                        productId: null,
                        stripeCustomerId: typeof invoice.customer === 'string'
                            ? invoice.customer
                            : null,
                        subscriptionId: typeof invoice.subscription === 'string'
                            ? invoice.subscription
                            : null,
                    }));
                    await (0, product_entitlement_sync_1.applyCustomerEntitlementToProductModels)(db, email, customerEntitlement, 'stripe_webhook');
                }
                else {
                    await (0, product_entitlement_sync_1.setCustomerEntitlementStatus)(db, {
                        email,
                        status: 'active',
                        source: 'stripe_webhook',
                        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
                        subscriptionId: typeof invoice.subscription === 'string'
                            ? invoice.subscription
                            : null,
                        fallbackPlanHints: [
                            (_1 = (_0 = (_z = invoiceParent === null || invoiceParent === void 0 ? void 0 : invoiceParent.subscription_details) === null || _z === void 0 ? void 0 : _z.metadata) === null || _0 === void 0 ? void 0 : _0.plan) !== null && _1 !== void 0 ? _1 : null,
                            (_6 = (_5 = (_4 = (_3 = (_2 = invoice.lines) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3[0]) === null || _4 === void 0 ? void 0 : _4.price) === null || _5 === void 0 ? void 0 : _5.lookup_key) !== null && _6 !== void 0 ? _6 : null,
                            (_11 = (_10 = (_9 = (_8 = (_7 = invoice.lines) === null || _7 === void 0 ? void 0 : _7.data) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.price) === null || _10 === void 0 ? void 0 : _10.id) !== null && _11 !== void 0 ? _11 : null,
                        ],
                    });
                }
                console.log(`Added ${email} to allowlist from Stripe subscription`);
                // Affiliate commission processing
                await (0, affiliate_commission_1.processAffiliateCommission)(db, stripe, {
                    email,
                    grossAmount: (_12 = invoice.amount_paid) !== null && _12 !== void 0 ? _12 : 0,
                    currency: invoice.currency || 'eur',
                    stripeEventId: event.id,
                    stripeEventType: event.type,
                    checkoutSessionId: null,
                    invoiceId: invoice.id,
                    subscriptionId: typeof invoice.subscription === 'string'
                        ? invoice.subscription
                        : null,
                });
            }
        }
        // Handle refunds - deactivate access
        if (event.type === 'charge.refunded') {
            const charge = event.data.object;
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
                    await (0, product_entitlement_sync_1.setCustomerEntitlementStatus)(db, {
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
            const subscription = event.data.object;
            if (typeof subscription.customer === 'string') {
                const customer = await stripe.customers.retrieve(subscription.customer);
                if (customer && !customer.deleted && customer.email) {
                    await (0, product_entitlement_sync_1.setCustomerEntitlementStatus)(db, {
                        email: customer.email.toLowerCase(),
                        status: 'inactive',
                        source: 'stripe_webhook',
                        stripeCustomerId: subscription.customer,
                        subscriptionId: subscription.id,
                        fallbackPlanHints: [
                            (_14 = (_13 = subscription.metadata) === null || _13 === void 0 ? void 0 : _13.plan) !== null && _14 !== void 0 ? _14 : null,
                            (_16 = (_15 = subscription.items.data[0]) === null || _15 === void 0 ? void 0 : _15.price.lookup_key) !== null && _16 !== void 0 ? _16 : null,
                            (_18 = (_17 = subscription.items.data[0]) === null || _17 === void 0 ? void 0 : _17.price.id) !== null && _18 !== void 0 ? _18 : null,
                        ],
                    });
                }
            }
        }
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            if (typeof subscription.customer === 'string') {
                const customer = await stripe.customers.retrieve(subscription.customer);
                if (customer && !customer.deleted && customer.email) {
                    const subscriptionStatus = subscription.status;
                    if (subscriptionStatus === 'active' ||
                        subscriptionStatus === 'trialing' ||
                        subscriptionStatus === 'past_due' ||
                        subscriptionStatus === 'incomplete') {
                        await (0, product_entitlement_sync_1.setCustomerEntitlementStatus)(db, {
                            email: customer.email.toLowerCase(),
                            status: 'active',
                            source: 'stripe_webhook',
                            stripeCustomerId: subscription.customer,
                            subscriptionId: subscription.id,
                            fallbackPlanHints: [
                                (_20 = (_19 = subscription.metadata) === null || _19 === void 0 ? void 0 : _19.plan) !== null && _20 !== void 0 ? _20 : null,
                                (_22 = (_21 = subscription.items.data[0]) === null || _21 === void 0 ? void 0 : _21.price.lookup_key) !== null && _22 !== void 0 ? _22 : null,
                                (_24 = (_23 = subscription.items.data[0]) === null || _23 === void 0 ? void 0 : _23.price.id) !== null && _24 !== void 0 ? _24 : null,
                            ],
                        });
                    }
                    else if (subscriptionStatus === 'canceled' ||
                        subscriptionStatus === 'unpaid' ||
                        subscriptionStatus === 'incomplete_expired' ||
                        subscriptionStatus === 'paused') {
                        await (0, product_entitlement_sync_1.setCustomerEntitlementStatus)(db, {
                            email: customer.email.toLowerCase(),
                            status: 'inactive',
                            source: 'stripe_webhook',
                            stripeCustomerId: subscription.customer,
                            subscriptionId: subscription.id,
                            fallbackPlanHints: [
                                (_26 = (_25 = subscription.metadata) === null || _25 === void 0 ? void 0 : _25.plan) !== null && _26 !== void 0 ? _26 : null,
                                (_28 = (_27 = subscription.items.data[0]) === null || _27 === void 0 ? void 0 : _27.price.lookup_key) !== null && _28 !== void 0 ? _28 : null,
                                (_30 = (_29 = subscription.items.data[0]) === null || _29 === void 0 ? void 0 : _29.price.id) !== null && _30 !== void 0 ? _30 : null,
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
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});
__exportStar(require("./tools/checkPublicInfo"), exports);
__exportStar(require("./legacyApi"), exports);
//# sourceMappingURL=index.js.map