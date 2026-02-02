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
exports.sendWelcomeEmailOnPurchase = exports.stripeWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const sendWelcomeEmail_1 = require("./sendWelcomeEmail");
Object.defineProperty(exports, "sendWelcomeEmailOnPurchase", { enumerable: true, get: function () { return sendWelcomeEmail_1.sendWelcomeEmailOnPurchase; } });
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Stripe
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const stripeWebhookSecret = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
// ... (existing imports)
exports.stripeWebhook = (0, https_1.onRequest)({ cors: true, region: 'europe-west1', secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
    var _a, _b, _c;
    const db = admin.firestore();
    // Initialize Stripe inside handler to use secret
    const stripe = new stripe_1.default(stripeSecretKey.value(), {
        apiVersion: '2024-04-10',
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
        event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());
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
                // Parallel update: Studio 'customers' collection
                const customerRef = db.collection('customers').doc(email);
                await customerRef.set({
                    email: email,
                    name: ((_b = session.customer_details) === null || _b === void 0 ? void 0 : _b.name) || null,
                    stripeId: session.customer || null,
                    status: 'active',
                    purchaseAmount: session.amount_total,
                    productId: ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.productId) || 'eu-ai-act-certification',
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
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    })
                }, { merge: true });
                console.log(`Updated ${email} in both 'customers' (Studio) and 'allowlist' (Compass)`);
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
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    })
                }, { merge: true });
                console.log(`Added ${email} to allowlist from Stripe subscription`);
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
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});
__exportStar(require("./tools/checkPublicInfo"), exports);
__exportStar(require("./legacyApi"), exports);
//# sourceMappingURL=index.js.map